/* La Nona: ¡A Morfar! — render, cámara, controles, HUD y pantallas */
(function () {
  'use strict';
  const NG = window.NG, U = NG.U;
  const $ = (id) => document.getElementById(id);

  function fail(msg) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('show'));
    $('errMsg').innerHTML = msg;
    $('scrError').classList.add('show');
  }
  if (!window.THREE) { fail('No se pudo cargar three.js. Revisá la conexión a internet y recargá la página.'); return; }
  const T = THREE;

  // =====================================================================
  //                               VISTA
  // =====================================================================
  const V = (NG.view = { shake: 0, time: 0, w: 1, h: 1 });
  let renderer, scene, cam, uiScene, uiCam;
  const camBase = { pos: new T.Vector3(0, 2.75, 4.3), look: new T.Vector3(0, 1.5, -0.9), fov: 42 };
  const tmpV = new T.Vector3();

  V.worldToUI = function (p, z) {
    tmpV.copy(p).project(cam);
    const half = (10 - (z || 0)) * Math.tan((15 * Math.PI) / 180);
    return new T.Vector3(tmpV.x * half * (V.w / V.h), tmpV.y * half, z || 0);
  };
  V.uiToScreen = function (p) {
    const nx = p.x / (NG.hand.viewW / 2), ny = p.y / (NG.hand.viewH / 2);
    return { x: (nx * 0.5 + 0.5) * V.w, y: (-ny * 0.5 + 0.5) * V.h };
  };
  V.worldToScreen = function (p) {
    tmpV.copy(p).project(cam);
    return { x: (tmpV.x * 0.5 + 0.5) * V.w, y: (-tmpV.y * 0.5 + 0.5) * V.h };
  };

  function resize() {
    V.w = window.innerWidth; V.h = window.innerHeight;
    const a = V.w / V.h;
    renderer.setSize(V.w, V.h, false);
    if (a < 1) { camBase.fov = 62; camBase.pos.set(0, 3.0, 5.3); camBase.look.set(0, 1.85, -0.9); }
    else if (a < 1.4) { camBase.fov = 48; camBase.pos.set(0, 2.85, 4.6); camBase.look.set(0, 1.45, -0.9); }
    else { camBase.fov = 42; camBase.pos.set(0, 2.75, 4.3); camBase.look.set(0, 1.5, -0.9); }
    cam.aspect = a; cam.fov = camBase.fov; cam.updateProjectionMatrix();
    uiCam.aspect = a; uiCam.updateProjectionMatrix();
    NG.hand.resize(a);
  }

  // =====================================================================
  //                                UI
  // =====================================================================
  const ui = (NG.ui = {});
  const els = {};
  const dataURL = {};
  function urlOf(key, canvas) { return dataURL[key] || (dataURL[key] = canvas.toDataURL()); }
  function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
  }

  function resolvePos(where) {
    if (where && typeof where === 'object') return where;
    if (where === 'money') { const r = els.guita.getBoundingClientRect(); return { x: r.right + 30, y: r.top + r.height / 2 }; }
    if (where === 'nona') return V.worldToScreen(NG.world.mouthPos);
    if (where === 'antojo') { const r = els.antojo.getBoundingClientRect(); if (r.width) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    if (where === 'hambre') { const r = els.hambreBar.getBoundingClientRect(); return { x: r.left + r.width * U.clamp(NG.game.s.hunger / 100, 0.05, 0.95), y: r.bottom + 18 }; }
    return { x: V.w / 2, y: V.h * 0.42 };
  }
  ui.float = function (text, where, cls) {
    const p = resolvePos(where);
    const d = document.createElement('div');
    d.className = 'float ' + (cls || '');
    d.textContent = text;
    d.style.left = p.x + U.rand(-14, 14) + 'px';
    d.style.top = p.y + U.rand(-8, 8) + 'px';
    els.floats.appendChild(d);
    setTimeout(() => d.remove(), 1000);
    if (els.floats.children.length > 24) els.floats.firstChild.remove();
  };
  ui.banner = function (t, s, fast) {
    els.bannerT.textContent = t; els.bannerS.textContent = s || '';
    els.banner.classList.toggle('rapido', !!fast);
    restartAnim(els.banner, 'on');
  };
  ui.flash = () => restartAnim(els.flash, 'go');
  ui.moneyPop = (bad) => restartAnim(els.guita, bad ? 'no' : 'pop');
  ui.comboPop = () => restartAnim(els.combo, 'pop');
  ui.hungerHit = function (delta) {
    restartAnim(els.hambreBar, 'hit');
    setTimeout(() => els.hambreBar.classList.remove('hit'), 120);
    ui.float((delta < 0 ? '−' : '+') + Math.abs(delta), 'hambre', delta < 0 ? 'bien' : 'mal');
  };
  let tipTimer = 0;
  ui.tip = function (txt) {
    clearTimeout(tipTimer);
    if (!txt) { els.tip.classList.remove('on'); return; }
    els.tip.textContent = txt; els.tip.classList.add('on');
    tipTimer = setTimeout(() => els.tip.classList.remove('on'), 4200);
  };
  let sayTimer = 0;
  ui.say = function (txt) {
    els.globo.textContent = txt; els.globo.classList.add('on');
    clearTimeout(sayTimer); sayTimer = setTimeout(() => els.globo.classList.remove('on'), 1300);
  };
  ui.cravingNew = () => restartAnim(els.antojo, 'nuevo');

  ui.buildFamily = function () {
    const s = NG.game.s;
    els.familia.innerHTML = '';
    NG.FAMILY.forEach((f) => {
      const alive = !s || s.alive[f.id];
      const d = document.createElement('div');
      d.className = 'fam' + (alive ? '' : ' muerto');
      d.id = 'fam_' + f.id;
      d.title = f.name + (alive ? ': ' + f.perk : ' (ya no está)');
      const img = document.createElement('img');
      img.src = urlOf('face_' + f.id + alive, NG.world.faceCanvas(f.id, !alive));
      d.appendChild(img);
      els.familia.appendChild(d);
    });
  };
  ui.familyLost = function (id) {
    ui.buildFamily();
    const d = $('fam_' + id); if (d) restartAnim(d, 'cae');
  };

  ui.dayStart = function () {
    showScreen(null);
    els.hud.classList.remove('hidden');
    ui.buildFamily();
    const m = NG.game.s.mod;
    els.modTxt.textContent = m.desc ? m.name + ': ' + m.desc : '';
  };
  ui.showTitle = function () {
    els.hud.classList.add('hidden');
    const b = NG.store.get('best', null);
    els.record.textContent = b && b.score ? `Récord: ${b.score.toLocaleString('es-AR')} puntos · aguantaron ${b.day} día${b.day === 1 ? '' : 's'}` : '';
    showScreen('scrTitle');
  };
  ui.showPause = (on) => showScreen(on ? 'scrPausa' : null);

  ui.showReward = function (opts) {
    const s = NG.game.s;
    els.rewardT.textContent = `¡Sobrevivieron al día ${s.day}!`;
    els.rewardS.textContent = 'Elegí qué sumar al mazo para mañana. La Nona va a tener más hambre.';
    els.rewardOpts.innerHTML = '';
    const C = NG.CARDS;
    opts.forEach((o) => {
      const d = document.createElement('div');
      if (o.type === 'card') {
        const c = C[o.id];
        d.className = 'opt';
        const tag = c.rar === 3 ? '<span class="tag r3">ÉPICA</span>' : c.rar === 2 ? '<span class="tag r2">RARA</span>' : '';
        d.innerHTML = tag + `<img alt="${c.name}" src="${urlOf('card_' + o.id, NG.cardCanvas(o.id))}">`;
      } else if (o.type === 'revive') {
        const f = NG.FAMILY.find((x) => x.id === o.id);
        d.className = 'opt esp';
        d.innerHTML = `<img alt="" src="${urlOf('face_' + f.id + true, NG.world.faceCanvas(f.id, false))}"><h3>¡Vuelve ${f.name}!</h3><p>${f.perk}</p>`;
      } else {
        const c = C[o.id];
        d.className = 'opt esp';
        d.innerHTML = `<div class="ico">✂</div><h3>Sacar «${c.name}»</h3><p>Una carta floja menos en el mazo: robás mejores cartas más seguido.</p>`;
      }
      d.addEventListener('click', () => NG.game.chooseReward(o));
      d.addEventListener('pointerenter', () => NG.audio.sfx('hover'));
      els.rewardOpts.appendChild(d);
    });
    showScreen('scrReward');
  };

  ui.showOver = function (st) {
    els.hud.classList.add('hidden');
    const frases = ['«¿E… no hay más nada? Tengo un hambre…»', '«¿Y el postre? ¿Nadie trae el postre?»', '«¿Dónde se fueron todos? ¡Tengo fame!»',
      '«Bueno… ahora me voy a lo de los vecinos.»', '«¿Un pancito no queda? Uno solo…»'];
    $('overSub').textContent = frases[Math.floor(Math.random() * frases.length)];
    $('overFates').innerHTML = NG.FAMILY.filter((f) => !st.alive[f.id]).map((f, i) =>
      `<div class="fate" style="animation-delay:${(0.15 * i).toFixed(2)}s"><img alt="" src="${urlOf('face_' + f.id + false, NG.world.faceCanvas(f.id, true))}"><div><b>${f.name}.</b>${f.fate}</div></div>`).join('');
    $('overStats').innerHTML =
      `<div class="stat"><b>${st.day}</b><span>días</span></div>` +
      `<div class="stat"><b>${st.score.toLocaleString('es-AR')}</b><span>puntos</span></div>` +
      `<div class="stat"><b>${st.platos}</b><span>platos</span></div>` +
      `<div class="stat"><b>x${st.combo}</b><span>mejor combo</span></div>`;
    $('overRecord').textContent = st.rec ? '¡NUEVO RÉCORD!' : 'Récord: ' + st.best.toLocaleString('es-AR');
    setTimeout(() => { if (NG.game.mode === 'over') showScreen('scrOver'); }, 900);
  };

  // ---------- HUD por frame ----------
  const last = {};
  function setText(el, key, v) { if (last[key] !== v) { last[key] = v; el.textContent = v; } }
  function setStyle(el, key, prop, v) { if (last[key] !== v) { last[key] = v; el.style[prop] = v; } }
  function setClass(el, cls, on) { if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on); }
  const RELOJ = ['MAÑANA', 'MEDIODÍA', 'TARDE', 'NOCHE'];

  function updateHUD() {
    const G = NG.game, s = G.s;
    if (!s || (G.mode !== 'play' && G.mode !== 'atracon' && G.mode !== 'paused')) {
      setClass(els.antojo, 'on', false);
      els.vignette.style.opacity = 0;
      return;
    }
    const h = U.clamp(s.hunger / 100, 0, 1);
    setStyle(els.hambreFill, 'hf', 'width', (h * 100).toFixed(1) + '%');
    setClass(els.hambreBar, 'peligro', h > 0.75);
    els.vignette.style.opacity = h > 0.65 ? ((h - 0.65) / 0.35) * (0.75 + 0.25 * Math.sin(V.time * 9)) : 0;
    setStyle(els.frenesiFill, 'ff', 'width', s.frenzy.toFixed(1) + '%');
    setClass(els.frenesiBar, 'on', s.frenzyT > 0);
    setText(els.guitaN, 'g', String(Math.floor(s.money)));
    setText(els.puntos, 'p', s.score.toLocaleString('es-AR'));
    setText(els.combo, 'c', 'COMBO x' + G.mult());
    setClass(els.combo, 'vivo', s.combo > 1);
    setText(els.diaN, 'd', 'DÍA ' + s.day);
    const dk = U.clamp(s.dayT / s.dayLen, 0, 1);
    setStyle(els.relojFill, 'rf', 'width', (dk * 100).toFixed(1) + '%');
    setText(els.relojTxt, 'rt', RELOJ[Math.min(3, Math.floor(dk * 4))]);
    setText(els.mazoN, 'mz', String(s.draw.length));
    setText(els.descN, 'ds', String(s.discard.length));

    // efectos activos
    const fx = s.fx, chips = [];
    if (fx.siesta > 0) chips.push(['b', 'Siesta ' + fx.siesta.toFixed(1) + 's']);
    if (fx.gratis > 0) chips.push(['g', 'Comida gratis ' + fx.gratis.toFixed(1) + 's']);
    if (fx.nonaLaburo > 0) chips.push(['y', 'Nona laburando ' + fx.nonaLaburo.toFixed(1) + 's']);
    if (fx.doble > 0) chips.push(['p', 'Próxima comida x2' + (fx.doble > 1 ? ' (' + fx.doble + ')' : '')]);
    if (fx.vino > 0) chips.push(['r', 'Vinito ' + fx.vino.toFixed(1) + 's']);
    fx.debts.forEach((d) => chips.push(['r', 'Fiado: $' + d.amt + ' en ' + Math.ceil(d.t) + 's']));
    const html = chips.map((c) => `<div class="efx ${c[0]}">${c[1]}</div>`).join('');
    if (last.fx !== html) { last.fx = html; els.efectos.innerHTML = html; }

    // familiar en peligro
    const next = NG.FAMILY.find((f) => s.alive[f.id]);
    NG.FAMILY.forEach((f) => { const d = $('fam_' + f.id); if (d) setClass(d, 'sig', !!next && f.id === next.id && h > 0.75); });

    // globo del antojo, pegado a la cabeza de la Nona
    const show = G.mode === 'play' && (s.craving || s.frenzyT > 0);
    setClass(els.antojo, 'on', !!show);
    if (show) {
      const p = V.worldToScreen(tmpHead.set(0.62, 2.55, -1.1));
      els.antojo.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translateY(-100%)`;
      if (s.frenzyT > 0) {
        setClass(els.antojo, 'frenesi', true); setClass(els.antojo, 'apuro', false);
        setText(els.antojoNombre, 'an', '¡TODO!');
        const src = urlOf('thumb_banquete', NG.thumbs.banquete);
        if (last.ai !== src) { last.ai = src; els.antojoImg.src = src; }
        els.antojoFill.style.transform = `scaleX(${(s.frenzyT / 6).toFixed(3)})`;
        els.antojoFill.style.background = '#e0489a';
      } else {
        setClass(els.antojo, 'frenesi', false);
        const ty = NG.TYPES[s.craving.type], k = s.craving.t / s.craving.max;
        setText(els.antojoNombre, 'an', ty.name);
        const src = urlOf('thumb_' + ty.art, NG.thumbs[ty.art]);
        if (last.ai !== src) { last.ai = src; els.antojoImg.src = src; }
        els.antojoFill.style.transform = `scaleX(${Math.max(0, k).toFixed(3)})`;
        els.antojoFill.style.background = k > 0.5 ? '#2c8a57' : k > 0.25 ? '#e0a020' : '#c8281c';
        setClass(els.antojo, 'apuro', k < 0.3);
      }
    }
    if (els.globo.classList.contains('on')) {
      const p = V.worldToScreen(tmpHead.set(-0.45, 2.25, -1.0));
      els.globo.style.left = p.x + 'px'; els.globo.style.top = p.y + 'px';
    }
  }
  const tmpHead = new T.Vector3();

  // =====================================================================
  //                              CONTROLES
  // =====================================================================
  let pointerNDC = null, press = null;
  function ndcOf(e) { return { x: (e.clientX / V.w) * 2 - 1, y: -(e.clientY / V.h) * 2 + 1 }; }
  function bindInput() {
    const cv = renderer.domElement;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointermove', (e) => {
      NG.hand.touch = e.pointerType === 'touch';
      pointerNDC = ndcOf(e);
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 25) { clearTimeout(press.timer); press = null; }
    });
    cv.addEventListener('pointerleave', () => { pointerNDC = null; });
    cv.addEventListener('pointerdown', (e) => {
      NG.audio.init();
      NG.hand.touch = e.pointerType === 'touch';
      pointerNDC = ndcOf(e);
      if (NG.game.mode !== 'play') return;
      const slot = NG.hand.hoverAt(pointerNDC.x, pointerNDC.y);
      if (slot < 0) return;
      if (e.button === 2) { NG.game.discardSlot(slot); return; }
      if (e.pointerType === 'touch') {
        // tocar = jugar, mantener = descartar
        press = { slot, x: e.clientX, y: e.clientY, long: false };
        press.timer = setTimeout(() => { if (press) { press.long = true; NG.game.discardSlot(press.slot); } }, 380);
        return;
      }
      if (e.button === 0) NG.game.playSlot(slot);
    });
    cv.addEventListener('pointerup', (e) => {
      if (!press) return;
      clearTimeout(press.timer);
      if (!press.long) NG.game.playSlot(press.slot);
      press = null;
      if (e.pointerType === 'touch') pointerNDC = null;
    });
    window.addEventListener('keydown', (e) => {
      NG.audio.init();
      const G = NG.game;
      const m = /^(Digit|Numpad)([1-5])$/.exec(e.code);
      if (m) {
        const i = +m[2] - 1;
        if (G.mode === 'play') { if (e.shiftKey) G.discardSlot(i); else G.playSlot(i); }
        else if (G.mode === 'reward') { const o = els.rewardOpts.children[i]; if (o) o.click(); }
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') { G.pause(G.mode !== 'paused'); e.preventDefault(); }
      else if (e.code === 'KeyM') toggleMute();
      else if ((e.code === 'Enter' || e.code === 'Space') && G.mode === 'title') { $('btnJugar').click(); e.preventDefault(); }
      else if ((e.code === 'Enter' || e.code === 'Space') && G.mode === 'over' && $('scrOver').classList.contains('show')) { $('btnRetry').click(); e.preventDefault(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) NG.game.pause(true); });
    window.addEventListener('blur', () => NG.game.pause(true));
    window.addEventListener('resize', resize);

    let comoFromPlay = false;
    const start = () => { NG.audio.init(); NG.audio.sfx('select'); NG.game.newRun(); };
    $('btnJugar').onclick = () => {
      NG.audio.init();
      if (!NG.store.get('help', false)) { comoFromPlay = true; NG.store.set('help', true); showScreen('scrComo'); NG.audio.sfx('select'); }
      else start();
    };
    $('btnComo').onclick = () => { NG.audio.init(); comoFromPlay = false; showScreen('scrComo'); NG.audio.sfx('select'); };
    $('btnComoOk').onclick = () => { if (comoFromPlay) start(); else { NG.audio.sfx('select'); ui.showTitle(); } };
    $('btnSkip').onclick = () => NG.game.chooseReward(null);
    $('btnRetry').onclick = start;
    $('btnMenu').onclick = () => NG.game.toTitle();
    $('btnSeguir').onclick = () => NG.game.pause(false);
    $('btnSalir').onclick = () => { NG.game.pause(false); NG.game.toTitle(); };
    $('btnPausa').onclick = () => NG.game.pause(true);
    $('btnMute').onclick = toggleMute;
    document.querySelectorAll('.btn').forEach((b) => b.addEventListener('pointerenter', () => NG.audio.sfx('hover')));
  }
  function toggleMute() { NG.audio.init(); const m = NG.audio.toggleMute(); els.btnMute.classList.toggle('off', m); }

  // =====================================================================
  //                                BUCLE
  // =====================================================================
  let lastT = 0;
  const camPos = new T.Vector3(), camLook = new T.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    step(dt);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.clearDepth();
    renderer.render(uiScene, uiCam);
  }
  // depuración: avanza el juego N segundos sin esperar al navegador
  NG.debugStep = function (sec) { for (let t = 0; t < sec; t += 1 / 30) step(1 / 30); renderer.clear(); renderer.render(scene, cam); renderer.clearDepth(); renderer.render(uiScene, uiCam); };
  function step(dt) {
    const G = NG.game;
    if (G.mode !== 'paused') {
      V.time += dt;
      NG.updateTweens(dt);
      G.update(dt);
      const s = G.s;
      let st;
      if (s && (G.mode === 'play' || G.mode === 'atracon')) st = { hunger: U.clamp(s.hunger / 100, 0, 1), sleep: s.fx.siesta > 0, party: s.frenzyT > 0, dayK: s.dayT / s.dayLen };
      else if (G.mode === 'title') st = { hunger: 0.35 + 0.3 * Math.sin(V.time * 0.4), sleep: false, party: false, dayK: 0.3 };
      else st = { hunger: 0.1, sleep: false, party: G.mode === 'reward', dayK: 0.95 };
      st.gloom = s && G.mode !== 'title' ? NG.FAMILY.filter((f) => !s.alive[f.id]).length / NG.FAMILY.length : 0;
      NG.world.update(dt, st);
      if (G.mode === 'over' && Math.random() < dt * 0.9) NG.world.nona.chomp(3); // la Nona sigue comiendo
      if (G.mode === 'atracon' && s) st.hunger = 1;
      NG.hand.hoverAt(G.mode === 'play' && pointerNDC && !NG.hand.touch ? pointerNDC.x : null, pointerNDC ? pointerNDC.y : 0);
      NG.hand.showDeck(!!s && G.mode !== 'title' && G.mode !== 'over');
      NG.hand.update(dt, G);
      // cámara: en el título orbita despacito; en juego respira y tiembla
      V.shake = Math.max(0, V.shake - dt * 1.6);
      camPos.copy(camBase.pos); camLook.copy(camBase.look);
      if (G.mode === 'title' || G.mode === 'over') {
        camPos.x += Math.sin(V.time * 0.25) * 0.9; camPos.y += 0.15; camPos.z -= 0.4;
        camLook.y += 0.25;
      } else {
        const h = s ? U.clamp(s.hunger / 100, 0, 1) : 0;
        camPos.z -= h * 0.35; camPos.y -= h * 0.08;
        if (s && s.frenzyT > 0) camPos.x += Math.sin(V.time * 6) * 0.08;
      }
      const sh = V.shake * V.shake;
      camPos.x += (Math.random() - 0.5) * sh * 0.5; camPos.y += (Math.random() - 0.5) * sh * 0.5;
      cam.position.lerp(camPos, 1 - Math.exp(-6 * dt));
      cam.lookAt(camLook);
      updateHUD();
    }
  }

  // =====================================================================
  //                              ARRANQUE
  // =====================================================================
  function galeria() {
    const d = document.createElement('div'); d.id = 'dbgModelos';
    NG.models.names.forEach((n) => { const f = document.createElement('figure'); f.appendChild(NG.thumbs[n]); f.appendChild(document.createTextNode(n)); d.appendChild(f); });
    Object.keys(NG.CARDS).forEach((id) => { const f = document.createElement('figure'); const im = new Image(); im.src = NG.cardCanvas(id).toDataURL(); f.appendChild(im); f.appendChild(document.createTextNode(id)); d.appendChild(f); });
    NG.FAMILY.forEach((fm) => { const f = document.createElement('figure'); f.appendChild(NG.world.faceCanvas(fm.id, false)); f.appendChild(document.createTextNode(fm.name)); d.appendChild(f); });
    document.getElementById('app').appendChild(d);
  }

  async function boot() {
    ['hud', 'guita', 'guitaN', 'puntos', 'combo', 'diaN', 'relojFill', 'relojTxt', 'hambreBar', 'hambreFill', 'frenesiBar', 'frenesiFill', 'modTxt', 'efectos',
      'familia', 'antojo', 'antojoImg', 'antojoNombre', 'antojoFill', 'globo', 'mazoN', 'descN', 'tip', 'banner', 'bannerT', 'bannerS', 'floats', 'flash', 'vignette',
      'rewardT', 'rewardS', 'rewardOpts', 'record', 'btnMute'].forEach((id) => (els[id] = $(id)));
    els.btnMute.classList.toggle('off', NG.audio.muted);
    // las cartas se dibujan con la tipografía: esperamos a que cargue (con tope)
    try {
      await Promise.race([
        Promise.all([document.fonts.load('40px "Lilita One"'), document.fonts.load('900 20px Nunito'), document.fonts.load('italic 700 20px Nunito')]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch (e) { /* sin tipografías, igual anda */ }
    try {
      renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: true });
    } catch (e) { fail('Tu navegador no puede mostrar gráficos 3D (WebGL). Probá con Chrome, Edge o Firefox actualizados.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.autoClear = false;
    renderer.setClearColor(0x1a0f0a);
    $('loadMsg').textContent = 'Cocinando los platos…';
    await new Promise((r) => setTimeout(r, 30));
    NG.models.renderThumbs();
    scene = new T.Scene();
    scene.fog = new T.Fog(0x2a1810, 9, 18);
    cam = new T.PerspectiveCamera(42, 1, 0.1, 60);
    cam.position.copy(camBase.pos);
    uiScene = new T.Scene();
    uiCam = new T.PerspectiveCamera(30, 1, 0.1, 30); uiCam.position.set(0, 0, 10);
    NG.world.build(scene);
    NG.world.onBang = (amp) => {
      NG.audio.sfx('bang', 0.4 + amp);
      V.shake = Math.max(V.shake, amp * 0.18);
      NG.world.kickLamp((Math.random() - 0.5) * amp * 0.25);
    };
    NG.hand.init(uiScene, uiCam);
    resize();
    bindInput();
    if (/[?&]galeria/.test(location.search)) { galeria(); }
    ui.showTitle();
    requestAnimationFrame(frame);
  }
  boot().catch((e) => { console.error(e); fail('Algo se quemó en la cocina: ' + (e && e.message ? e.message : e)); });
})();
