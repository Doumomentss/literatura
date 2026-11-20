/* La Nona: ¡A Morfar! — el comedor, la Nona, los retratos y las partículas */
(function () {
  'use strict';
  const NG = window.NG, U = NG.U, T = THREE;
  const { mat, M, box, cyl, sph, cone, tor, lathe, P, R, S, G, label, HP } = NG.models.h;
  const W = (NG.world = {
    platePos: new T.Vector3(0, 0.975, -0.1),
    mouthPos: new T.Vector3(0, 1.72, -0.72),
    headPos: new T.Vector3(0, 2.0, -1.1),
    onBang: null,
  });
  const NONA_Z = -1.3;
  const TABLE_Y = 0.97;

  function ctex(w, h, draw, rx, ry) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    if (rx) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); }
    return t;
  }
  const tmat = (tex, r) => new T.MeshStandardMaterial({ map: tex, roughness: r === undefined ? 0.85 : r });

  // =====================================================================
  //                        RETRATOS DE LA FAMILIA
  // =====================================================================
  const FACES = {
    marta: { skin: '#f2c8a6', hair: '#6b3414', shirt: '#d6569a', bg: ['#f6dcc6', '#b98a70'], style: 'largo', mouth: 'labios' },
    anyula: { skin: '#eec3a2', hair: '#c4c4c4', shirt: '#6b7fa8', bg: ['#e6e2cf', '#9a9a82'], style: 'rulos', mouth: 'sonrisa', glasses: true },
    maria: { skin: '#e9bb98', hair: '#3a2418', shirt: '#4f8a6b', bg: ['#e9dcc0', '#a08a62'], style: 'rodete', mouth: 'triste', worried: true },
    carmelo: { skin: '#e3ae88', hair: '#3a2a20', shirt: '#f4efe6', bg: ['#dfe6d6', '#869a80'], style: 'pelado', mouth: 'none', mustache: 'big', tired: true },
    chicho: { skin: '#e8b690', hair: '#16110d', shirt: '#2b2b33', bg: ['#eadcc8', '#a5846a'], style: 'gomina', mouth: 'canchero', mustache: 'thin', smug: true, scarf: '#c8281c' },
  };
  function drawFace(x, Wd, Ht, f, dead) {
    x.save();
    if (dead) x.filter = 'grayscale(1) brightness(0.62)';
    const g = x.createRadialGradient(Wd / 2, Ht * 0.42, 10, Wd / 2, Ht * 0.45, Wd * 0.85);
    g.addColorStop(0, f.bg[0]); g.addColorStop(1, f.bg[1]);
    x.fillStyle = g; x.fillRect(0, 0, Wd, Ht);
    const cx = Wd / 2, cy = Ht * 0.43, r = Wd * 0.27, dark = '#24140c', TAU = Math.PI * 2;
    x.lineWidth = 5; x.strokeStyle = dark; x.lineJoin = 'round'; x.lineCap = 'round';
    const ell = (ex, ey, rx, ry, a0, a1) => { x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, a0 === undefined ? 0 : a0, a1 === undefined ? TAU : a1); };
    const fs = () => { x.fill(); x.stroke(); };
    // pelo de atrás
    x.fillStyle = f.hair;
    if (f.style === 'largo') { ell(cx, cy + r * 0.5, r * 1.3, r * 1.8); fs(); }
    if (f.style === 'rodete') { ell(cx, cy - r * 1.22, r * 0.45, r * 0.42); fs(); }
    if (f.style === 'rulos') for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; ell(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 1.02, r * 0.36, r * 0.36); fs(); }
    // hombros
    x.fillStyle = f.shirt; ell(cx, Ht * 1.04, Wd * 0.47, Ht * 0.27); fs();
    // cuello
    x.fillStyle = f.skin; x.beginPath(); x.rect(cx - r * 0.33, cy + r * 0.7, r * 0.66, r * 0.8); fs();
    if (f.scarf) { x.fillStyle = f.scarf; ell(cx, cy + r * 1.38, r * 0.6, r * 0.26); fs(); x.beginPath(); x.moveTo(cx + r * 0.1, cy + r * 1.5); x.lineTo(cx + r * 0.5, cy + r * 2.3); x.lineTo(cx - r * 0.1, cy + r * 2.2); x.closePath(); fs(); }
    if (f.style === 'pelado') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx - r * 0.7, Ht); x.lineTo(cx - r * 0.5, cy + r * 1.7); x.lineTo(cx + r * 0.5, cy + r * 1.7); x.lineTo(cx + r * 0.7, Ht); x.closePath(); fs(); }
    // orejas y cabeza
    x.fillStyle = f.skin;
    for (const s of [-1, 1]) { ell(cx + s * r * 0.95, cy + r * 0.05, r * 0.16, r * 0.24); fs(); }
    ell(cx, cy, r * 0.93, r * 1.1); fs();
    // mejillas
    x.fillStyle = 'rgba(230,110,90,.35)';
    for (const s of [-1, 1]) { ell(cx + s * r * 0.55, cy + r * 0.38, r * 0.2, r * 0.14); x.fill(); }
    // pelo de adelante
    x.fillStyle = f.hair;
    if (f.style === 'largo') { ell(cx, cy - r * 0.35, r * 0.97, r * 0.82, Math.PI, 0); x.closePath(); fs(); ell(cx - r * 0.3, cy - r * 0.5, r * 0.7, r * 0.5, Math.PI * 0.9, Math.PI * 1.9); fs(); }
    if (f.style === 'rodete') { ell(cx, cy - r * 0.5, r * 0.95, r * 0.64, Math.PI, 0); x.closePath(); fs(); }
    if (f.style === 'rulos') for (let i = 0; i < 5; i++) { ell(cx - r * 0.6 + i * r * 0.3, cy - r * 0.85 + Math.abs(i - 2) * r * 0.1, r * 0.24, r * 0.22); fs(); }
    if (f.style === 'pelado') { for (const s of [-1, 1]) { ell(cx + s * r * 0.86, cy - r * 0.32, r * 0.2, r * 0.36); fs(); } x.strokeStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(cx - r * 0.25, cy - r * 0.55, r * 0.35, Math.PI * 1.1, Math.PI * 1.5); x.stroke(); x.strokeStyle = dark; }
    if (f.style === 'gomina') { ell(cx, cy - r * 0.45, r * 0.96, r * 0.72, Math.PI, 0); x.closePath(); fs(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(cx + r * 0.1, cy - r * 0.5, r * 0.6, Math.PI * 1.15, Math.PI * 1.6); x.stroke(); x.strokeStyle = dark; }
    // ojos
    for (const s of [-1, 1]) {
      const ex = cx + s * r * 0.38, ey = cy - r * 0.02;
      x.fillStyle = '#fff'; ell(ex, ey, r * 0.2, r * 0.17); fs();
      x.fillStyle = dark; ell(ex + s * r * 0.02, ey + (f.tired ? r * 0.04 : 0), r * 0.085, r * 0.085); x.fill();
      if (f.smug || f.tired) { x.fillStyle = f.skin; ell(ex, ey, r * 0.21, r * 0.18, Math.PI, 0); x.closePath(); fs(); }
      if (f.tired) { x.beginPath(); x.arc(ex, ey + r * 0.12, r * 0.2, 0.2, Math.PI - 0.2); x.lineWidth = 3; x.stroke(); x.lineWidth = 5; }
      // cejas
      x.lineWidth = 8; x.strokeStyle = f.style === 'rulos' ? '#8a8a8a' : f.hair;
      x.beginPath();
      const inY = f.worried ? -r * 0.42 : -r * 0.3, outY = f.worried ? -r * 0.26 : (f.smug ? -r * 0.36 : -r * 0.32);
      x.moveTo(ex - s * r * 0.2, cy + inY); x.lineTo(ex + s * r * 0.22, cy + outY); x.stroke();
      x.lineWidth = 5; x.strokeStyle = dark;
    }
    // anteojos
    if (f.glasses) { x.lineWidth = 4; for (const s of [-1, 1]) { ell(cx + s * r * 0.38, cy - r * 0.02, r * 0.28, r * 0.26); x.stroke(); } x.beginPath(); x.moveTo(cx - r * 0.1, cy - r * 0.02); x.lineTo(cx + r * 0.1, cy - r * 0.02); x.stroke(); x.lineWidth = 5; }
    // nariz
    x.beginPath(); x.arc(cx, cy + r * 0.25, r * 0.13, 0.15, Math.PI - 0.15); x.stroke();
    // boca
    const my = cy + r * 0.62;
    if (f.mouth === 'sonrisa') { x.beginPath(); x.arc(cx, my - r * 0.15, r * 0.3, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); }
    if (f.mouth === 'labios') { x.strokeStyle = '#c8281c'; x.lineWidth = 9; x.beginPath(); x.arc(cx, my - r * 0.18, r * 0.26, Math.PI * 0.2, Math.PI * 0.8); x.stroke(); x.strokeStyle = dark; x.lineWidth = 5; }
    if (f.mouth === 'triste') { x.beginPath(); x.arc(cx, my + r * 0.25, r * 0.26, Math.PI * 1.2, Math.PI * 1.8); x.stroke(); }
    if (f.mouth === 'canchero') { x.beginPath(); x.moveTo(cx - r * 0.25, my + r * 0.02); x.quadraticCurveTo(cx + r * 0.1, my + r * 0.12, cx + r * 0.32, my - r * 0.1); x.stroke(); }
    // bigotes
    if (f.mustache === 'big') { x.fillStyle = f.hair; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * r * 0.24, cy + r * 0.52, r * 0.3, r * 0.14, s * 0.3, 0, TAU); fs(); } }
    if (f.mustache === 'thin') { x.lineWidth = 6; x.beginPath(); x.moveTo(cx - r * 0.32, cy + r * 0.5); x.quadraticCurveTo(cx, cy + r * 0.38, cx + r * 0.32, cy + r * 0.5); x.stroke(); x.lineWidth = 5; }
    // aros
    if (f.style === 'largo') { x.fillStyle = '#f2c230'; for (const s of [-1, 1]) { ell(cx + s * r * 0.98, cy + r * 0.38, r * 0.09, r * 0.09); fs(); } }
    x.restore();
    if (dead) {
      x.fillStyle = '#0a0a0a';
      x.beginPath(); x.moveTo(Wd * 0.5, 0); x.lineTo(Wd * 0.74, 0); x.lineTo(Wd, Ht * 0.2); x.lineTo(Wd, Ht * 0.39); x.closePath(); x.fill();
    }
  }
  const faceCache = {};
  W.faceCanvas = function (id, dead) {
    const k = id + (dead ? '_x' : '');
    if (!faceCache[k]) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 336;
      drawFace(c.getContext('2d'), 256, 336, FACES[id], dead);
      faceCache[k] = c;
    }
    return faceCache[k];
  };

  // =====================================================================
  //                               LA NONA
  // =====================================================================
  function buildNona() {
    const N = { t: 0, chewT: 0, roarT: 0, talkT: 0, mo: 0.1, sc: 1, eyeK: 1, blink: 2 };
    const g = (N.group = new T.Group());
    const skinMat = new T.MeshStandardMaterial({ color: new T.Color(0xeab995).convertSRGBToLinear(), roughness: 0.72 });
    const skinBase = skinMat.color.clone(), skinRed = new T.Color(0xd8402f).convertSRGBToLinear();
    const dress = 0x1f1c26;

    const body = S(sph(0.75, dress, null, 24, 18), 1.2, 1.0, 0.95); body.position.y = 0.98; g.add(body);
    const chal = M(new T.SphereGeometry(0.69, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x5d4370);
    chal.scale.set(1.3, 0.86, 1.06); chal.position.y = 1.12; g.add(chal);
    for (let i = 0; i < 13; i++) { // flecos del chal
      const a = Math.PI * (0.08 + (i / 12) * 0.84);
      g.add(P(cyl(0.02, 0.012, 0.13, 0x7a5a92), Math.cos(a) * 0.69 * 1.3, 1.07, Math.sin(a) * 0.69 * 1.06));
    }
    const bib = M(new T.CircleGeometry(0.34, 3), 0xffffff, { side: T.DoubleSide });
    bib.position.set(0, 1.36, 0.69); bib.rotation.set(-0.5, 0, -Math.PI / 2); bib.scale.set(1.1, 1, 1); g.add(bib);
    g.add(P(sph(0.07, 0xc8281c), 0, 1.6, 0.56));

    // ---- cabeza ----
    const head = (N.head = new T.Group()); head.position.set(0, 1.97, 0.2); g.add(head);
    head.add(S(M(new T.SphereGeometry(0.44, 26, 20), skinMat), 1.08, 0.96, 0.98));
    const hair = 0xe9e9ec;
    head.add(R(M(new T.SphereGeometry(0.462, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.46), hair), -0.42, 0, 0));
    head.add(P(sph(0.2, hair), 0, 0.42, -0.2));
    head.add(P(sph(0.06, 0x8e1b1b), 0, 0.6, -0.22));
    for (const s of [-1, 1]) {
      head.add(P(sph(0.17, hair), s * 0.4, 0.1, -0.08));
      head.add(P(S(M(new T.SphereGeometry(0.09, 10, 8), skinMat), 0.6, 1, 0.8), s * 0.47, -0.04, 0.04));
      head.add(P(sph(0.035, 0xf2c230, { m: 0.7, r: 0.3 }), s * 0.48, -0.15, 0.06));
    }
    head.add(P(S(M(new T.SphereGeometry(0.11, 14, 10), skinMat), 1, 1.1, 1.05), 0, -0.04, 0.44));
    const cheeks = [];
    for (const s of [-1, 1]) { const c = P(sph(0.135, 0xf0a08c), s * 0.25, -0.13, 0.3); head.add(c); cheeks.push(c); }
    const eyes = [], brows = [];
    for (const s of [-1, 1]) {
      const e = G(sph(0.085, 0xffffff, { r: 0.3 }), P(sph(0.042, 0x15100c, { r: 0.2 }), 0, 0, 0.062));
      P(e, s * 0.17, 0.1, 0.36); head.add(e); eyes.push(e);
      const b = P(box(0.21, 0.05, 0.05, 0xbfbfc4), s * 0.17, 0.245, 0.4); head.add(b); brows.push(b);
      head.add(P(tor(0.115, 0.012, 0xd4af37, { m: 0.8, r: 0.3 }), s * 0.17, 0.085, 0.435));
    }
    head.add(P(box(0.12, 0.014, 0.014, 0xd4af37, { m: 0.8, r: 0.3 }), 0, 0.1, 0.45));
    const jaw = S(M(new T.SphereGeometry(0.2, 16, 12), skinMat), 1.25, 0.72, 0.92); jaw.position.set(0, -0.36, 0.2); head.add(jaw);
    const mouth = sph(0.15, 0x4a0f18, { r: 0.5 }); mouth.position.set(0, -0.24, 0.37); head.add(mouth);
    const tooth = P(box(0.06, 0.075, 0.03, 0xfffdf0), 0.035, -0.2, 0.475); head.add(tooth);
    const tongue = P(S(sph(0.07, 0xd9535f), 1.2, 0.5, 1), 0, -0.33, 0.4); head.add(tongue);
    head.add(P(sph(0.022, 0x6b3e26), 0.22, -0.3, 0.33));

    // ---- brazos con tenedor y cuchillo ----
    const UP = new T.Vector3(0, 1, 0);
    const steel = { m: 0.75, r: 0.3 };
    function fork() {
      const f = G(P(cyl(0.02, 0.02, 0.5, 0xcfd3d8, steel), 0, 0.18, 0), P(box(0.11, 0.07, 0.022, 0xcfd3d8, steel), 0, 0.46, 0));
      for (let i = -1; i <= 1; i++) f.add(P(box(0.02, 0.16, 0.02, 0xcfd3d8, steel), i * 0.045, 0.57, 0));
      return f;
    }
    function knife() {
      return G(P(cyl(0.024, 0.024, 0.26, 0x3d2616), 0, 0.06, 0), P(box(0.075, 0.36, 0.014, 0xdfe3e8, steel), 0.012, 0.37, 0), P(S(sph(0.0375, 0xdfe3e8, steel), 1, 1, 0.2), 0.012, 0.55, 0));
    }
    function stretch(m, a, b) {
      const d = b.clone().sub(a), len = d.length();
      m.position.copy(a).addScaledVector(d, 0.5);
      m.scale.set(1, len, 1);
      m.quaternion.setFromUnitVectors(UP, d.normalize());
    }
    const arms = [];
    for (const s of [-1, 1]) {
      const a = { sh: new T.Vector3(s * 0.88, 1.28, 0.2), rest: new T.Vector3(s * 0.68, 1.12, 1.02), phase: s < 0 ? 0 : Math.PI, lift: 0 };
      a.sleeve = cyl(0.11, 0.16, 1, dress);
      a.fist = M(new T.SphereGeometry(0.135, 14, 10), skinMat);
      a.fist.add(s < 0 ? fork() : knife());
      a.fist.rotation.z = -s * 0.12;
      g.add(a.sleeve, a.fist);
      arms.push(a);
    }
    function place(a) {
      a.fist.position.set(a.rest.x, a.rest.y + a.lift, a.rest.z - a.lift * 0.2);
      stretch(a.sleeve, a.sh, a.fist.position);
    }
    arms.forEach(place);

    N.chomp = (n) => { N.chewT = Math.max(N.chewT, 0.12 * (n || 3) + 0.05); };
    N.roar = (d) => { N.roarT = d; };
    N.talk = (d) => { N.talkT = d || 0.5; };

    N.update = function (dt, st) {
      const t = (N.t += dt), h = st.hunger;
      N.chewT = Math.max(0, N.chewT - dt); N.roarT = Math.max(0, N.roarT - dt); N.talkT = Math.max(0, N.talkT - dt);
      const eating = N.chewT > 0, roaring = N.roarT > 0, sleeping = st.sleep;
      // boca
      let mo;
      if (roaring) mo = 1.3 + Math.sin(t * 40) * 0.08;
      else if (eating) mo = 0.12 + 0.88 * Math.abs(Math.sin(N.chewT * 26));
      else if (sleeping) mo = 0.3 + 0.2 * Math.sin(t * 2.2);
      else if (N.talkT > 0) mo = 0.25 + 0.6 * Math.abs(Math.sin(t * 20));
      else mo = 0.1 + h * 0.55 * Math.max(0, Math.sin(t * (2 + h * 6)));
      N.mo = U.damp(N.mo, mo, 32, dt);
      mouth.scale.set(1 + N.mo * 0.3, 0.2 + N.mo * 0.95, 0.5);
      mouth.position.y = -0.24 - N.mo * 0.07;
      jaw.position.y = -0.36 - N.mo * 0.14;
      tooth.visible = N.mo > 0.28;
      tongue.visible = N.mo > 0.5; tongue.position.y = -0.33 - N.mo * 0.1;
      const puff = eating ? 1 + 0.28 * Math.abs(Math.sin(N.chewT * 26 + 1)) : 1;
      cheeks[0].scale.setScalar(puff); cheeks[1].scale.setScalar(puff);
      // cejas y ojos
      const ang = sleeping ? -0.1 : U.lerp(0.04, 0.6, h) + (roaring ? 0.25 : 0);
      brows[0].rotation.z = -ang; brows[1].rotation.z = ang;
      brows[0].position.y = brows[1].position.y = 0.245 - (sleeping ? 0 : h * 0.03);
      N.blink -= dt;
      if (N.blink < -0.12) N.blink = U.rand(1.5, 4);
      const ek = sleeping ? 0.12 : roaring ? 1.35 : N.blink < 0 ? 0.1 : 1;
      N.eyeK = U.damp(N.eyeK, ek, 30, dt);
      for (const e of eyes) { e.scale.y = N.eyeK; e.rotation.x = eating ? 0.5 : 0; }
      // piel: se va poniendo colorada
      skinMat.color.copy(skinBase).lerp(skinRed, U.clamp((h - 0.45) / 0.55, 0, 1) * 0.7 + (roaring ? 0.3 : 0));
      // cabeza y cuerpo
      const hx = eating ? 0.36 : sleeping ? 0.34 : 0.05 * Math.sin(t * 1.3);
      let hz = sleeping ? 0.22 : 0.04 * Math.sin(t * 0.9);
      if (!sleeping && !eating && h > 0.8) hz += Math.sin(t * 38) * 0.25 * (h - 0.8);
      if (st.party) hz = Math.sin(t * 12) * 0.2;
      head.rotation.x = U.damp(head.rotation.x, hx, 16, dt);
      head.rotation.z = U.damp(head.rotation.z, hz, 16, dt);
      head.position.y = U.damp(head.position.y, 1.97 + Math.sin(t * 2) * 0.012 - (eating ? 0.07 : 0), 16, dt);
      head.position.z = U.damp(head.position.z, eating ? 0.34 : 0.2, 16, dt);
      body.scale.y = 1 + Math.sin(t * 2) * 0.014;
      const grow = 1 + (st.gloom || 0) * 0.18;
      N.sc = U.damp(N.sc, (roaring ? 1.32 : st.party ? 1.05 + 0.03 * Math.sin(t * 24) : 1) * grow, 9, dt);
      g.scale.setScalar(N.sc);
      g.position.x = roaring ? Math.sin(t * 60) * 0.03 : 0;
      // brazos: golpea la mesa con los cubiertos cuando tiene hambre
      let rate = 0, amp = 0;
      if (!eating && !sleeping && !roaring && h > 0.22) { const k = (h - 0.22) / 0.78; rate = U.lerp(0.8, 2.7, k); amp = U.lerp(0.12, 0.36, k); }
      if (st.party && !eating) { rate = 3.2; amp = 0.26; }
      for (const a of arms) {
        const prev = Math.sin(a.phase);
        a.phase += rate * Math.PI * 2 * dt;
        const cur = Math.sin(a.phase);
        let target = rate > 0 ? Math.max(0, cur) * amp : 0;
        if (roaring) target = 0.5 + Math.sin(t * 32 + a.phase) * 0.06;
        a.lift = U.damp(a.lift, target, 38, dt);
        if (rate > 0 && prev > 0 && cur <= 0 && W.onBang) W.onBang(amp);
        place(a);
      }
    };
    g.position.set(0, 0, NONA_Z);
    return N;
  }

  // =====================================================================
  //                              EL COMEDOR
  // =====================================================================
  let scene, hemi, fillL, gloom = 0, lamp, spot, lampSwing = 0, lampVel = 0, fridgeDoor, fridgeOpen = 0, clockHand, calTex, calCanvas, skyMat, tvObj, tvScreenMat;
  const warm = new T.Color(0xffd9a0).convertSRGBToLinear();
  const portraits = {};
  const plates = [];
  let plateGeoMat = null;
  let food = null;
  const parts = [];

  function chair() {
    const c = 0x4a2c17, g = G(P(box(0.62, 0.07, 0.6, c), 0, 0.56, 0));
    for (const sx of [-1, 1]) {
      g.add(P(box(0.07, 0.56, 0.07, c), sx * 0.26, 0.28, 0.25));
      g.add(P(box(0.07, 1.5, 0.07, c), sx * 0.26, 0.75, -0.26));
    }
    for (let i = 0; i < 3; i++) g.add(P(box(0.5, 0.09, 0.04, 0x5c3a20), 0, 0.85 + i * 0.22, -0.26));
    g.add(P(box(0.66, 0.1, 0.08, c), 0, 1.5, -0.26));
    return g;
  }

  W.build = function (sc) {
    scene = sc;
    // ---- luces ----
    hemi = new T.HemisphereLight(0xfff1d6, 0x3a2a20, 0.62); scene.add(hemi);
    fillL = new T.DirectionalLight(0xffe7c4, 0.5); fillL.position.set(1.5, 4, 7); scene.add(fillL);

    // ---- piso y paredes ----
    const floorTex = ctex(128, 128, (x) => {
      x.fillStyle = '#e6d3ab'; x.fillRect(0, 0, 128, 128);
      x.fillStyle = '#a84a33'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64);
      x.strokeStyle = 'rgba(60,30,20,.45)'; x.lineWidth = 2;
      x.strokeRect(0, 0, 64, 64); x.strokeRect(64, 64, 64, 64); x.strokeRect(64, 0, 64, 64); x.strokeRect(0, 64, 64, 64);
    }, 8, 7);
    const floor = new T.Mesh(new T.PlaneGeometry(16, 14), tmat(floorTex, 0.55));
    floor.rotation.x = -HP; floor.position.set(0, 0, 3.6); floor.receiveShadow = true; scene.add(floor);

    const wallDraw = (x) => {
      x.fillStyle = '#84a08b'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#8eaa94' : '#7b9783'; x.fillRect(i * 64 + 22, 0, 20, 256); }
      x.fillStyle = '#d9c98f';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const px = i * 64 + ((j % 2) * 32), py = j * 64 + 32;
        x.beginPath(); x.moveTo(px, py - 9); x.lineTo(px + 6, py); x.lineTo(px, py + 9); x.lineTo(px - 6, py); x.closePath(); x.fill();
      }
      x.fillStyle = 'rgba(60,40,20,.08)';
      for (let i = 0; i < 120; i++) x.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    };
    const wall = new T.Mesh(new T.PlaneGeometry(16, 6.4), tmat(ctex(256, 256, wallDraw, 8, 3.2)));
    wall.position.set(0, 3.2, -3.3); wall.receiveShadow = true; scene.add(wall);
    for (const sx of [-1, 1]) {
      const sw = new T.Mesh(new T.PlaneGeometry(14, 6.4), tmat(ctex(256, 256, wallDraw, 7, 3.2)));
      sw.position.set(sx * 7, 3.2, 3.6); sw.rotation.y = -sx * HP; sw.receiveShadow = true; scene.add(sw);
      scene.add(P(box(0.1, 1.2, 14, 0x5a3a22), sx * 6.95, 0.6, 3.6));
    }
    scene.add(P(box(16, 1.2, 0.1, 0x5a3a22), 0, 0.6, -3.25));
    scene.add(P(box(16, 0.1, 0.16, 0x3d2616), 0, 1.25, -3.22));
    for (let i = -7; i <= 7; i++) scene.add(P(box(0.05, 1.1, 0.02, 0x4a2e1a), i * 1.05, 0.6, -3.19));

    // ---- mesa con mantel a cuadros ----
    const clothDraw = (x) => {
      x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 64, 64);
      x.fillStyle = 'rgba(205,35,28,.55)'; x.fillRect(0, 0, 32, 64); x.fillRect(0, 0, 64, 32);
    };
    const cTop = tmat(ctex(64, 64, clothDraw, 9.25, 5)), cFront = tmat(ctex(64, 64, clothDraw, 9.25, 0.85)), cSide = tmat(ctex(64, 64, clothDraw, 5, 0.85));
    const table = new T.Mesh(new T.BoxGeometry(3.7, 0.34, 2.0), [cSide, cSide, cTop, mat(0x3d2616), cFront, cFront]);
    table.position.set(0, TABLE_Y - 0.17, 0); table.castShadow = true; table.receiveShadow = true; scene.add(table);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) scene.add(P(box(0.13, 0.8, 0.13, 0x3d2616), sx * 1.6, 0.4, sz * 0.8));

    // ---- sillas ----
    const ch0 = chair(); ch0.position.set(0, 0, -1.95); ch0.scale.set(1.5, 1.32, 1); scene.add(ch0);
    const ch1 = chair(); ch1.position.set(-2.5, 0, 0.1); ch1.rotation.y = HP - 0.15; scene.add(ch1);
    const ch2 = chair(); ch2.position.set(2.5, 0, 0.1); ch2.rotation.y = -HP + 0.2; scene.add(ch2);

    // ---- lámpara colgante ----
    lamp = new T.Group(); lamp.position.set(0, 5.3, 0.15);
    lamp.add(P(cyl(0.014, 0.014, 1.5, 0x111111), 0, -0.75, 0));
    const shade = M(new T.ConeGeometry(0.58, 0.4, 28, 1, true), 0x2f6b55, { r: 0.35, side: T.DoubleSide });
    shade.position.y = -1.62; lamp.add(shade);
    lamp.add(P(cyl(0.06, 0.1, 0.12, 0x2f6b55, { r: 0.35 }), 0, -1.44, 0));
    lamp.add(P(sph(0.11, 0xfff3c4, { e: 0xffe9a8, ei: 1.4 }), 0, -1.72, 0));
    spot = new T.SpotLight(0xffd9a0, 1.35, 18, 1.0, 0.65, 1.0);
    spot.color.copy(warm);
    spot.position.set(0, -1.6, 0); spot.target.position.set(0, -6, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.002;
    spot.shadow.camera.near = 0.5; spot.shadow.camera.far = 9;
    lamp.add(spot); lamp.add(spot.target); scene.add(lamp);

    // ---- heladera ----
    const fr = new T.Group(); fr.position.set(-5.0, 0, -2.6);
    const frc = 0xd6e6da, fo = { r: 0.35 };
    fr.add(P(box(1.0, 1.8, 0.8, frc, fo), 0, 0.96, 0));
    fr.add(P(box(0.9, 1.66, 0.02, 0xfff3c4, { e: 0xffe9a8, ei: 0.8 }), 0, 0.96, 0.395));
    for (let i = 0; i < 3; i++) fr.add(P(box(0.86, 0.02, 0.1, 0x9aa0a6), 0, 0.5 + i * 0.42, 0.36));
    fr.add(P(sph(0.1, 0xd62d20), -0.2, 0.62, 0.38)); fr.add(P(box(0.2, 0.14, 0.1, 0xf4c531), 0.2, 1.0, 0.38));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) fr.add(P(cyl(0.04, 0.03, 0.08, 0x555b61), sx * 0.4, 0.03, sz * 0.3));
    fridgeDoor = new T.Group(); fridgeDoor.position.set(-0.5, 0.96, 0.41);
    fridgeDoor.add(P(box(1.0, 1.8, 0.08, frc, fo), 0.5, 0, 0.04));
    fridgeDoor.add(P(box(0.05, 0.42, 0.06, 0xc9ccd1, { m: 0.8, r: 0.25 }), 0.9, 0.25, 0.11));
    fridgeDoor.add(P(box(0.24, 0.06, 0.02, 0xc8281c), 0.5, 0.66, 0.085));
    fr.add(fridgeDoor); scene.add(fr);

    // ---- aparador con tele y radio ----
    const ap = new T.Group(); ap.position.set(4.7, 0, -2.75);
    ap.add(P(box(2.1, 0.92, 0.62, 0x5a3a22), 0, 0.52, 0));
    ap.add(P(box(2.2, 0.06, 0.7, 0x3d2616), 0, 1.01, 0));
    for (const sx of [-1, 1]) { ap.add(P(box(0.9, 0.7, 0.03, 0x6b4426), sx * 0.5, 0.52, 0.32)); ap.add(P(sph(0.035, 0xd4af37, { m: 0.7, r: 0.3 }), sx * 0.12, 0.55, 0.35)); ap.add(P(cyl(0.05, 0.04, 0.08, 0x3d2616), sx * 0.9, 0.03, 0)); }
    tvObj = NG.models.get('tv'); tvObj.position.set(-0.35, 1.04, 0); tvObj.rotation.y = -0.3; tvObj.scale.setScalar(1.05);
    tvObj.traverse((o) => { if (o.name === 'screen') { tvScreenMat = o.material = o.material.clone(); } });
    ap.add(tvObj);
    const radio = G(box(0.46, 0.3, 0.2, 0xb8553a, { r: 0.4 }), P(box(0.2, 0.16, 0.02, 0xe9d7a8), -0.09, 0, 0.1), P(R(cyl(0.05, 0.05, 0.03, 0x2b1a12), HP, 0, 0), 0.13, 0.03, 0.11));
    P(radio, 0.72, 1.19, 0.05); radio.rotation.y = -0.4; ap.add(radio);
    scene.add(ap);

    // ---- reloj de pared ----
    const ck = new T.Group(); ck.position.set(4.7, 3.15, -3.22);
    ck.add(R(cyl(0.5, 0.5, 0.08, 0x3d2616, null, 32), HP, 0, 0));
    ck.add(P(R(cyl(0.43, 0.43, 0.02, 0xfdf6e3, null, 32), HP, 0, 0), 0, 0, 0.04));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; ck.add(R(P(box(0.025, i % 3 ? 0.05 : 0.1, 0.01, 0x222222), Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0.055), 0, 0, -a)); }
    clockHand = G(P(box(0.04, 0.34, 0.012, 0xc8281c), 0, 0.15, 0)); clockHand.position.z = 0.065; ck.add(clockHand);
    ck.add(P(R(cyl(0.04, 0.04, 0.03, 0x222222), HP, 0, 0), 0, 0, 0.07));
    scene.add(ck);

    // ---- almanaque ----
    calCanvas = document.createElement('canvas'); calCanvas.width = 192; calCanvas.height = 256;
    calTex = new T.CanvasTexture(calCanvas); calTex.encoding = T.sRGBEncoding;
    const cal = new T.Mesh(new T.PlaneGeometry(0.66, 0.88), new T.MeshStandardMaterial({ map: calTex, roughness: 0.9 }));
    cal.position.set(3.15, 2.5, -3.27); cal.rotation.z = -0.03; scene.add(cal);
    W.setDay(1, 'LUNES');

    // ---- ventana ----
    const wn = new T.Group(); wn.position.set(-3.55, 2.65, -3.27);
    wn.add(box(1.6, 1.8, 0.08, 0xe9dcc0));
    skyMat = new T.MeshBasicMaterial({ color: 0xbfe6ff });
    wn.add(P(new T.Mesh(new T.PlaneGeometry(1.4, 1.6), skyMat), 0, 0, 0.045));
    wn.add(P(box(0.06, 1.6, 0.03, 0xe9dcc0), 0, 0, 0.06)); wn.add(P(box(1.4, 0.06, 0.03, 0xe9dcc0), 0, 0, 0.06));
    for (const sx of [-1, 1]) wn.add(P(box(0.36, 1.95, 0.07, 0xb5483a), sx * 0.86, -0.02, 0.1));
    wn.add(P(R(cyl(0.025, 0.025, 2.2, 0x3d2616), 0, 0, HP), 0, 0.98, 0.12));
    scene.add(wn);

    // ---- retratos de la familia ----
    const xs = [-2.3, -1.15, 0, 1.15, 2.3], ys = [2.72, 2.98, 3.08, 2.98, 2.72];
    NG.FAMILY.forEach((f, i) => {
      const g = new T.Group();
      g.add(box(0.78, 1.0, 0.06, 0xa67c2e, { m: 0.4, r: 0.45 }));
      g.add(P(box(0.68, 0.9, 0.02, 0x3d2616), 0, 0, 0.03));
      const tex = new T.CanvasTexture(W.faceCanvas(f.id, false)); tex.encoding = T.sRGBEncoding;
      const dtex = new T.CanvasTexture(W.faceCanvas(f.id, true)); dtex.encoding = T.sRGBEncoding;
      const pic = new T.Mesh(new T.PlaneGeometry(0.62, 0.82), new T.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
      pic.position.z = 0.045; g.add(pic);
      g.add(P(label(f.name.toUpperCase(), 0.5, 0.11, { bg: '#d4af37', fg: '#24140c' }), 0, -0.56, 0.035));
      g.position.set(xs[i], ys[i], -3.25);
      scene.add(g);
      portraits[f.id] = { g, pic, tex, dtex, baseY: ys[i], alive: true, tilt: 0, side: i % 2 ? 1 : -1 };
    });

    // ---- la Nona y su plato ----
    W.nona = buildNona(); scene.add(W.nona.group);
    const pl = NG.models.h.plate(0.5); pl.position.copy(W.platePos); pl.position.y = TABLE_Y; pl.scale.setScalar(0.92); scene.add(pl);
    const vino = NG.models.get('vino'); vino.position.set(-1.25, TABLE_Y, -0.45); vino.scale.setScalar(0.62); scene.add(vino);
    const panera = NG.models.get('pan'); panera.position.set(-1.2, TABLE_Y, 0.4); panera.scale.setScalar(0.5); panera.rotation.y = 0.5; scene.add(panera);

    // ---- partículas ----
    const pg = new T.BoxGeometry(0.05, 0.05, 0.05);
    for (let i = 0; i < 80; i++) {
      const m = new T.Mesh(pg, mat(0xffffff)); m.visible = false; scene.add(m);
      parts.push({ m, v: new T.Vector3(), life: 0, spin: new T.Vector3() });
    }
    plateGeoMat = { geo: new T.LatheGeometry([[0, 0], [0.2, 0], [0.33, 0.025], [0.33, 0.04], [0.2, 0.02], [0, 0.02]].map((p) => new T.Vector2(p[0], p[1])), 20), mat: mat(0xf7f4ea, { r: 0.35 }) };
  };

  // ---------- API ----------
  W.setDay = function (n, name) {
    if (!calCanvas) return;
    const x = calCanvas.getContext('2d');
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 192, 256);
    x.fillStyle = '#c8281c'; x.fillRect(0, 0, 192, 62);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '34px "Lilita One","Arial Black",sans-serif'; x.fillText(name, 96, 34, 180);
    x.fillStyle = '#24140c'; x.font = '150px "Lilita One","Arial Black",sans-serif'; x.fillText(String(n), 96, 165, 180);
    x.strokeStyle = '#24140c'; x.lineWidth = 6; x.strokeRect(3, 3, 186, 250);
    calTex.needsUpdate = true;
  };
  W.setPortrait = function (id, alive) {
    const p = portraits[id]; if (!p) return;
    p.alive = alive;
    p.pic.material.map = alive ? p.tex : p.dtex;
    p.pic.material.needsUpdate = true;
    if (!alive) W.burst(p.g.position, 0xd4af37, 8, 2);
  };
  W.portraitPos = (id) => portraits[id].g.position;
  W.showTV = function (v) { if (tvObj) tvObj.visible = v; };
  W.tvPos = function () { return tvObj.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.5, 0)); };
  W.kickLamp = function (v) { lampVel += v; };
  W.openFridge = function () { fridgeOpen = 1; };

  W.burst = function (pos, color, n, spd, up) {
    const m = mat(color);
    let k = 0;
    for (const p of parts) {
      if (p.life > 0) continue;
      p.m.material = m; p.m.visible = true;
      p.m.position.copy(pos);
      const a = Math.random() * 6.283, s = (spd || 2) * (0.4 + Math.random() * 0.8);
      p.v.set(Math.cos(a) * s, (up === undefined ? 2.2 : up) + Math.random() * 2, Math.sin(a) * s * 0.7 + 0.6);
      p.spin.set(U.rand(-9, 9), U.rand(-9, 9), U.rand(-9, 9));
      p.m.scale.setScalar(U.rand(0.6, 1.7));
      p.life = U.rand(0.45, 0.9);
      if (++k >= n) break;
    }
  };

  const STACKS = [[1.25, -0.42], [1.58, -0.08], [-1.62, -0.05], [1.2, 0.32], [-1.6, 0.42], [1.6, 0.6]];
  W.addPlate = function () {
    const n = plates.length;
    if (n >= STACKS.length * 16) return;
    const st = STACKS[Math.floor(n / 16)], k = n % 16;
    const m = new T.Mesh(plateGeoMat.geo, plateGeoMat.mat);
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(st[0] + U.rand(-0.02, 0.02), TABLE_Y + k * 0.034, st[1] + U.rand(-0.02, 0.02));
    m.rotation.set(U.rand(-0.03, 0.03), U.rand(0, 6), U.rand(-0.03, 0.03));
    m.userData.pop = 0;
    scene.add(m); plates.push(m);
  };
  W.resetRun = function () {
    plates.forEach((p) => scene.remove(p)); plates.length = 0;
    if (food) { scene.remove(food.m); food = null; }
    NG.FAMILY.forEach((f) => { const p = portraits[f.id]; p.tilt = 0; p.g.rotation.z = 0; p.g.position.y = p.baseY; W.setPortrait(f.id, true); });
    W.showTV(true);
  };

  // sirve un plato: aparece, la Nona lo devora en tres mordiscos
  const FOOD_S = 0.62;
  W.serve = function (art, fast) {
    if (food) { scene.remove(food.m); W.addPlate(); food = null; }
    const m = NG.models.get(art);
    m.position.copy(W.platePos); m.position.y = TABLE_Y + 0.045;
    m.scale.setScalar(0.01); m.rotation.y = U.rand(-0.5, 0.5);
    scene.add(m);
    food = { m, t: 0, bites: 0, step: fast ? 0.06 : 0.1 };
    W.nona.chomp(3);
    W.openFridge();
  };
  function updateFood(dt) {
    if (!food) return;
    food.t += dt;
    const f = food, t0 = 0.1;
    let target = FOOD_S * (1 - f.bites / 3);
    if (f.t < t0) target = FOOD_S * U.ease.outBack(f.t / t0);
    const s = U.damp(f.m.scale.x, Math.max(0.001, target), 40, dt);
    f.m.scale.setScalar(s);
    const due = Math.floor((f.t - t0) / f.step);
    while (f.bites < due && f.bites < 3) {
      f.bites++;
      NG.audio.sfx('chomp');
      W.burst(new T.Vector3(W.platePos.x, TABLE_Y + 0.25, W.platePos.z), [0xf2cf6b, 0xc4281c, 0xd9963c, 0xfff6d8][f.bites % 4], 5, 1.6);
      if (NG.view) NG.view.shake = Math.max(NG.view.shake, 0.035);
    }
    if (f.bites >= 3 && f.t > t0 + f.step * 3 + 0.05) { scene.remove(f.m); food = null; W.addPlate(); }
  }

  const SKY = [0xbfe6ff, 0x8fd0ff, 0xffd08a, 0xff8a4a, 0x1b2450].map((c) => new T.Color(c));
  const tmpC = new T.Color();
  W.update = function (dt, st) {
    W.nona.update(dt, st);
    gloom = U.damp(gloom, st.gloom || 0, 2, dt);
    hemi.intensity = 0.62 * (1 - 0.55 * gloom);
    fillL.intensity = 0.5 * (1 - 0.6 * gloom);
    hemi.color.setRGB(1, 1 - 0.12 * gloom, 1 - 0.2 * gloom);
    if (scene.fog) { scene.fog.near = 9 - 5 * gloom; scene.fog.far = 18 - 8 * gloom; }
    updateFood(dt);
    // lámpara: péndulo amortiguado
    lampVel += (-lampSwing * 14 - lampVel * 1.4) * dt;
    lampSwing += lampVel * dt;
    lamp.rotation.z = lampSwing + Math.sin(W.nona.t * 0.7) * 0.012;
    if (st.party) { tmpC.setHSL((W.nona.t * 1.2) % 1, 0.9, 0.62); spot.color.lerp(tmpC, 0.3); spot.intensity = 1.7; }
    else {
      spot.color.lerp(warm, 0.08);
      const flick = st.hunger > 0.85 ? 0.75 + 0.25 * Math.sin(W.nona.t * 31) * Math.sin(W.nona.t * 17) : 1;
      spot.intensity = U.damp(spot.intensity, 1.35 * flick, 20, dt);
    }
    // heladera
    fridgeOpen = Math.max(0, fridgeOpen - dt * 2.2);
    fridgeDoor.rotation.y = -Math.sin(Math.min(1, fridgeOpen) * Math.PI) * 0.9;
    // reloj y cielo
    clockHand.rotation.z = -st.dayK * Math.PI * 2;
    const k = U.clamp(st.dayK, 0, 0.9999) * (SKY.length - 1), i = Math.floor(k);
    skyMat.color.copy(SKY[i]).lerp(SKY[i + 1], k - i);
    if (tvScreenMat) tvScreenMat.emissiveIntensity = 0.6 + 0.4 * Math.sin(W.nona.t * 23) * Math.sin(W.nona.t * 7.3);
    // retratos caídos
    for (const id in portraits) {
      const p = portraits[id];
      const tz = p.alive ? 0 : p.side * 0.38;
      p.g.rotation.z = U.damp(p.g.rotation.z, tz + (p.alive ? 0 : Math.sin(W.nona.t * 1.5 + p.baseY) * 0.02), 6, dt);
      p.g.position.y = U.damp(p.g.position.y, p.baseY - (p.alive ? 0 : 0.16), 6, dt);
    }
    // platos sucios: aparecen con un saltito
    for (let j = Math.max(0, plates.length - 4); j < plates.length; j++) {
      const m = plates[j];
      if (m.userData.pop < 1) { m.userData.pop = Math.min(1, m.userData.pop + dt * 7); m.scale.setScalar(U.ease.outBack(m.userData.pop)); }
    }
    // partículas
    for (const p of parts) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.v.y -= 9.5 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += p.spin.x * dt; p.m.rotation.y += p.spin.y * dt; p.m.rotation.z += p.spin.z * dt;
      if (p.life <= 0 || p.m.position.y < 0) { p.life = 0; p.m.visible = false; }
    }
  };
})();
