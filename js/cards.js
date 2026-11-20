/* La Nona: ¡A Morfar! — definición de cartas, arte de las cartas y mano en 3D */
(function () {
  'use strict';
  const NG = window.NG, U = NG.U, T = THREE;

  NG.TYPES = {
    pan: { name: 'PAN', color: '#cf7a1e', art: 'pan' },
    pasta: { name: 'PASTA', color: '#d39b00', art: 'tallarines' },
    carne: { name: 'CARNE', color: '#bf3526', art: 'milanesa' },
    dulce: { name: 'DULCE', color: '#d4549a', art: 'flan' },
    picada: { name: 'PICADA', color: '#7a4fb5', art: 'picada' },
  };
  const KCOL = { laburo: '#2c8a57', artimana: '#2b62ab', libre: '#7b6a58', comodin: '#16a085' };

  // =====================================================================
  //                               CARTAS
  // rar: 0 inicial · 1 común · 2 rara · 3 épica
  // =====================================================================
  const C = (NG.CARDS = {});
  function def(id, o) { o.id = id; o.art = o.art || id; o.types = o.types || []; C[id] = o; }
  const food = (id, name, types, cost, sat, rar, flavor, extra) => def(id, Object.assign({ name, kind: 'comida', types, cost, sat, rar, flavor }, extra || {}));
  const work = (id, name, time, pay, rar, flavor, extra) => def(id, Object.assign({ name, kind: 'laburo', work: time, pay, rar, flavor, cost: 0 }, extra || {}));
  const trick = (id, name, cost, rar, fx, desc, flavor, play, extra) => def(id, Object.assign({ name, kind: 'artimana', cost, rar, fx, desc, flavor, play }, extra || {}));

  // ---- comida ----
  food('pan', 'Pan con manteca', ['pan'], 2, 9, 0, 'Para ir picando.');
  food('tallarines', 'Tallarines', ['pasta'], 4, 14, 0, 'Con tuco, como Dios manda.');
  food('milanesa', 'Milanesa', ['carne'], 5, 17, 0, 'Con papas fritas, obvio.');
  food('flan', 'Flan casero', ['dulce'], 3, 11, 0, 'Mixto. Siempre mixto.');
  food('mortadela', 'Mortadela', ['picada'], 3, 11, 0, 'Cortada bien finita.');
  food('ravioles', 'Ravioles', ['pasta'], 6, 22, 1, 'De ricota, los del domingo.');
  food('noquis', 'Ñoquis del 29', ['pasta'], 4, 15, 1, 'Con el billete abajo del plato.', {
    desc: 'Si es su antojo: +$4', onFeed(G, matched) { if (matched) G.addMoney(4, 'nona'); },
  });
  food('asado', 'Asado', ['carne'], 9, 34, 2, 'Tira, chorizo y morcilla.');
  food('estofado', 'Estofado', ['pasta', 'carne'], 7, 23, 2, 'Vale por dos antojos.');
  food('pandulce', 'Pan dulce', ['pan', 'dulce'], 4, 14, 1, 'En esta casa es Navidad todo el año.');
  food('picada', 'Picada completa', ['picada'], 6, 21, 1, 'Queso, salame y aceitunas.');
  food('polenta', 'Polenta', [], 1, 9, 1, 'Rinde, llena y sale dos mangos.', { desc: 'No cumple antojos' });
  food('empanadas', 'Empanadas', ['carne', 'pan'], 5, 17, 1, 'Docena y media, por las dudas.');
  food('pastafrola', 'Pastafrola', ['dulce'], 5, 19, 1, 'De membrillo. No se discute.');
  food('pizza', 'Pizza', ['pan', 'picada'], 6, 21, 2, 'De muzzarella, con aceitunas.');
  food('banquete', 'Pollo al horno', [], 8, 28, 3, 'Con papas. La pata es de ella.', { wild: true, desc: 'Cumple cualquier antojo' });
  food('sobras', 'Sobras de ayer', [], 0, 6, 2, 'A la Nona le da lo mismo.', { wild: true, desc: 'Cumple cualquier antojo' });
  food('kiosco', 'El kiosco de Don Francisco', [], 0, 38, -1, 'Caramelos, chocolatines, cigarrillos… y el diario.', {
    wild: true, burn: true, desc: 'Cumple cualquier antojo. Se usa una vez',
    onFeed() { NG.ui.say('¡Los caramelos también!'); },
  });
  food('vino', 'Vino de la casa', [], 3, 7, 2, 'Un vasito. O la damajuana.', {
    desc: 'El hambre sube a la mitad por 7s', onFeed(G) { G.s.fx.vino = 7; },
  });

  // ---- laburo ----
  work('puesto', 'El puesto de Carmelo', 4, 8, 0, 'De sol a sol en la feria.');
  work('costura', 'Costuras de María', 2.5, 6, 1, 'Ruedos, dobladillos y zurcidos.');
  work('changas', 'Changas de Anyula', 3, 5, 1, 'Limpia, y de paso le convida algo.', {
    desc: 'Además: −8 de hambre', onDone(G) { G.s.hunger = Math.max(0, G.s.hunger - 8); NG.ui.hungerHit(-8); },
  });
  work('horas', 'Horas extra de Marta', 6, 17, 2, 'Vuelve tarde, pero vuelve con plata.');
  work('quiniela', 'La quiniela', 2, 0, 2, 'Hoy sale el 48, seguro.', {
    fx: '¿+$30?', desc: '40% de ganar $30. Si no, nada.',
    onDone(G, slotPos) {
      if (Math.random() < 0.4) { G.addMoney(30, slotPos); NG.ui.float('¡A LA CABEZA!', 'center', 'plata big'); NG.audio.sfx('coinBig'); }
      else { NG.ui.float('No salió…', slotPos, 'mal'); NG.audio.sfx('error'); }
    },
  });
  work('tango', 'Tango de Chicho', 0, 1, 0, 'Está por componer un éxito. Hace años.', {
    fx: '+$1', desc: 'Cambia toda tu mano',
    play(G) { G.addMoney(1, 'money'); G.redrawHand(); NG.world.nona.talk(0.4); },
  });
  work('tv', 'Empeñar el televisor', 0, 25, 2, 'Total, daban todo repetido.', {
    fx: '+$25', desc: 'Se usa una sola vez', burn: true,
    play(G) { G.addMoney(25, 'money'); NG.audio.sfx('coinBig'); NG.world.burst(NG.world.tvPos(), 0xcfd3d8, 14, 2.5); NG.world.showTV(false); },
  });

  // ---- artimañas ----
  trick('siesta', 'La siesta', 4, 1, 'HAMBRE EN PAUSA', 'Durante 5 segundos', 'Shh… no la despierten.', (G) => { G.s.fx.siesta = 5; NG.audio.sfx('snore'); });
  trick('casamiento', 'Casarla con Don Francisco', 6, 3, 'COMIDA GRATIS 6s', 'Y el kiosco de Don Francisco va a tu mazo', 'Que la mantenga el kiosquero.', (G) => {
    G.s.fx.gratis = 6;
    G.s.discard.push('kiosco');
    NG.ui.float('¡Vivan los novios!', 'center', 'bien big');
    NG.after(0.9, () => NG.ui.say('¡Ma qué kiosco lindo tiene el Francisco!'));
  });
  trick('laburar', 'Mandarla a laburar', 3, 2, '+$3 POR PLATO', 'Durante 8 segundos', 'A su edad, y con ese apetito.', (G) => { G.s.fx.nonaLaburo = 8; });
  trick('receta', 'Receta secreta', 2, 1, 'PRÓXIMA COMIDA x2', 'Llena el doble', 'El secreto es más aceite.', (G) => { G.s.fx.doble += 1; });
  trick('olla', 'Olla popular', 5, 3, 'TODO A LA OLLA', 'Sirve gratis todas las comidas de tu mano', 'Donde comen dos, come la Nona.', (G) => { G.ollaPopular(); });
  trick('fiado', 'Fiado del almacén', 0, 1, '+$15 YA', 'En 15s devolvés $18 (o +15 de hambre)', 'Anotámelo, Don.', (G) => { G.addMoney(15, 'money'); G.s.fx.debts.push({ t: 15, amt: 18 }); });
  trick('cayetano', 'Rezarle a San Cayetano', 1, 1, '¿MILAGRO?', 'Al azar: +$12, −20 de hambre o mano nueva', 'Pan y trabajo. Sobre todo pan.', (G) => {
    const r = Math.random();
    if (r < 0.4) { G.addMoney(12, 'center'); NG.ui.float('¡MILAGRO!', 'center', 'plata big'); }
    else if (r < 0.8) { G.s.hunger = Math.max(0, G.s.hunger - 20); NG.ui.hungerHit(-20); NG.ui.float('¡MILAGRO!', 'center', 'bien big'); }
    else { G.redrawHand(); NG.ui.float('Mano nueva', 'center', 'big'); }
  });

  NG.cardTypeLabel = function (d) {
    if (d.kind === 'laburo') return 'LABURO';
    if (d.kind === 'artimana') return 'ARTIMAÑA';
    if (d.wild) return 'COMODÍN';
    if (!d.types.length) return 'COMIDA';
    return d.types.map((t) => NG.TYPES[t].name).join(' + ');
  };

  // =====================================================================
  //                         ARTE DE LAS CARTAS (canvas)
  // =====================================================================
  const PW = 400, PH = 560;
  const DISP = '"Lilita One","Arial Black",Impact,sans-serif', BODY = 'Nunito,"Segoe UI",Arial,sans-serif';
  const DARK = '#24140c';
  function rr(x, X, Y, w, h, r) {
    x.beginPath(); x.moveTo(X + r, Y);
    x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function fit(x, text, maxW, size, font, pre) {
    do { x.font = `${pre || ''}${size}px ${font}`; if (x.measureText(text).width <= maxW) break; size -= 1; } while (size > 10);
    return size;
  }
  function wrap(x, text, maxW) {
    const words = text.split(' '), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function cardColors(d) {
    if (d.kind !== 'comida') return [KCOL[d.kind]];
    if (d.wild) return [KCOL.comodin];
    if (!d.types.length) return [KCOL.libre];
    return d.types.map((t) => NG.TYPES[t].color);
  }
  function stroked(x, text, px, py, lw) {
    x.lineWidth = lw || 6; x.strokeStyle = DARK; x.lineJoin = 'round';
    x.strokeText(text, px, py); x.fillText(text, px, py);
  }

  function drawCard(d) {
    const c = document.createElement('canvas'); c.width = PW; c.height = PH;
    const x = c.getContext('2d');
    const cols = cardColors(d), col = cols[0];
    rr(x, 0, 0, PW, PH, 30); x.fillStyle = DARK; x.fill();
    let edge = col;
    if (cols.length > 1) {
      const g = x.createLinearGradient(0, 0, PW, PH);
      g.addColorStop(0, cols[0]); g.addColorStop(0.495, cols[0]); g.addColorStop(0.505, cols[1]); g.addColorStop(1, cols[1]);
      edge = g;
    } else if (d.wild) {
      const g = x.createLinearGradient(0, 0, PW, PH);
      ['#cf7a1e', '#d39b00', '#bf3526', '#d4549a', '#7a4fb5', '#16a085'].forEach((cc, i) => g.addColorStop(i / 5, cc));
      edge = g;
    }
    rr(x, 7, 7, PW - 14, PH - 14, 25); x.fillStyle = edge; x.fill();
    const pg = x.createLinearGradient(0, 0, 0, PH); pg.addColorStop(0, '#fdf6e0'); pg.addColorStop(1, '#efdcb0');
    rr(x, 21, 21, PW - 42, PH - 42, 15); x.fillStyle = pg; x.fill();

    // ---- ventana con la ilustración (render del modelo 3D) ----
    const ax = 32, ay = 92, aw = PW - 64, ah = 232, acx = PW / 2, acy = ay + ah / 2;
    const ag = x.createRadialGradient(acx, acy - 10, 10, acx, acy, aw * 0.75);
    ag.addColorStop(0, shade(col, 0.86)); ag.addColorStop(1, shade(col, 0.3));
    rr(x, ax, ay, aw, ah, 14); x.fillStyle = ag; x.fill();
    x.save(); rr(x, ax, ay, aw, ah, 14); x.clip();
    x.globalAlpha = 0.2; x.fillStyle = '#fff';
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * 6.283, a1 = a0 + 0.26;
      x.beginPath(); x.moveTo(acx, acy); x.lineTo(acx + Math.cos(a0) * 400, acy + Math.sin(a0) * 400); x.lineTo(acx + Math.cos(a1) * 400, acy + Math.sin(a1) * 400); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(50,25,10,.28)'; x.beginPath(); x.ellipse(acx, ay + ah * 0.84, aw * 0.36, 15, 0, 0, 6.283); x.fill();
    const th = NG.thumbs && NG.thumbs[d.art];
    if (th) x.drawImage(th, acx - 156, acy - 117 + 4, 312, 234);
    x.restore();
    rr(x, ax, ay, aw, ah, 14); x.lineWidth = 5; x.strokeStyle = DARK; x.stroke();

    // ---- nombre ----
    const nx = 88, nw = PW - 118;
    rr(x, nx, 28, nw, 54, 14); x.fillStyle = shade(col, -0.3); x.fill(); x.lineWidth = 4; x.strokeStyle = DARK; x.stroke();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    fit(x, d.name, nw - 22, 31, DISP);
    stroked(x, d.name, nx + nw / 2, 57, 5);

    // ---- costo / tiempo ----
    const bx = 56, by = 56, br = 37;
    const isWork = d.kind === 'laburo';
    const bg = x.createRadialGradient(bx - 10, by - 12, 4, bx, by, br);
    if (isWork) { bg.addColorStop(0, '#a8f0c0'); bg.addColorStop(0.6, '#2c8a57'); bg.addColorStop(1, '#1b5c39'); }
    else { bg.addColorStop(0, '#fff6c0'); bg.addColorStop(0.6, '#f2c230'); bg.addColorStop(1, '#c98a12'); }
    x.beginPath(); x.arc(bx, by, br, 0, 6.283); x.fillStyle = bg; x.fill(); x.lineWidth = 5; x.strokeStyle = DARK; x.stroke();
    x.fillStyle = '#fff';
    const btxt = isWork ? (d.work > 0 ? String(d.work).replace('.', ',') + 's' : 'YA') : '$' + d.cost;
    fit(x, btxt, br * 1.55, 36, DISP);
    stroked(x, btxt, bx, by + 2, 6);

    // ---- cinta de tipo ----
    const tl = NG.cardTypeLabel(d);
    x.font = `22px ${DISP}`;
    const tw = Math.max(120, x.measureText(tl).width + 44);
    rr(x, acx - tw / 2, ay + ah - 19, tw, 38, 19); x.fillStyle = DARK; x.fill();
    x.fillStyle = shade(col, 0.55); x.fillText(tl, acx, ay + ah + 1);

    // ---- efecto ----
    let fx = d.fx;
    if (!fx) fx = d.kind === 'comida' ? `−${d.sat} HAMBRE` : `+$${d.pay}`;
    const fxCol = d.kind === 'comida' ? '#b3261a' : d.kind === 'laburo' ? '#1f6b42' : '#1f4d8a';
    x.fillStyle = fxCol;
    fit(x, fx, PW - 70, 40, DISP);
    x.fillText(fx, acx, 388);
    let y = 422;
    const desc = d.desc || (isWork && d.work > 0 ? `Trabaja ${String(d.work).replace('.', ',')}s ocupando su lugar` : '');
    if (desc) {
      x.fillStyle = '#3a2a1c'; x.font = `900 19px ${BODY}`;
      const lines = wrap(x, desc, PW - 76).slice(0, 2);
      for (const ln of lines) { x.fillText(ln, acx, y); y += 23; }
    }
    if (d.flavor) {
      x.fillStyle = '#806a52'; x.font = `italic 700 17px ${BODY}`;
      const lines = wrap(x, d.flavor, PW - 80).slice(0, 2);
      let fy = Math.max(y + 12, PH - 44 - (lines.length - 1) * 20);
      for (const ln of lines) { x.fillText(ln, acx, fy); fy += 20; }
    }
    // rareza
    if (d.rar >= 2) {
      x.fillStyle = d.rar === 3 ? '#f2c230' : '#6fd0ff';
      for (let i = 0; i < (d.rar === 3 ? 3 : 2); i++) { x.beginPath(); x.arc(PW - 44 - i * 16, PH - 34, 5, 0, 6.283); x.fill(); x.lineWidth = 2; x.strokeStyle = DARK; x.stroke(); }
    }
    return c;
  }

  function drawBack() {
    const c = document.createElement('canvas'); c.width = PW; c.height = PH;
    const x = c.getContext('2d');
    rr(x, 0, 0, PW, PH, 30); x.fillStyle = DARK; x.fill();
    rr(x, 7, 7, PW - 14, PH - 14, 25); x.fillStyle = '#8e1b12'; x.fill();
    x.save(); rr(x, 7, 7, PW - 14, PH - 14, 25); x.clip();
    x.fillStyle = '#a3261b';
    for (let i = -1; i < 9; i++) for (let j = -1; j < 12; j++) {
      const px = i * 50 + (j % 2) * 25, py = j * 50;
      x.beginPath(); x.moveTo(px, py - 18); x.lineTo(px + 14, py); x.lineTo(px, py + 18); x.lineTo(px - 14, py); x.closePath(); x.fill();
    }
    x.restore();
    rr(x, 24, 24, PW - 48, PH - 48, 14); x.lineWidth = 5; x.strokeStyle = '#f2c230'; x.stroke();
    x.beginPath(); x.arc(PW / 2, PH / 2, 98, 0, 6.283); x.fillStyle = '#f2c230'; x.fill(); x.lineWidth = 7; x.strokeStyle = DARK; x.stroke();
    x.beginPath(); x.arc(PW / 2, PH / 2, 80, 0, 6.283); x.lineWidth = 3; x.strokeStyle = '#8e1b12'; x.stroke();
    x.fillStyle = '#8e1b12'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `140px ${DISP}`;
    x.fillText('N', PW / 2, PH / 2 + 8);
    x.strokeStyle = '#f2c230'; x.lineWidth = 5; x.lineCap = 'round';
    for (const sy of [-1, 1]) for (const sx of [-1, 1]) {
      const ox = PW / 2 + sx * 130, oy = PH / 2 + sy * 215;
      x.beginPath(); x.arc(ox, oy, 26, sx > 0 ? Math.PI * 0.5 : 0, sx > 0 ? Math.PI * 1.9 : Math.PI * 1.4); x.stroke();
      x.beginPath(); x.arc(ox - sx * 30, oy, 10, 0, 6.283); x.stroke();
    }
    return c;
  }

  const canvCache = {}, texCache = {};
  NG.cardCanvas = function (id) { return canvCache[id] || (canvCache[id] = drawCard(C[id])); };
  function cardTex(id) {
    if (!texCache[id]) { const t = new T.CanvasTexture(NG.cardCanvas(id)); t.encoding = T.sRGBEncoding; t.anisotropy = 8; texCache[id] = t; }
    return texCache[id];
  }

  // =====================================================================
  //                              MANO EN 3D
  // =====================================================================
  const CW = 1.07, CH = 1.5;
  const H = (NG.hand = {
    cards: [], count: 5, hovered: -1, s: 1, spacing: 1.03, baseY: 0,
    viewH: 2 * 10 * Math.tan((15 * Math.PI) / 180), viewW: 8,
    deckPos: new T.Vector3(), discPos: new T.Vector3(), moneyPos: new T.Vector3(), deckScale: 0.6, touch: false,
  });
  let ui, cam, cardGeo, backMat, glowGeo, glowTex, barBgGeo, barFillGeo, barBgMat, barFillMat, deckPile;
  const ray = new T.Raycaster();
  const keycaps = [];

  function roundedRectGeo(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new T.ShapeGeometry(s, 6), pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
    uv.needsUpdate = true;
    return g;
  }

  H.init = function (uiScene, uiCam) {
    ui = uiScene; cam = uiCam;
    cardGeo = roundedRectGeo(CW, CH, 0.08);
    const bt = new T.CanvasTexture(drawBack()); bt.encoding = T.sRGBEncoding; bt.anisotropy = 4;
    backMat = new T.MeshBasicMaterial({ map: bt });
    // resplandor (textura suave)
    const gc = document.createElement('canvas'); gc.width = 157; gc.height = 200;
    const gx = gc.getContext('2d');
    gx.shadowColor = '#ffd23f'; gx.shadowBlur = 20; gx.fillStyle = '#ffe680';
    for (let i = 0; i < 3; i++) { rr(gx, 27, 27, 103, 146, 10); gx.fill(); }
    glowTex = new T.CanvasTexture(gc); glowTex.encoding = T.sRGBEncoding;
    glowGeo = new T.PlaneGeometry(CW + 0.5, CH + 0.5);
    barBgGeo = new T.PlaneGeometry(0.94, 0.17);
    barFillGeo = new T.PlaneGeometry(0.86, 0.09); barFillGeo.translate(0.43, 0, 0);
    barBgMat = new T.MeshBasicMaterial({ color: 0x24140c });
    barFillMat = new T.MeshBasicMaterial({ color: 0xf2c230 });
    // pila del mazo
    deckPile = new T.Group();
    for (let i = 0; i < 4; i++) { const m = new T.Mesh(cardGeo, backMat); m.position.set(-i * 0.03, i * 0.035, i * 0.01); m.rotation.z = (i - 1.5) * 0.02; deckPile.add(m); }
    ui.add(deckPile);
    // teclas 1-5
    for (let i = 0; i < 5; i++) {
      const kc = document.createElement('canvas'); kc.width = kc.height = 64;
      const kx = kc.getContext('2d');
      rr(kx, 4, 4, 56, 56, 14); kx.fillStyle = '#24140c'; kx.fill(); kx.lineWidth = 4; kx.strokeStyle = '#fbf0d0'; kx.stroke();
      kx.fillStyle = '#f2c230'; kx.font = `38px ${DISP}`; kx.textAlign = 'center'; kx.textBaseline = 'middle'; kx.fillText(String(i + 1), 32, 35);
      const kt = new T.CanvasTexture(kc); kt.encoding = T.sRGBEncoding;
      const m = new T.Mesh(new T.PlaneGeometry(0.3, 0.3), new T.MeshBasicMaterial({ map: kt, transparent: true }));
      m.visible = false; ui.add(m); keycaps.push(m);
    }
  };

  H.resize = function (aspect) {
    H.viewW = H.viewH * aspect;
    const total = H.spacing * 4 + CW;
    const portrait = aspect < 1.15;
    const avail = portrait ? H.viewW - 0.16 : H.viewW - 3.0;
    H.s = U.clamp(avail / total, 0.3, 1);
    H.baseY = -H.viewH / 2 + CH * H.s * 0.5 + 0.07;
    H.deckScale = portrait ? 0.34 : 0.62;
    if (portrait) H.deckPos.set(H.viewW / 2 - 0.3, H.baseY + CH * H.s * 0.5 + 0.55, -0.2);
    else H.deckPos.set(H.viewW / 2 - 0.72, -H.viewH / 2 + 0.98, -0.2);
    H.discPos.set(-H.deckPos.x, H.deckPos.y, -0.2);
    H.moneyPos.set(-H.viewW / 2 + 0.9, H.viewH / 2 - 1.0, 0.3);
    if (deckPile) { deckPile.position.copy(H.deckPos); deckPile.scale.setScalar(H.deckScale); }
  };
  H.setCount = function (n) { H.count = n; };
  H.showDeck = function (v) { if (deckPile) deckPile.visible = v; };

  H.spawn = function (slot, id) {
    const d = C[id];
    const g = new T.Group();
    const front = new T.Mesh(cardGeo, new T.MeshBasicMaterial({ map: cardTex(id) }));
    const back = new T.Mesh(cardGeo, backMat); back.rotation.y = Math.PI;
    const glow = new T.Mesh(glowGeo, new T.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    glow.position.z = -0.03; glow.visible = false;
    const barBg = new T.Mesh(barBgGeo, barBgMat); barBg.position.set(0, -0.3, 0.012);
    const barFill = new T.Mesh(barFillGeo, barFillMat); barFill.position.set(-0.43, -0.3, 0.02);
    barBg.visible = barFill.visible = false;
    g.add(glow, front, back, barBg, barFill);
    g.position.copy(H.deckPos); g.rotation.y = Math.PI; g.scale.setScalar(H.deckScale);
    ui.add(g);
    const card = { def: d, id, g, front, glow, barBg, barFill, slot, state: 'hand', work: false, workK: 0, shakeT: 0, glowK: 0 };
    front.userData.card = card;
    H.cards.push(card);
    return card;
  };

  H.kill = function (c) {
    if (c.state === 'dead') return;
    c.state = 'dead';
    ui.remove(c.g);
    c.front.material.dispose(); c.glow.material.dispose();
    const i = H.cards.indexOf(c);
    if (i >= 0) H.cards.splice(i, 1);
  };
  H.clear = function () { H.cards.slice().forEach(H.kill); H.hovered = -1; };

  H.fly = function (c, to, dur, endScale, o, done) {
    o = o || {};
    c.state = 'fly'; c.slot = -1; c.glow.visible = false; c.barBg.visible = c.barFill.visible = false;
    c.front.material.color.setScalar(1);
    const go = () => {
      if (c.state === 'dead') return;
      const from = c.g.position.clone(), s0 = c.g.scale.x, r0 = c.g.rotation.z;
      NG.tween(dur, (k) => {
        if (c.state === 'dead') return;
        c.g.position.lerpVectors(from, to, k);
        c.g.position.y += Math.sin(k * Math.PI) * (o.arc || 0);
        c.g.scale.setScalar(U.lerp(s0, endScale, k));
        c.g.rotation.z = r0 + (o.spin || 0) * k;
        if (o.flip) c.g.rotation.y = Math.PI * k;
      }, () => { H.kill(c); if (done) done(); }, o.ease || U.ease.inQuad);
    };
    if (o.delay) NG.after(o.delay, go); else go();
  };
  H.toPlate = function (c, done, delay) {
    const to = NG.view.worldToUI(NG.world.platePos, 0.5); to.y += 0.25;
    H.fly(c, to, 0.17, 0.26 * H.s, { spin: U.rand(-1.4, 1.4), arc: 0.45, delay: delay || 0 }, done);
  };
  H.toMouth = function (c, delay, done) {
    const to = NG.view.worldToUI(NG.world.mouthPos, 0.5);
    H.fly(c, to, 0.3, 0.05, { spin: U.rand(-4, 4), arc: 0.6, delay: delay || 0 }, done);
  };
  H.toDiscard = function (c, delay) { H.fly(c, H.discPos, 0.22, H.deckScale * 0.8, { flip: true, spin: 0.6, delay: delay || 0, ease: U.ease.outQuad }); };
  H.toDeck = function (c, delay) { H.fly(c, H.deckPos, 0.25, H.deckScale, { flip: true, delay: delay || 0, ease: U.ease.outQuad }); };
  H.toMoney = function (c, done) { H.fly(c, H.moneyPos, 0.26, 0.12, { spin: 2, arc: 0.3 }, done); };
  // artimaña: va al centro, se agranda y se desvanece
  H.poof = function (c, done) {
    c.state = 'fly'; c.slot = -1; c.glow.visible = false;
    c.front.material.color.setScalar(1);
    const from = c.g.position.clone(), to = new T.Vector3(0, 0.55, 2), s0 = c.g.scale.x, r0 = c.g.rotation.z;
    NG.tween(0.2, (k) => {
      if (c.state === 'dead') return;
      c.g.position.lerpVectors(from, to, k); c.g.scale.setScalar(U.lerp(s0, 1.45 * H.s, k)); c.g.rotation.z = r0 * (1 - k);
    }, () => {
      if (done) done();
      c.front.material.transparent = true;
      NG.tween(0.42, (k) => {
        if (c.state === 'dead') return;
        const kk = Math.max(0, (k - 0.45) / 0.55);
        c.g.scale.setScalar(1.45 * H.s * (1 + kk * 0.35)); c.front.material.opacity = 1 - kk;
      }, () => H.kill(c));
    }, U.ease.outCubic);
  };
  H.shake = function (c) { c.shakeT = 0.32; };
  H.setWorking = function (c, on) { c.work = on; c.workK = 0; c.barBg.visible = c.barFill.visible = on; };

  H.hoverAt = function (nx, ny) {
    if (nx === null) { H.hovered = -1; return -1; }
    ray.setFromCamera({ x: nx, y: ny }, cam);
    const fronts = [];
    for (const c of H.cards) if (c.state === 'hand' && !c.work) fronts.push(c.front);
    const hit = ray.intersectObjects(fronts, false);
    H.hovered = hit.length ? hit[0].object.userData.card.slot : -1;
    return H.hovered;
  };
  // posición en pantalla (px) del centro de un lugar de la mano
  H.slotScreen = function (i) {
    const off = i - (H.count - 1) / 2;
    return NG.view.uiToScreen({ x: off * H.spacing * H.s, y: H.baseY + CH * H.s * 0.35 });
  };

  H.update = function (dt, game) {
    const t = NG.view.time, n = H.count, s = H.s;
    for (const c of H.cards) {
      if (c.state !== 'hand') continue;
      const off = c.slot - (n - 1) / 2;
      let tx = off * H.spacing * s, ty = H.baseY - off * off * 0.028 * s, tz = c.slot * 0.03, rz = -off * 0.035, sc = s;
      const hov = H.hovered === c.slot && !c.work;
      if (c.work) { ty -= 0.34 * s; sc *= 0.95; rz = 0; }
      else if (hov) { ty += 0.34 * s; sc *= 1.15; tz = 0.8; rz = 0; }
      if (c.shakeT > 0) { c.shakeT -= dt; tx += Math.sin(c.shakeT * 70) * 0.07 * s; }
      const p = c.g.position;
      p.x = U.damp(p.x, tx, 16, dt); p.y = U.damp(p.y, ty, 16, dt); p.z = U.damp(p.z, tz, 16, dt);
      c.g.rotation.z = U.damp(c.g.rotation.z, rz, 14, dt);
      c.g.rotation.y = U.damp(c.g.rotation.y, 0, 13, dt);
      c.g.scale.setScalar(U.damp(c.g.scale.x, sc, 16, dt));
      const afford = game.canAfford(c.def), match = game.isMatch(c.def);
      const br = c.work ? 0.82 : afford ? 1 : 0.4;
      c.front.material.color.setScalar(U.damp(c.front.material.color.r, br, 14, dt));
      const gk = !c.work && match && afford ? 0.7 + 0.3 * Math.sin(t * 11) : hov && afford ? 0.28 : 0;
      c.glowK = U.damp(c.glowK, gk, 18, dt);
      c.glow.material.opacity = c.glowK; c.glow.visible = c.glowK > 0.01;
      if (c.work) c.barFill.scale.x = Math.max(0.001, c.workK);
    }
    const showKeys = !H.touch && game.mode === 'play';
    for (let i = 0; i < keycaps.length; i++) {
      const k = keycaps[i];
      k.visible = showKeys && i < n;
      if (!k.visible) continue;
      const off = i - (n - 1) / 2;
      k.position.set(off * H.spacing * s - CW * s * 0.5 + 0.2 * s, H.baseY + CH * s * 0.5 + 0.2 * s, -0.1);
      k.scale.setScalar(Math.max(0.6, s));
    }
  };
})();
