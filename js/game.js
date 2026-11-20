/* La Nona: ¡A Morfar! — reglas y lógica en tiempo real */
(function () {
  'use strict';
  const NG = window.NG, U = NG.U;

  // orden en que la Nona se los va llevando puestos
  NG.FAMILY = [
    { id: 'marta', name: 'Marta', perk: 'Arrancás cada día con +$10', bye: '¡Marta se fue a «trabajar de noche»!', loss: 'se acabó el extra de cada mañana',
      fate: 'Se fue a «trabajar de noche». En la casa nadie pregunta de qué.', grito: '¡Yo me voy, papá!' },
    { id: 'anyula', name: 'Anyula', perk: 'La comida llena un 15% más', bye: '¡Anyula se apagó como una velita!', loss: 'la comida ya no rinde tanto',
      fate: 'Le pasaba su plato a la Nona. Hasta el último.', grito: '¡Tomá, mamá, comé lo mío!' },
    { id: 'maria', name: 'María', perk: 'Mano de 5 cartas (sin ella, 4)', bye: '¡María agarró la valija!', loss: 'ahora tenés 4 cartas en mano',
      fate: 'Agarró la valija y no volvió. Dicen que ahora come tranquila.', grito: '¡Carmelo, o ella o yo!' },
    { id: 'carmelo', name: 'Carmelo', perk: 'El puesto deja +$0,55 por segundo', bye: '¡A Carmelo se le partió el corazón!', loss: 'casi no entra guita',
      fate: 'Laburó de sol a sol hasta que el corazón dijo basta.', grito: '¡No da más el puesto, Nona!' },
    { id: 'chicho', name: 'Chicho', perk: 'Distrae a la Nona: los antojos duran +1,5s', bye: '¡Chicho se quedó sin planes!', loss: '',
      fate: 'Tuvo mil planes para zafar. Ninguno contra ese apetito.', grito: '¡Tengo una idea, Nona!' },
  ];
  const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
  const MODS = {
    normal: { id: 'normal', name: 'Un día cualquiera', desc: '' },
    feria: { id: 'feria', name: 'Día de feria', desc: 'Los laburos pagan +50%', work: 1.5, nice: true },
    lluvia: { id: 'lluvia', name: 'Día de lluvia', desc: 'Todos en casa: robás cartas más rápido', draw: 0.55, nice: true },
    pastas: { id: 'pastas', name: 'Domingo de pastas', desc: 'Más antojos de pasta, y llenan +30%', pasta: true },
    insaciable: { id: 'insaciable', name: 'La Nona está insaciable', desc: 'Hambre +25%, pero puntos x2', hunger: 1.25, score: 2 },
    finmes: { id: 'finmes', name: 'Fin de mes', desc: 'El puesto rinde la mitad', income: 0.5 },
    cumple: { id: 'cumple', name: 'Cumpleaños de la Nona', desc: 'Antojos más cortos, tarantela al doble', craving: 0.75, frenzy: 2 },
    inflacion: { id: 'inflacion', name: 'Inflación', desc: 'Toda la comida cuesta $1 más', infl: 1 },
    visita: { id: 'visita', name: 'Visita de Don Francisco', desc: 'Cada tanto invita él: comida gratis un ratito', visita: true, nice: true },
  };
  const STARTER = ['pan', 'pan', 'tallarines', 'tallarines', 'milanesa', 'milanesa', 'flan', 'flan', 'mortadela', 'mortadela', 'puesto', 'puesto', 'tango'];
  const FRASES = {
    pan: ['¡Il pane!', '¿E el pancito?', '¡Pane, pane!'], pasta: ['¡La pasta!', '¡Fideo con tuco!', '¡Ma qué pastasciutta!'],
    carne: ['¡La carne!', '¡Una milanesa, ma grande!', '¡Asadito!'], dulce: ['¡Il dolce!', '¡Un postrecito!', '¡Algo dulce, per favore!'],
    picada: ['¡Formayo!', '¡Il salame!', '¡Mortadela, dale!'],
    rico: ['¡Ma qué rico!', '¡Buonísimo!', '¡Otro poquito!', '¿E… nada má?', '¡Cosa bella!', '¡Brava la cuoca!'],
    enojo: ['¡TENGO FAME!', '¿E LA COMIDA?', '¡PORCA MISERIA!', '¡MANGIARE!', '¡ME MORO DE FAME!'],
    noagrada: ['¡Esto no pedí!', '¿E quiesto qué é?', 'Bah… igual lo como'],
    dia: ['¿A qué hora se mangia?', '¿Qué hay para el desayuno?', '¡Buongiorno! ¿E la comida?', 'Tengo un hambre…', 'Un cafecito con pane, ¿eh?'],
    atracon: ['¡A MANGIARE TUTTI!', '¡QUÉ FAME TENGO!', '¡TODO PARA LA NONA!'],
    tarantela: ['¡Tarantela! ¡Tarantela!', '¡Che bella festa!'],
    pobre: ['¿No hay plata? ¡Que labure el Chicho!', '¿E la guita, Carmelo?'],
  };

  const G = (NG.game = { mode: 'title', s: null, prevMode: null });
  const handSize = () => (G.s.alive.maria ? 5 : 4);
  const mod = (k, d) => (G.s.mod[k] === undefined ? d : G.s.mod[k]);

  // ---------------------------------------------------------------- partida
  G.newRun = function () {
    NG.clearTweens(); NG.hand.clear(); NG.world.resetRun();
    const s = (G.s = {
      day: 0, hunger: 15, money: 12, score: 0, combo: 0, bestCombo: 0, platos: 0, frenzy: 0, frenzyT: 0,
      alive: {}, deck: STARTER.slice(), draw: [], discard: [], slots: [], craving: null, cravingCd: 2, lastType: null,
      fx: { siesta: 0, gratis: 0, nonaLaburo: 0, doble: 0, vino: 0, debts: [] },
      mod: MODS.normal, lastMod: null, dayT: 0, dayLen: 40, visitaT: 0, alarmT: 0, snoreT: 0,
      first: !NG.store.get('played', false), tip: 0, tipT: 0, matches: 0,
    });
    NG.FAMILY.forEach((f) => (s.alive[f.id] = true));
    NG.ui.buildFamily();
    G.startDay();
  };

  function pickMod(day) {
    if (day === 1) return MODS.normal;
    if (day % 7 === 0) return MODS.pastas;
    let pool = Object.values(MODS).filter((m) => m.id !== 'normal' && m.id !== 'pastas' && m !== G.s.lastMod);
    if (day <= 3) pool = pool.filter((m) => m.nice);
    return U.pick(pool);
  }

  G.startDay = function () {
    const s = G.s;
    s.day++;
    s.mod = pickMod(s.day); s.lastMod = s.mod;
    s.dayT = 0; s.dayLen = 40 + Math.min(s.day - 1, 5) * 2;
    s.hunger = Math.min(s.hunger, 20);
    s.draw = U.shuffle(s.deck.slice()); s.discard = [];
    NG.hand.clear();
    const n = handSize();
    NG.hand.setCount(n);
    s.slots = [];
    for (let i = 0; i < n; i++) s.slots.push({ card: null, cd: 1.25 + i * 0.13, work: null });
    s.craving = null; s.cravingCd = 2.5; s.frenzyT = 0; s.combo = 0;
    s.fx = { siesta: 0, gratis: 0, nonaLaburo: 0, doble: 0, vino: 0, debts: [] };
    s.visitaT = 7;
    if (s.alive.marta) s.money += 10;
    NG.world.setDay(s.day, DIAS[(s.day - 1) % 7]);
    G.mode = 'play';
    NG.ui.dayStart();
    const dead = NG.FAMILY.filter((f) => !s.alive[f.id]).length;
    const sub = s.mod.id !== 'normal' ? s.mod.name : dead >= 3 ? 'La mesa está cada vez más vacía' : dead >= 1 ? 'Falta un plato en la mesa… o no' : DIAS[(s.day - 1) % 7];
    NG.ui.banner('DÍA ' + s.day, sub);
    NG.audio.sfx('banner');
    NG.audio.setCalm(false);
    NG.after(1.8, () => { if (G.mode === 'play') { NG.ui.say(U.pick(FRASES.dia)); NG.world.nona.talk(0.6); } });
  };

  // ---------------------------------------------------------------- números
  G.hungerRate = () => (4.5 + 1.3 * (G.s.day - 1)) * mod('hunger', 1);
  G.cravingTime = () => (Math.max(3.2, 8 - 0.42 * (G.s.day - 1)) + (G.s.alive.chicho ? 1.5 : 0)) * mod('craving', 1);
  G.drawDelay = () => (G.s.frenzyT > 0 ? 0.16 : 0.42) * mod('draw', 1);
  G.mult = () => U.clamp(G.s.combo, 1, 10);
  G.costOf = function (d) {
    const s = G.s;
    if (d.kind === 'laburo') return 0;
    if (s.frenzyT > 0) return 0;
    if (d.kind === 'comida' && s.fx.gratis > 0) return 0;
    return d.cost + (d.kind === 'comida' ? mod('infl', 0) : 0);
  };
  G.canAfford = (d) => !!G.s && Math.floor(G.s.money) >= G.costOf(d);
  G.isMatch = function (d) {
    const s = G.s;
    if (!s || d.kind !== 'comida' || G.mode !== 'play') return false;
    if (s.frenzyT > 0) return true;
    return !!s.craving && (d.wild || d.types.indexOf(s.craving.type) >= 0);
  };
  G.addMoney = function (n, where) {
    G.s.money += n;
    NG.ui.float((n >= 0 ? '+$' : '−$') + Math.abs(n), where || 'money', n >= 0 ? 'plata' : 'mal');
    NG.ui.moneyPop();
    if (n > 0) NG.audio.sfx('coin');
  };

  // ---------------------------------------------------------------- bucle
  G.update = function (dt) {
    if (G.mode !== 'play') return;
    const s = G.s, fx = s.fx;
    s.dayT += dt;
    s.money += (s.alive.carmelo ? 0.55 : 0.2) * mod('income', 1) * dt;

    fx.siesta = Math.max(0, fx.siesta - dt); fx.gratis = Math.max(0, fx.gratis - dt);
    fx.nonaLaburo = Math.max(0, fx.nonaLaburo - dt); fx.vino = Math.max(0, fx.vino - dt);
    for (let i = fx.debts.length - 1; i >= 0; i--) {
      const d = fx.debts[i];
      d.t -= dt;
      if (d.t <= 0) {
        fx.debts.splice(i, 1);
        if (s.money >= d.amt) { s.money -= d.amt; NG.ui.float('−$' + d.amt + ' (fiado)', 'money', 'mal'); NG.ui.moneyPop(true); }
        else { s.hunger += 15; NG.ui.float('¡No hay para el fiado! +15 hambre', 'center', 'mal'); NG.ui.hungerHit(15); }
        NG.audio.sfx('error');
      }
    }
    if (s.mod.visita) {
      s.visitaT -= dt;
      if (s.visitaT <= 0) { s.visitaT = 12; fx.gratis = Math.max(fx.gratis, 3); NG.ui.float('¡Invita Don Francisco!', 'center', 'bien big'); NG.audio.sfx('select'); }
    }

    // hambre
    let rate = G.hungerRate();
    if (fx.siesta > 0) rate = 0;
    else { if (fx.vino > 0) rate *= 0.5; if (s.frenzyT > 0) rate *= 0.35; }
    s.hunger += rate * dt;
    if (fx.siesta > 0) { s.snoreT -= dt; if (s.snoreT <= 0) { s.snoreT = 1.3; NG.ui.float('Zzz', 'nona', 'big'); NG.audio.sfx('snore'); } }

    // tarantela
    if (s.frenzyT > 0) {
      s.frenzyT -= dt;
      s.frenzy = Math.max(0, (s.frenzyT / 6) * 100);
      if (s.frenzyT <= 0) { s.frenzyT = 0; s.frenzy = 0; NG.audio.frenzy = false; s.cravingCd = 0.5; }
    }

    // antojos
    if (s.frenzyT <= 0) {
      if (s.craving) {
        if (fx.siesta <= 0) s.craving.t -= dt;
        if (s.craving.t <= 0) G.missCraving();
      } else {
        s.cravingCd -= dt;
        if (s.cravingCd <= 0) G.newCraving();
      }
    }

    // mano: robar y laburos en curso
    for (let i = 0; i < s.slots.length; i++) {
      const sl = s.slots[i];
      if (sl.card) {
        if (sl.work) {
          sl.work.t += dt;
          sl.card.workK = sl.work.t / sl.work.max;
          if (sl.work.t >= sl.work.max) G.finishWork(i);
        }
      } else {
        sl.cd -= dt;
        if (sl.cd <= 0) G.drawInto(i);
      }
    }

    // alarma de peligro
    if (s.hunger > 80) { s.alarmT -= dt; if (s.alarmT <= 0) { s.alarmT = 0.55; NG.audio.sfx('alarm'); } }
    NG.audio.intensity = U.clamp(s.hunger / 100, 0, 1) * 0.75 + Math.min(0.25, (s.day - 1) * 0.03);

    if (s.first) tips(dt);

    if (s.hunger >= 100) G.atracon();
    else if (s.dayT >= s.dayLen) G.endDay();
  };

  function tips(dt) {
    const s = G.s;
    if (s.day > 2) return;
    s.tipT += dt;
    if (s.tip === 0 && s.dayT > 2.8) { s.tip = 1; s.tipT = 0; NG.ui.tip('La carta que BRILLA es justo lo que se le antoja'); }
    else if (s.tip === 1 && (s.matches > 0 || s.tipT > 9)) { s.tip = 2; s.tipT = 0; NG.ui.tip(s.matches > 0 ? '¡Eso! Seguí acertando para subir el COMBO' : 'Cualquier comida le baja el hambre'); }
    else if (s.tip === 2 && s.tipT > 4.5) { s.tip = 3; s.tipT = 0; NG.ui.tip('¿Sin guita? Mandá a Carmelo al puesto'); }
    else if (s.tip === 3 && s.tipT > 5) { s.tip = 4; s.tipT = 0; NG.ui.tip('¿Mano fea? Clic derecho descarta una carta'); }
    else if (s.tip === 4 && s.tipT > 5) { s.tip = 5; NG.ui.tip(''); }
  }

  // ---------------------------------------------------------------- mazo
  G.drawInto = function (i) {
    const s = G.s, sl = s.slots[i];
    if (!s.draw.length) {
      if (!s.discard.length) { sl.cd = 0.5; return; }
      s.draw = U.shuffle(s.discard); s.discard = [];
      sl.cd = 0.35; // barajar tarda un toque
      NG.audio.sfx('discard');
      return;
    }
    const id = s.draw.pop();
    sl.card = NG.hand.spawn(i, id);
    sl.work = null;
    NG.audio.sfx('draw');
  };
  function freeSlot(i, cd) {
    const sl = G.s.slots[i];
    sl.card = null; sl.work = null;
    sl.cd = cd === undefined ? G.drawDelay() : cd;
  }
  G.redrawHand = function () {
    const s = G.s;
    s.slots.forEach((sl, i) => {
      if (sl.card && !sl.work) {
        s.discard.push(sl.card.id);
        NG.hand.toDiscard(sl.card, i * 0.04);
        freeSlot(i, 0.18 + i * 0.07);
      }
    });
  };

  // ---------------------------------------------------------------- jugar cartas
  G.playSlot = function (i) {
    const s = G.s;
    if (G.mode !== 'play' || !s) return false;
    const sl = s.slots[i];
    if (!sl || !sl.card || sl.work || sl.card.state !== 'hand') return false;
    const card = sl.card, d = card.def, cost = G.costOf(d);
    if (Math.floor(s.money) < cost) {
      NG.hand.shake(card); NG.audio.sfx('error'); NG.ui.moneyPop(true);
      NG.ui.float('¡No alcanza!', NG.hand.slotScreen(i), 'mal');
      if (Math.random() < 0.35) NG.ui.say(U.pick(FRASES.pobre));
      return false;
    }
    s.money -= cost;
    const pos = NG.hand.slotScreen(i);
    if (d.kind === 'laburo' && d.work > 0) {
      sl.work = { t: 0, max: d.work };
      NG.hand.setWorking(card, true);
      NG.audio.sfx('work');
      return true;
    }
    freeSlot(i);
    if (d.burn) { const k = s.deck.indexOf(d.id); if (k >= 0) s.deck.splice(k, 1); }
    else s.discard.push(d.id);
    if (d.kind === 'comida') { NG.audio.sfx('card'); G.feed(card, d, pos, 0); }
    else {
      NG.audio.sfx(d.kind === 'artimana' ? 'scheme' : 'card');
      NG.hand.poof(card);
      if (d.kind === 'artimana') NG.ui.float(d.fx, 'center', 'big');
      if (d.play) d.play(G, pos);
    }
    return true;
  };

  G.discardSlot = function (i) {
    const s = G.s;
    if (G.mode !== 'play' || !s) return false;
    const sl = s.slots[i];
    if (!sl || !sl.card || sl.work || sl.card.state !== 'hand') return false;
    s.discard.push(sl.card.id);
    NG.hand.toDiscard(sl.card);
    freeSlot(i, 0.85);
    NG.audio.sfx('discard');
    return true;
  };

  G.finishWork = function (i) {
    const s = G.s, sl = s.slots[i], card = sl.card, d = card.def;
    const pos = NG.hand.slotScreen(i);
    const pay = Math.round(d.pay * mod('work', 1));
    if (pay > 0) G.addMoney(pay, pos);
    if (d.onDone) d.onDone(G, pos);
    s.discard.push(d.id);
    NG.hand.setWorking(card, false);
    NG.hand.toMoney(card);
    freeSlot(i);
  };

  G.feed = function (card, d, pos, delay) {
    const s = G.s, frenzy = s.frenzyT > 0, cr = s.craving;
    const matched = frenzy || (!!cr && (d.wild || d.types.indexOf(cr.type) >= 0));
    let sat = d.sat;
    if (s.alive.anyula) sat *= 1.15;
    if (s.mod.pasta && d.types.indexOf('pasta') >= 0) sat *= 1.3;
    if (s.fx.doble > 0) { sat *= 2; s.fx.doble--; }
    if (matched) sat *= 1.4;
    sat = Math.round(sat);
    s.hunger = Math.max(0, s.hunger - sat);
    s.platos++;
    NG.ui.hungerHit(-sat);
    if (s.fx.nonaLaburo > 0) G.addMoney(3, 'nona');
    if (d.onFeed) d.onFeed(G, matched);
    if (matched) {
      s.combo++; s.matches++;
      if (s.combo > s.bestCombo) s.bestCombo = s.combo;
      const m = G.mult();
      const pts = Math.round((60 + sat) * m * mod('score', 1));
      s.score += pts;
      NG.audio.sfx('match', s.combo);
      NG.ui.comboPop();
      NG.ui.float(frenzy ? '+' + pts : '¡JUSTO! x' + m, 'antojo', 'justo');
      if (!frenzy) {
        s.frenzy = Math.min(100, s.frenzy + (5 + Math.min(s.combo, 3)) * mod('frenzy', 1));
        s.craving = null; s.cravingCd = 0.32;
        if (Math.random() < 0.3) NG.ui.say(U.pick(FRASES.rico));
        if (s.frenzy >= 100) G.startFrenzy();
      }
    } else {
      s.score += 10;
      if (cr && s.combo > 0) { s.combo = 0; NG.ui.float('¡ESO NO! Combo perdido', 'antojo', 'mal'); NG.audio.sfx('error'); }
      if (cr && Math.random() < 0.5) NG.ui.say(U.pick(FRASES.noagrada));
    }
    NG.hand.toPlate(card, () => { NG.world.serve(d.art, frenzy); }, delay);
  };

  G.ollaPopular = function () {
    const s = G.s;
    let k = 0;
    s.slots.forEach((sl, i) => {
      if (sl.card && !sl.work && sl.card.def.kind === 'comida' && sl.card.state === 'hand') {
        const card = sl.card;
        s.discard.push(card.id);
        freeSlot(i, 0.3 + k * 0.1);
        G.feed(card, card.def, NG.hand.slotScreen(i), k * 0.13);
        k++;
      }
    });
    if (!k) NG.ui.float('No había nada para la olla…', 'center', 'mal');
  };

  // ---------------------------------------------------------------- antojos
  G.newCraving = function () {
    const s = G.s;
    const active = s.day === 1 ? ['pan', 'pasta', 'carne', 'dulce'] : ['pan', 'pasta', 'carne', 'dulce', 'picada'];
    const inHand = {};
    s.slots.forEach((sl) => { if (sl.card && sl.card.def.kind === 'comida') sl.card.def.types.forEach((t) => { if (active.indexOf(t) >= 0) inHand[t] = 1; }); });
    const handTypes = Object.keys(inHand);
    const fair = Math.max(0.3, 0.7 - 0.05 * s.day);
    let pool = handTypes.length && Math.random() < fair ? handTypes : active.slice();
    if (s.mod.pasta && Math.random() < 0.45) pool = ['pasta'];
    const alt = pool.filter((t) => t !== s.lastType);
    const type = U.pick(alt.length ? alt : pool);
    s.lastType = type;
    const max = G.cravingTime();
    s.craving = { type, t: max, max };
    NG.ui.cravingNew();
    NG.world.nona.talk(0.45);
    NG.audio.sfx('talk', 3);
    if (Math.random() < 0.35) NG.ui.say(U.pick(FRASES[type]));
  };

  G.missCraving = function () {
    const s = G.s;
    s.craving = null; s.cravingCd = 0.7;
    s.hunger += 10; s.combo = 0;
    NG.ui.hungerHit(10);
    NG.ui.float('¡TARDE! +10', 'antojo', 'mal');
    NG.ui.say(U.pick(FRASES.enojo));
    NG.audio.sfx('miss');
    NG.world.nona.talk(0.7);
    NG.view.shake = Math.max(NG.view.shake, 0.12);
  };

  G.startFrenzy = function () {
    const s = G.s;
    s.frenzyT = 6; s.frenzy = 100; s.craving = null;
    NG.audio.frenzy = true;
    NG.audio.sfx('frenzy');
    NG.ui.banner('¡TARANTELA!', 'Todo gratis, todo le gusta', true);
    NG.ui.say(U.pick(FRASES.tarantela));
    NG.ui.flash();
    NG.world.kickLamp(1.6);
    // roba al toque lo que falte
    s.slots.forEach((sl) => { if (!sl.card) sl.cd = Math.min(sl.cd, 0.1); });
  };

  // ---------------------------------------------------------------- atracón
  G.atracon = function () {
    const s = G.s;
    G.mode = 'atracon';
    s.combo = 0; s.frenzy = 0; s.frenzyT = 0; s.craving = null;
    NG.audio.frenzy = false;
    const victim = NG.FAMILY.find((f) => s.alive[f.id]);
    NG.world.nona.roar(2.0);
    NG.audio.sfx('roar');
    NG.view.shake = 0.6;
    NG.world.kickLamp(3);
    NG.ui.flash();
    NG.ui.tip('');
    NG.ui.banner('¡ATRACÓN!', 'La Nona se morfa todo', true);
    NG.ui.say(U.pick(FRASES.atracon));
    s.slots.forEach((sl, i) => {
      if (sl.card) {
        s.discard.push(sl.card.id);
        NG.hand.setWorking(sl.card, false);
        NG.hand.toMouth(sl.card, 0.3 + i * 0.09, () => NG.audio.sfx('chomp'));
        sl.card = null; sl.work = null; sl.cd = 99;
      }
    });
    NG.after(1.25, () => {
      s.alive[victim.id] = false;
      NG.world.setPortrait(victim.id, false);
      NG.ui.familyLost(victim.id);
      NG.ui.float('«' + victim.grito + '»', 'center', 'big');
      NG.audio.sfx('lost');
      NG.view.shake = 0.25;
      const left = NG.FAMILY.some((f) => s.alive[f.id]);
      NG.ui.banner(victim.bye, left ? 'Sin ' + victim.name + ': ' + victim.loss : 'Ya no queda nadie…', true);
    });
    NG.after(2.75, () => {
      if (!NG.FAMILY.some((f) => s.alive[f.id])) return G.gameOver();
      s.hunger = 35;
      const n = handSize();
      NG.hand.setCount(n);
      s.slots = [];
      for (let i = 0; i < n; i++) s.slots.push({ card: null, cd: 0.15 + i * 0.1, work: null });
      s.fx.siesta = 0; s.cravingCd = 1.5;
      G.mode = 'play';
    });
  };

  // ---------------------------------------------------------------- fin del día y premios
  G.endDay = function () {
    const s = G.s;
    G.mode = 'reward';
    s.score += 250 * s.day;
    s.slots.forEach((sl, i) => { if (sl.card) { NG.hand.setWorking(sl.card, false); NG.hand.toDeck(sl.card, i * 0.05); sl.card = null; sl.work = null; } });
    s.frenzyT = 0; s.craving = null; NG.audio.frenzy = false;
    if (s.frenzy >= 100) s.frenzy = 0;
    NG.audio.sfx('dayEnd');
    NG.audio.setCalm(true);
    NG.ui.tip('');
    NG.ui.banner('¡ZAFARON!', 'Sobrevivieron al ' + DIAS[(s.day - 1) % 7].toLowerCase() + ' · +' + 250 * s.day + ' puntos', true);
    NG.after(1.15, () => NG.ui.showReward(G.makeRewards()));
  };

  G.makeRewards = function () {
    const s = G.s, day = s.day, C = NG.CARDS;
    const pool = Object.values(C).filter((c) => c.rar > 0);
    const w = (c) => (c.rar === 1 ? 60 : c.rar === 2 ? 24 + day * 2 : 5 + day * 2);
    const opts = [], used = {};
    while (opts.length < 3) {
      const c = U.wpick(pool.filter((c) => !used[c.id]), w);
      used[c.id] = 1; opts.push({ type: 'card', id: c.id });
    }
    if (!opts.some((o) => C[o.id].kind === 'comida')) {
      const foods = pool.filter((c) => c.kind === 'comida' && !used[c.id]);
      opts[0] = { type: 'card', id: U.wpick(foods, w).id };
    }
    const dead = NG.FAMILY.filter((f) => !s.alive[f.id]);
    if (dead.length && day % 3 === 0) opts[2] = { type: 'revive', id: dead[dead.length - 1].id };
    else if (day % 2 === 0 && s.deck.length > 9) {
      const weak = ['pan', 'mortadela', 'flan', 'tallarines', 'milanesa'].find((id) => s.deck.indexOf(id) >= 0);
      if (weak) opts[2] = { type: 'purge', id: weak };
    }
    return opts;
  };

  G.chooseReward = function (o) {
    const s = G.s;
    if (G.mode !== 'reward') return;
    if (!o) s.money += 8;
    else if (o.type === 'card') s.deck.push(o.id);
    else if (o.type === 'purge') { const k = s.deck.indexOf(o.id); if (k >= 0) s.deck.splice(k, 1); }
    else if (o.type === 'revive') { s.alive[o.id] = true; NG.world.setPortrait(o.id, true); NG.ui.buildFamily(); }
    NG.audio.sfx('select');
    G.startDay();
  };

  // ---------------------------------------------------------------- fin
  G.gameOver = function () {
    const s = G.s;
    G.mode = 'over';
    const best = NG.store.get('best', { score: 0, day: 0 });
    const rec = s.score > best.score;
    if (rec) NG.store.set('best', { score: s.score, day: s.day });
    NG.store.set('played', true);
    NG.audio.sfx('gameover');
    NG.audio.setCalm(true);
    NG.hand.clear();
    NG.ui.showOver({ day: s.day, score: s.score, platos: s.platos, combo: s.bestCombo, rec, best: rec ? s.score : best.score, alive: Object.assign({}, s.alive) });
  };

  G.pause = function (on) {
    if (on && (G.mode === 'play' || G.mode === 'atracon')) { G.prevMode = G.mode; G.mode = 'paused'; NG.ui.showPause(true); NG.audio.suspend(); }
    else if (!on && G.mode === 'paused') { G.mode = G.prevMode; NG.ui.showPause(false); NG.audio.resume(); }
  };
  G.toTitle = function () {
    NG.clearTweens(); NG.hand.clear();
    G.mode = 'title'; G.s = null;
    NG.audio.frenzy = false; NG.audio.resume(); NG.audio.setCalm(true);
    NG.world.resetRun();
    NG.ui.showTitle();
  };
})();
