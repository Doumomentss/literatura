/* La Nona: ¡A Morfar! — modelos 3D procedurales (comidas y objetos) + miniaturas para las cartas */
(function () {
  'use strict';
  const NG = window.NG, T = THREE;
  const MD = (NG.models = {});

  // ---------- azar con semilla (los modelos salen iguales siempre) ----------
  let seed = 1;
  function sr() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function rnd(a, b) { return a + sr() * (b - a); }

  // ---------- materiales y primitivas ----------
  const matCache = {};
  function mat(color, o) {
    o = o || {};
    const key = [color, o.r, o.m, o.e, o.ei, o.op, o.flat ? 1 : 0, o.side || 0].join('|');
    if (matCache[key]) return matCache[key];
    const m = new T.MeshStandardMaterial({
      color: new T.Color(color).convertSRGBToLinear(),
      roughness: o.r === undefined ? 0.8 : o.r,
      metalness: o.m || 0,
      flatShading: !!o.flat,
    });
    if (o.e !== undefined) { m.emissive = new T.Color(o.e).convertSRGBToLinear(); m.emissiveIntensity = o.ei === undefined ? 1 : o.ei; }
    if (o.op) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
    if (o.side) m.side = o.side;
    return (matCache[key] = m);
  }
  function M(geo, color, o) {
    const m = new T.Mesh(geo, color && color.isMaterial ? color : mat(color, o));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  const box = (w, h, d, c, o) => M(new T.BoxGeometry(w, h, d), c, o);
  const cyl = (rt, rb, h, c, o, seg) => M(new T.CylinderGeometry(rt, rb, h, seg || 18), c, o);
  const sph = (r, c, o, ws, hs) => M(new T.SphereGeometry(r, ws || 16, hs || 12), c, o);
  const cone = (r, h, c, o, seg) => M(new T.ConeGeometry(r, h, seg || 14), c, o);
  const tor = (r, t, c, o, arc) => M(new T.TorusGeometry(r, t, 8, 24, arc || Math.PI * 2), c, o);
  function lathe(pts, c, o, seg) {
    return M(new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), seg || 24), c, o);
  }
  function P(m, x, y, z) { m.position.set(x, y, z); return m; }
  function R(m, x, y, z) { m.rotation.set(x, y, z); return m; }
  function S(m, x, y, z) { m.scale.set(x, y === undefined ? x : y, z === undefined ? x : z); return m; }
  function G() { const g = new T.Group(); for (let i = 0; i < arguments.length; i++) if (arguments[i]) g.add(arguments[i]); return g; }
  const HP = Math.PI / 2;

  function plate(r) {
    r = r || 0.5;
    const g = lathe([[0, 0], [r * 0.6, 0], [r, 0.07], [r, 0.09], [r * 0.62, 0.035], [0, 0.035]], 0xf7f4ea, { r: 0.35 }, 28);
    const rim = P(R(tor(r * 0.9, 0.011, 0x3c6fb0), HP, 0, 0), 0, 0.08, 0);
    return G(g, rim);
  }
  // prisma triangular (cuña de queso)
  function wedge(len, width, h, c, o) {
    const s = new T.Shape();
    s.moveTo(0, 0); s.lineTo(len, -width / 2); s.lineTo(len, width / 2); s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    const m = M(g, c, o);
    m.rotation.x = -HP;
    return G(m);
  }
  // cartelito con texto (plano con textura de canvas)
  function label(text, w, h, o) {
    o = o || {};
    const c = document.createElement('canvas');
    c.width = 256; c.height = Math.max(16, Math.round((256 * h) / w));
    const x = c.getContext('2d');
    if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, c.width, c.height); }
    x.fillStyle = o.fg || '#222';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const lines = String(text).split('\n');
    const fs = Math.min((c.height / lines.length) * 0.8, o.fs || 999);
    x.font = `${fs}px "Lilita One","Arial Black",sans-serif`;
    lines.forEach((ln, i) => x.fillText(ln, c.width / 2, (c.height / lines.length) * (i + 0.5) + fs * 0.05, c.width * 0.94));
    const tx = new T.CanvasTexture(c);
    tx.encoding = T.sRGBEncoding;
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: !o.bg, side: T.DoubleSide }));
    return m;
  }
  MD.h = { mat, M, box, cyl, sph, cone, tor, lathe, P, R, S, G, plate, wedge, label, rnd, HP };

  // =====================================================================
  //                               COMIDAS
  // =====================================================================
  const D = {};
  const SALSA = 0xc4281c, WOOD = 0xa9743f;

  D.pan = () => {
    const g = G(P(box(1.05, 0.05, 0.66, WOOD), 0, 0.025, 0));
    const loaf = G(S(sph(0.2, 0xd18f3a), 1.9, 0.85, 1));
    for (let i = -1; i <= 1; i++) loaf.add(R(P(box(0.035, 0.02, 0.2, 0xf5dca6), i * 0.16, 0.158 - Math.abs(i) * 0.014, 0), 0, 0.6, 0));
    P(loaf, -0.1, 0.22, -0.1); loaf.rotation.y = 0.2; g.add(loaf);
    for (let i = 0; i < 2; i++) {
      const s = G(cyl(0.12, 0.12, 0.04, 0xf6e6bd), R(tor(0.12, 0.018, 0xc98533), HP, 0, 0));
      P(s, 0.26 + i * 0.1, 0.075 + i * 0.03, 0.17 - i * 0.03); s.rotation.set(0.25 * i, 0, 0.3 * i); g.add(s);
    }
    g.add(P(box(0.15, 0.07, 0.1, 0xffe26b, { r: 0.4 }), -0.3, 0.085, 0.2));
    return g;
  };

  D.tallarines = () => {
    const g = G(plate());
    for (let i = 0; i < 10; i++) {
      const t = tor(0.19 + (i % 3) * 0.04 - i * 0.008, 0.03, 0xf2cf6b);
      t.rotation.set(HP + rnd(-0.4, 0.4), rnd(-0.3, 0.3), rnd(0, 3));
      g.add(P(t, rnd(-0.05, 0.05), 0.09 + i * 0.022, rnd(-0.05, 0.05)));
    }
    g.add(P(S(sph(0.18, SALSA, { r: 0.5 }), 1, 0.42, 1), 0, 0.31, 0));
    g.add(P(R(S(sph(0.05, 0x3e8e3a), 1, 0.3, 1.7), 0, 0.6, 0), 0.03, 0.385, 0.02));
    g.add(P(R(S(sph(0.04, 0x3e8e3a), 1, 0.3, 1.7), 0, -0.9, 0), -0.03, 0.385, 0.0));
    return g;
  };

  D.milanesa = () => {
    const g = G(plate());
    const m = S(M(new T.DodecahedronGeometry(0.3, 1), 0xc98a3a, { flat: true }), 1.2, 0.2, 0.85);
    P(m, -0.08, 0.13, 0.04); m.rotation.y = 0.4; g.add(m);
    const l = M(new T.SphereGeometry(0.11, 12, 8, 0, Math.PI), 0xf7e14a, { side: T.DoubleSide });
    P(l, 0.25, 0.1, 0.24); l.rotation.set(-HP, 0, 0.5); l.scale.set(1, 1, 0.7); g.add(l);
    for (let i = 0; i < 8; i++) {
      const f = box(0.22, 0.036, 0.036, 0xf2c84b);
      P(f, 0.2 + rnd(-0.08, 0.08), 0.09 + i * 0.018, -0.2 + rnd(-0.07, 0.07));
      f.rotation.set(rnd(-0.3, 0.3), rnd(0, 3), rnd(-0.3, 0.3)); g.add(f);
    }
    return g;
  };

  D.flan = () => {
    const g = G(plate());
    g.add(P(cyl(0.33, 0.35, 0.015, 0xc97a1e, { r: 0.2 }, 24), 0, 0.052, 0));
    g.add(P(cyl(0.17, 0.25, 0.22, 0xe9b752, { r: 0.35 }, 24), 0, 0.17, 0));
    g.add(P(cyl(0.172, 0.19, 0.03, 0x8a4a12, { r: 0.2 }, 24), 0, 0.285, 0));
    g.add(P(S(sph(0.11, 0x9b5a22, { r: 0.4 }), 1, 0.7, 1), 0.28, 0.11, 0.1));
    g.add(P(S(sph(0.1, 0xfffbf0, { r: 0.5 }), 1, 0.8, 1), -0.28, 0.12, -0.06));
    g.add(P(cone(0.06, 0.1, 0xfffbf0), -0.28, 0.22, -0.06));
    return g;
  };

  D.mortadela = () => {
    const g = G(P(box(1.0, 0.05, 0.64, WOOD), 0, 0.025, 0));
    const m = G(cyl(0.19, 0.19, 0.4, 0xe7969c));
    m.add(P(cyl(0.192, 0.192, 0.05, 0xb8232a), 0, -0.19, 0));
    for (let i = 0; i < 9; i++) {
      const a = rnd(0, 6.28), r = rnd(0.02, 0.15);
      m.add(P(S(sph(0.022, 0xfff3ea), 1, 0.3, 1), Math.cos(a) * r, 0.2, Math.sin(a) * r));
    }
    m.rotation.set(0, -0.35, HP); P(m, -0.22, 0.24, -0.1); g.add(m);
    for (let i = 0; i < 4; i++) {
      const s = G(cyl(0.17, 0.17, 0.018, 0xea9ea3, null, 20));
      for (let k = 0; k < 5; k++) { const a = rnd(0, 6.28), r = rnd(0.02, 0.13); s.add(P(S(sph(0.02, 0xfff3ea), 1, 0.3, 1), Math.cos(a) * r, 0.009, Math.sin(a) * r)); }
      P(s, 0.1 + i * 0.1, 0.065 + i * 0.016, 0.14 - i * 0.02); s.rotation.set(0, 0, 0.12); g.add(s);
    }
    return g;
  };

  D.ravioles = () => {
    const g = G(plate());
    const rav = () => G(box(0.15, 0.028, 0.15, 0xf4dfa0), P(S(sph(0.058, 0xf7e6b0), 1, 0.6, 1), 0, 0.012, 0));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const r = rav(); P(r, (i - 1) * 0.17 + rnd(-0.01, 0.01), 0.085 + ((i + j) % 2) * 0.012, (j - 1) * 0.17); r.rotation.y = rnd(-0.25, 0.25); g.add(r);
    }
    for (let k = 0; k < 4; k++) { const r = rav(); P(r, (k % 2 - 0.5) * 0.17, 0.125, (Math.floor(k / 2) - 0.5) * 0.17); r.rotation.set(rnd(-0.2, 0.2), rnd(0, 1.5), rnd(-0.2, 0.2)); g.add(r); }
    g.add(P(S(sph(0.2, SALSA, { r: 0.5 }), 1, 0.24, 1), 0, 0.16, 0));
    for (let i = 0; i < 12; i++) g.add(R(P(box(0.03, 0.012, 0.012, 0xfff6d8), rnd(-0.14, 0.14), 0.2 + rnd(0, 0.01), rnd(-0.14, 0.14)), 0, rnd(0, 3), 0));
    g.add(P(R(S(sph(0.045, 0x3e8e3a), 1, 0.3, 1.7), 0, 0.5, 0), 0, 0.215, 0));
    return g;
  };

  D.noquis = () => {
    const g = G();
    const bill = R(P(box(0.44, 0.012, 0.21, 0x8cc084), 0.36, 0.008, 0.26), 0, 0.5, 0);
    bill.add(P(box(0.3, 0.004, 0.1, 0x5c9a58), 0, 0.007, 0));
    g.add(bill);
    g.add(plate());
    for (let i = 0; i < 30; i++) {
      const a = rnd(0, 6.28), r = Math.sqrt(sr()) * 0.27;
      const n = S(sph(0.052, 0xf3e2a4), 1, 0.75, 0.7);
      P(n, Math.cos(a) * r, 0.09 + (1 - r / 0.28) * 0.09 * sr(), Math.sin(a) * r); n.rotation.y = rnd(0, 3); g.add(n);
    }
    g.add(P(S(sph(0.16, SALSA, { r: 0.5 }), 1, 0.3, 1), 0, 0.19, 0));
    return g;
  };

  D.asado = () => {
    const g = G(P(box(1.1, 0.06, 0.7, 0x8a5a2b), 0, 0.03, 0));
    const tira = G(box(0.72, 0.12, 0.2, 0x7a3b1e, { flat: true }), P(box(0.72, 0.03, 0.2, 0x4d2412), 0, 0.065, 0));
    for (let i = 0; i < 4; i++) tira.add(P(R(cyl(0.036, 0.036, 0.25, 0xf1ead6), HP, 0, 0), -0.26 + i * 0.175, 0, 0));
    P(tira, -0.08, 0.13, -0.17); tira.rotation.y = 0.1; g.add(tira);
    const chori = (c) => G(R(cyl(0.06, 0.06, 0.28, c), 0, 0, HP), P(sph(0.06, c), -0.14, 0, 0), P(sph(0.06, c), 0.14, 0, 0));
    for (let i = 0; i < 2; i++) { const c = chori(0xa3411f); P(c, -0.26 + i * 0.1, 0.12, 0.1 + i * 0.13); c.rotation.y = -0.35; g.add(c); }
    const mor = chori(0x2a1614); P(mor, 0.13, 0.12, 0.18); mor.rotation.y = 0.3; g.add(mor);
    g.add(P(cyl(0.11, 0.08, 0.09, 0xf7f4ea), 0.4, 0.105, -0.02));
    g.add(P(cyl(0.095, 0.095, 0.012, 0x5c8a2e), 0.4, 0.15, -0.02));
    return g;
  };

  D.estofado = () => {
    const g = G();
    g.add(lathe([[0, 0], [0.3, 0], [0.46, 0.16], [0.48, 0.27], [0.43, 0.27], [0.4, 0.17], [0.27, 0.05], [0, 0.05]], 0xb5562e, { r: 0.6 }));
    g.add(P(cyl(0.415, 0.415, 0.02, 0xa8321c, { r: 0.4 }, 24), 0, 0.2, 0));
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3, r = 0.12 + (i % 2) * 0.14; g.add(R(P(box(0.12, 0.09, 0.1, 0x6b3418, { flat: true }), Math.cos(a) * r, 0.22, Math.sin(a) * r), rnd(-0.3, 0.3), rnd(0, 3), 0)); }
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.8, r = 0.1 + ((i + 1) % 2) * 0.17; g.add(R(P(tor(0.05, 0.02, 0xf2cf6b), Math.cos(a) * r, 0.225, Math.sin(a) * r), HP + rnd(-0.5, 0.5), 0, rnd(0, 3))); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26, r = 0.28; g.add(P(cyl(0.04, 0.04, 0.02, 0xf08a24), Math.cos(a) * r, 0.218, Math.sin(a) * r)); }
    for (const sx of [-1, 1]) g.add(P(box(0.14, 0.05, 0.14, 0xb5562e), sx * 0.52, 0.24, 0));
    return g;
  };

  D.pandulce = () => {
    const g = G(plate(0.46));
    g.add(P(cyl(0.27, 0.25, 0.22, 0xfaf3e3, null, 24), 0, 0.17, 0));
    g.add(P(cyl(0.274, 0.266, 0.045, 0xc0392b, null, 24), 0, 0.17, 0));
    g.add(P(cyl(0.3, 0.27, 0.1, 0xb97a35, null, 24), 0, 0.32, 0));
    g.add(P(S(sph(0.3, 0xa9692a, null, 20, 14), 1, 0.72, 1), 0, 0.37, 0));
    const cols = [0xd62839, 0x2e9e4f, 0xf2c230, 0xd62839, 0x5a2a12];
    for (let i = 0; i < 16; i++) {
      const a = rnd(0, 6.28), p = rnd(0.15, 1.35);
      g.add(P(sph(0.028, cols[i % 5]), 0.3 * Math.sin(p) * Math.cos(a), 0.37 + 0.216 * Math.cos(p), 0.3 * Math.sin(p) * Math.sin(a)));
    }
    return g;
  };

  D.picada = () => {
    const g = G(P(cyl(0.56, 0.56, 0.05, WOOD, null, 28), 0, 0.025, 0));
    const q = wedge(0.36, 0.3, 0.17, 0xf4c531); P(q, -0.42, 0.05, -0.12); q.rotation.y = 0.5; g.add(q);
    for (let i = 0; i < 3; i++) g.add(P(sph(0.03, 0xe0a80f), -0.2 + i * 0.07, 0.21, -0.2 + (i % 2) * 0.08));
    const sal = G(cyl(0.09, 0.09, 0.3, 0x7a1c1c)); sal.rotation.set(0, 0.4, HP); P(sal, 0.2, 0.14, -0.28); g.add(sal);
    for (let i = 0; i < 5; i++) {
      const s = G(cyl(0.085, 0.085, 0.015, 0x9c2a26, null, 16));
      for (let k = 0; k < 4; k++) { const a = rnd(0, 6.28), r = rnd(0.01, 0.06); s.add(P(S(sph(0.014, 0xfbe9e0), 1, 0.3, 1), Math.cos(a) * r, 0.008, Math.sin(a) * r)); }
      P(s, 0.34 - i * 0.09, 0.06 + i * 0.012, 0.0 + i * 0.045); s.rotation.z = -0.15; g.add(s);
    }
    for (let i = 0; i < 6; i++) { const a = 1.9 + i * 0.33, r = 0.36; g.add(P(sph(0.05, i % 3 ? 0x6b8e23 : 0x2a1b2d, { r: 0.3 }), Math.cos(a) * r, 0.1, Math.sin(a) * r)); }
    for (let i = 0; i < 4; i++) {
      const c = G(box(0.1, 0.1, 0.1, 0xf7dd72), P(cyl(0.006, 0.006, 0.22, 0xe9d7a8), 0, 0.12, 0));
      P(c, -0.12 + (i % 2) * 0.16, 0.1, 0.26 - Math.floor(i / 2) * 0.15); c.rotation.y = rnd(0, 1); g.add(c);
    }
    return g;
  };

  D.polenta = () => {
    const g = G(plate());
    g.add(P(S(sph(0.34, 0xf5c518, { r: 0.6 }, 20, 14), 1, 0.42, 1), 0, 0.1, 0));
    g.add(P(S(sph(0.2, 0xb8301f, { r: 0.5 }), 1, 0.25, 1), 0.02, 0.215, 0));
    for (let i = 0; i < 10; i++) g.add(R(P(box(0.03, 0.012, 0.012, 0xfff6d8), rnd(-0.13, 0.15), 0.265, rnd(-0.13, 0.13)), 0, rnd(0, 3), 0));
    const sp = G(R(cyl(0.02, 0.02, 0.5, 0xc99a5b), 0, 0, HP), P(S(sph(0.08, 0xc99a5b), 1.3, 0.4, 1), -0.3, 0, 0));
    P(sp, 0.42, 0.16, 0.2); sp.rotation.set(0, -0.5, 0.25); g.add(sp);
    return g;
  };

  D.empanadas = () => {
    const g = G(plate(0.54));
    const emp = () => {
      const e = G(S(M(new T.SphereGeometry(0.2, 14, 10, 0, Math.PI), 0xd9a14a, { side: T.DoubleSide }), 1, 0.42, 1));
      for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; e.add(P(sph(0.028, 0xc98a35), -0.2 * Math.cos(a), 0.012, 0.2 * Math.sin(a))); }
      e.add(P(S(sph(0.05, 0xb97a2c), 1.6, 0.3, 0.8), 0, 0.075, 0.08));
      return e;
    };
    const pos = [[-0.2, 0.08, -0.16, 0.3], [0.2, 0.08, -0.1, -0.5], [0, 0.085, 0.14, 2.6], [0.02, 0.16, -0.08, 1.2]];
    for (const p of pos) { const e = emp(); P(e, p[0], p[1], p[2]); e.rotation.y = p[3]; g.add(e); }
    return g;
  };

  D.pastafrola = () => {
    const g = G(plate(0.54));
    g.add(P(cyl(0.41, 0.39, 0.09, 0xd9a14a, null, 28), 0, 0.1, 0));
    g.add(P(cyl(0.355, 0.355, 0.02, 0x7a1f1a, { r: 0.3 }, 28), 0, 0.148, 0));
    const lat = new T.Group();
    for (let i = -2; i <= 2; i++) {
      const L = 2 * Math.sqrt(0.36 * 0.36 - Math.pow(i * 0.135, 2));
      lat.add(P(box(L, 0.022, 0.05, 0xe6b45a), 0, 0.162, i * 0.135));
      lat.add(P(box(0.05, 0.022, L, 0xedbf68), i * 0.135, 0.172, 0));
    }
    lat.rotation.y = Math.PI / 4; g.add(lat);
    g.add(P(R(tor(0.385, 0.03, 0xcf9440), HP, 0, 0), 0, 0.15, 0));
    return g;
  };

  D.pizza = () => {
    const g = G(P(cyl(0.57, 0.57, 0.02, 0xb9bcc2, { m: 0.5, r: 0.4 }, 28), 0, 0.01, 0));
    g.add(P(cyl(0.5, 0.5, 0.05, 0xe0a95a, null, 28), 0, 0.045, 0));
    g.add(P(cyl(0.44, 0.44, 0.02, SALSA, null, 28), 0, 0.068, 0));
    g.add(P(cyl(0.41, 0.41, 0.02, 0xf8e6a0, { r: 0.5 }, 28), 0, 0.078, 0));
    for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.39; g.add(P(sph(0.04, 0x55731d, { r: 0.3 }), Math.cos(a) * 0.28, 0.1, Math.sin(a) * 0.28)); }
    for (let i = 0; i < 8; i++) { const a = i * 0.785; g.add(R(P(box(0.16, 0.012, 0.035, 0xd62839), Math.cos(a) * 0.2, 0.092, Math.sin(a) * 0.2), 0, -a + HP, 0)); }
    for (let i = 0; i < 4; i++) g.add(R(P(box(0.86, 0.006, 0.012, 0xc9a56a), 0, 0.09, 0), 0, i * 0.785, 0));
    for (let i = 0; i < 12; i++) g.add(P(S(sph(0.012, 0x3b6b2a), 1, 0.4, 1), rnd(-0.3, 0.3), 0.09, rnd(-0.3, 0.3)));
    return g;
  };

  D.banquete = () => {
    const g = G(P(S(cyl(0.56, 0.5, 0.06, 0xc9ccd1, { r: 0.3, m: 0.6 }, 28), 1.15, 1, 0.85), 0, 0.03, 0));
    const c = 0xc47a2c;
    g.add(P(S(sph(0.26, c, { r: 0.45 }, 20, 14), 1.25, 0.82, 1), 0, 0.27, 0));
    g.add(P(S(sph(0.16, 0xcf8a35, { r: 0.45 }), 1.3, 0.7, 1.1), -0.05, 0.4, 0));
    for (const sz of [-1, 1]) {
      const leg = G(S(sph(0.11, c, { r: 0.45 }), 1.5, 1, 1), P(R(cyl(0.022, 0.022, 0.16, 0xf5eedd), 0, 0, HP), 0.2, 0, 0), P(sph(0.035, 0xf5eedd), 0.28, 0, 0));
      P(leg, 0.22, 0.26, sz * 0.2); leg.rotation.set(0, -sz * 0.35, 0.35); g.add(leg);
      g.add(R(P(S(sph(0.08, c, { r: 0.45 }), 1.6, 0.6, 1), -0.15, 0.3, sz * 0.25), 0, sz * 0.3, 0));
    }
    for (let i = 0; i < 9; i++) { const a = 0.2 + i * 0.7, rx = 0.5, rz = 0.34; g.add(P(sph(0.065, i % 3 === 2 ? 0xd9482b : 0xf0cf6a), Math.cos(a) * rx, 0.1, Math.sin(a) * rz)); }
    for (let i = 0; i < 5; i++) { const a = 0.55 + i * 1.26; g.add(P(M(new T.DodecahedronGeometry(0.06, 0), 0x4c9a3a, { flat: true }), Math.cos(a) * 0.42, 0.1, Math.sin(a) * 0.3)); }
    return g;
  };

  D.sobras = () => {
    const g = G(plate(0.46));
    const bone = G(R(cyl(0.035, 0.035, 0.3, 0xf3ecd9), 0, 0, HP));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bone.add(P(sph(0.05, 0xf3ecd9), sx * 0.16, 0, sz * 0.035));
    P(bone, -0.05, 0.1, 0.12); bone.rotation.y = 0.5; g.add(bone);
    const heel = S(M(new T.SphereGeometry(0.16, 14, 10, 0, Math.PI), 0xc98533, { side: T.DoubleSide }), 1, 0.8, 1.3);
    P(heel, 0.12, 0.09, -0.14); heel.rotation.y = 2.2; g.add(heel);
    g.add(R(P(cyl(0.125, 0.125, 0.01, 0xf5dca6, null, 14), 0.115, 0.11, -0.135), HP, 2.2 + HP, 0));
    g.add(R(P(tor(0.08, 0.02, 0xf2cf6b, null, 4.2), -0.2, 0.08, -0.12), HP, 0, 0.5));
    g.add(R(P(tor(0.06, 0.02, 0xf2cf6b, null, 3.5), -0.14, 0.085, -0.18), HP, 0, 2));
    const fly = G(sph(0.02, 0x111111), P(S(sph(0.022, 0xcfe8ff, { op: 0.6 }), 1.4, 0.2, 0.8), 0.02, 0.02, 0));
    g.add(P(fly, 0.2, 0.36, 0.12)); g.add(P(fly.clone(), -0.25, 0.3, 0.05));
    return g;
  };

  D.vino = () => {
    const g = G();
    g.add(P(lathe([[0, 0], [0.16, 0], [0.17, 0.05], [0.17, 0.5], [0.12, 0.64], [0.06, 0.72], [0.055, 0.95], [0.07, 0.96], [0.07, 1.0], [0, 1.0]], 0x1f4d2b, { r: 0.15 }, 20), -0.16, 0, 0));
    g.add(P(cyl(0.174, 0.174, 0.24, 0xf5ecd0), -0.16, 0.3, 0));
    g.add(P(cyl(0.177, 0.177, 0.06, 0x8e1b1b), -0.16, 0.3, 0));
    g.add(P(cyl(0.074, 0.074, 0.1, 0x8e1b1b), -0.16, 0.93, 0));
    g.add(P(cyl(0.11, 0.085, 0.24, 0xdfeef5, { op: 0.4, r: 0.1 }), 0.26, 0.12, 0.12));
    g.add(P(cyl(0.097, 0.082, 0.15, 0x7a0f1f, { r: 0.2 }), 0.26, 0.085, 0.12));
    return g;
  };

  // =====================================================================
  //                        OBJETOS (laburos y artimañas)
  // =====================================================================
  D.puesto = () => {
    const g = G(); const w = 0.95, d = 0.62, c = 0xc09355, c2 = 0xa67c41;
    g.add(P(box(w, 0.03, d, c2), 0, 0.015, 0));
    for (const sz of [-1, 1]) for (let k = 0; k < 2; k++) g.add(P(box(w, 0.1, 0.03, c), 0, 0.09 + k * 0.14, (sz * d) / 2));
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) g.add(P(box(0.03, 0.1, d, c), (sx * w) / 2, 0.09 + k * 0.14, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(P(box(0.05, 0.3, 0.05, c2), sx * (w / 2 - 0.01), 0.15, sz * (d / 2 - 0.01)));
    const tom = (x, y, z) => g.add(P(G(sph(0.1, 0xd62d20, { r: 0.35 }), P(cyl(0.012, 0.03, 0.03, 0x2e7d32), 0, 0.1, 0)), x, y, z));
    tom(-0.3, 0.27, 0.14); tom(-0.12, 0.29, 0.18); tom(-0.22, 0.4, 0.08);
    g.add(P(sph(0.11, 0xf08a24, { r: 0.6 }), 0.3, 0.28, 0.16)); g.add(P(sph(0.11, 0xf08a24, { r: 0.6 }), 0.14, 0.3, 0.12)); g.add(P(sph(0.11, 0xf5a43c, { r: 0.6 }), 0.24, 0.42, 0.06));
    g.add(P(M(new T.DodecahedronGeometry(0.17, 1), 0x6cb04a, { flat: true }), -0.24, 0.32, -0.14));
    g.add(P(M(new T.DodecahedronGeometry(0.15, 1), 0x8cc65a, { flat: true }), 0.02, 0.33, -0.13));
    g.add(R(P(S(sph(0.09, 0x5b2a86, { r: 0.3 }), 1, 1, 2.2), 0.3, 0.3, -0.14), 0.2, 0.5, 0));
    for (let i = 0; i < 3; i++) g.add(R(P(cone(0.04, 0.3, 0xf08a24), 0.02 + i * 0.06, 0.36, 0.1), HP - 0.4, 0, -0.2 + i * 0.2));
    const sign = G(P(cyl(0.012, 0.012, 0.4, 0x6b4a2b), 0, 0.2, 0), P(box(0.3, 0.2, 0.02, 0xfff8e4), 0, 0.42, 0), P(label('$', 0.26, 0.18, { fg: '#c8281c' }), 0, 0.42, 0.012));
    P(sign, 0.02, 0.3, -0.22); sign.rotation.z = -0.08; g.add(sign);
    return g;
  };

  D.costura = () => {
    const g = G(); const k = 0x1b1b1f, o = { r: 0.3 };
    g.add(P(box(1.0, 0.06, 0.46, 0x8a5a2b), 0, 0.03, 0));
    g.add(P(box(0.82, 0.07, 0.3, k, o), 0, 0.095, 0));
    g.add(P(box(0.16, 0.42, 0.2, k, o), 0.3, 0.34, 0));
    g.add(P(box(0.62, 0.14, 0.18, k, o), 0.03, 0.5, 0));
    g.add(P(box(0.14, 0.26, 0.18, k, o), -0.28, 0.4, 0));
    g.add(P(cyl(0.012, 0.012, 0.16, 0xcfd2d6, { m: 0.7, r: 0.3 }), -0.28, 0.2, 0));
    g.add(P(R(cyl(0.14, 0.14, 0.04, 0xd4af37, { m: 0.6, r: 0.3 }, 20), 0, 0, HP), 0.41, 0.45, 0));
    g.add(P(R(cyl(0.04, 0.04, 0.06, k, o), 0, 0, HP), 0.42, 0.45, 0));
    g.add(P(cyl(0.05, 0.05, 0.1, 0xd62839), 0.1, 0.63, 0));
    g.add(P(cyl(0.06, 0.06, 0.012, 0xe9d7a8), 0.1, 0.685, 0)); g.add(P(cyl(0.06, 0.06, 0.012, 0xe9d7a8), 0.1, 0.578, 0));
    g.add(P(box(0.3, 0.02, 0.005, 0xd4af37, { m: 0.6, r: 0.3 }), 0.0, 0.5, 0.092));
    g.add(P(box(0.56, 0.016, 0.4, 0x3f88c5), -0.3, 0.14, 0.03));
    g.add(P(box(0.56, 0.018, 0.05, 0xf2c230), -0.3, 0.141, 0.1));
    return g;
  };

  D.changas = () => {
    const g = G();
    g.add(P(lathe([[0, 0], [0.2, 0], [0.27, 0.36], [0.25, 0.36], [0.185, 0.03], [0, 0.03]], 0x4a90c2, { r: 0.4, side: T.DoubleSide }, 20), -0.2, 0, 0.05));
    g.add(P(cyl(0.245, 0.245, 0.02, 0xbfe3f5, { r: 0.2 }), -0.2, 0.3, 0.05));
    for (let i = 0; i < 6; i++) g.add(P(sph(rnd(0.04, 0.08), 0xffffff, { r: 0.2 }), -0.2 + rnd(-0.14, 0.14), 0.33 + rnd(0, 0.05), 0.05 + rnd(-0.14, 0.14)));
    g.add(P(R(tor(0.26, 0.012, 0x9aa0a6, { m: 0.6, r: 0.4 }, Math.PI), 0, 0, 0), -0.2, 0.36, 0.05));
    const br = G(P(cyl(0.022, 0.022, 1.0, 0xc99a5b), 0, 0.72, 0), P(cyl(0.05, 0.17, 0.3, 0xe6c34a, null, 10), 0, 0.15, 0), P(cyl(0.057, 0.057, 0.05, 0xb03a2e), 0, 0.3, 0));
    P(br, 0.32, 0, 0); br.rotation.z = -0.22; g.add(br);
    g.add(P(S(sph(0.13, 0xf2c230, { flat: true }, 7, 5), 1.3, 0.35, 1), 0.2, 0.04, 0.3));
    return g;
  };

  D.horas = () => {
    const g = G(); const gold = { m: 0.7, r: 0.3 };
    const b = G(R(cyl(0.33, 0.33, 0.2, 0xc0392b, { r: 0.3, m: 0.3 }, 28), HP, 0, 0), P(R(cyl(0.28, 0.28, 0.012, 0xfdf8ea, null, 28), HP, 0, 0), 0, 0, 0.1));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; b.add(R(P(box(0.016, i % 3 ? 0.03 : 0.06, 0.01, 0x222222), Math.sin(a) * 0.235, Math.cos(a) * 0.235, 0.108), 0, 0, -a)); }
    const h1 = G(P(box(0.028, 0.2, 0.012, 0x111111), 0, 0.09, 0)); P(h1, 0, 0, 0.115); h1.rotation.z = -0.5; b.add(h1);
    const h2 = G(P(box(0.034, 0.14, 0.012, 0x111111), 0, 0.06, 0)); P(h2, 0, 0, 0.118); h2.rotation.z = 2.0; b.add(h2);
    b.add(P(R(cyl(0.025, 0.025, 0.02, 0xd4af37, gold), HP, 0, 0), 0, 0, 0.12));
    P(b, 0, 0.43, 0); g.add(b);
    for (const sx of [-1, 1]) {
      g.add(R(P(M(new T.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, HP), 0xd4af37, gold), sx * 0.21, 0.71, 0), 0, 0, -sx * 0.6));
      g.add(R(P(cyl(0.025, 0.035, 0.16, 0x555b61, { m: 0.6, r: 0.4 }), sx * 0.2, 0.08, 0), 0, 0, sx * 0.45));
    }
    g.add(P(cyl(0.012, 0.012, 0.16, 0x555b61), 0, 0.84, 0)); g.add(P(sph(0.04, 0x555b61), 0, 0.92, 0));
    return g;
  };

  D.tango = () => {
    const g = new T.Group(); const wood = 0x2b1a12;
    for (const sx of [-1, 1]) {
      const e = G(box(0.2, 0.52, 0.52, wood, { r: 0.35 }), P(box(0.21, 0.4, 0.4, 0x3d2619, { r: 0.35 }), 0, 0, 0));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) e.add(P(sph(0.024, 0xf4efe1, { r: 0.3 }), sx * 0.108, -0.14 + i * 0.095, -0.14 + j * 0.095));
      for (const cy of [-1, 1]) for (const cz of [-1, 1]) e.add(P(box(0.215, 0.06, 0.06, 0xd9d0b8, { m: 0.4, r: 0.4 }), 0, cy * 0.235, cz * 0.235));
      P(e, sx * 0.47, 0.32, 0); e.rotation.z = -sx * 0.12; g.add(e);
    }
    for (let i = 0; i < 9; i++) {
      const big = i % 2 === 0, x = -0.3 + i * 0.075, y = 0.32 + Math.cos((i - 4) * 0.35) * 0.05 - 0.05;
      g.add(R(P(box(0.078, big ? 0.48 : 0.38, big ? 0.48 : 0.38, big ? 0x8e1b1b : 0x16161a), x, y, 0), 0, 0, -(i - 4) * 0.03));
    }
    g.rotation.y = -0.25;
    return G(g);
  };

  D.tv = () => {
    const g = G();
    g.add(P(box(0.92, 0.62, 0.5, 0x7a4a26, { r: 0.5 }), 0, 0.51, 0));
    g.add(P(box(0.58, 0.46, 0.02, 0x1d2328, { r: 0.2 }), -0.13, 0.51, 0.25));
    const scr = P(box(0.5, 0.38, 0.02, 0x9cc4d4, { e: 0x4f8ba6, ei: 0.9, r: 0.2 }), -0.13, 0.51, 0.262);
    scr.name = 'screen'; g.add(scr);
    g.add(P(R(cyl(0.05, 0.05, 0.04, 0xd9d0b8), HP, 0, 0), 0.31, 0.66, 0.26));
    g.add(P(R(cyl(0.05, 0.05, 0.04, 0xd9d0b8), HP, 0, 0), 0.31, 0.52, 0.26));
    for (let i = 0; i < 4; i++) g.add(P(box(0.14, 0.014, 0.01, 0x2b1a12), 0.31, 0.3 + i * 0.035, 0.255));
    for (const sx of [-1, 1]) g.add(R(P(cyl(0.008, 0.008, 0.6, 0xbfc4c9, { m: 0.7, r: 0.3 }), sx * 0.16, 1.08, 0), 0, 0, -sx * 0.5));
    g.add(P(sph(0.05, 0x333333), 0, 0.84, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(R(P(cyl(0.02, 0.03, 0.22, 0x2b1a12), sx * 0.38, 0.1, sz * 0.18), sz * -0.15, 0, sx * 0.15));
    return g;
  };

  D.quiniela = () => {
    const g = G();
    const tk = G(box(0.7, 0.012, 0.4, 0xfff8e4), R(P(label('QUINIELA\n48', 0.66, 0.36, { fg: '#c8281c' }), 0, 0.008, 0), -HP, 0, 0));
    P(tk, 0, 0.01, 0.05); tk.rotation.y = 0.2; g.add(tk);
    const ball = (c, n, x, y, z) => {
      const b = G(sph(0.14, c, { r: 0.25 }), P(S(sph(0.075, 0xffffff, { r: 0.3 }), 1, 1, 0.3), 0, 0.04, 0.115), P(label(n, 0.12, 0.12, { fg: '#111' }), 0, 0.04, 0.14));
      b.children[2].rotation.x = -0.25; b.children[1].rotation.x = -0.25;
      g.add(P(b, x, y, z));
    };
    ball(0xd62839, '4', -0.26, 0.17, -0.2); ball(0x2b62ab, '8', 0.06, 0.17, -0.26); ball(0xf2c230, '7', 0.32, 0.17, -0.12);
    return g;
  };

  D.siesta = () => {
    const g = G();
    g.add(P(S(sph(0.3, 0xfbfbf6, { r: 0.9 }, 18, 12), 1.55, 0.42, 1.05), 0, 0.13, 0));
    for (let i = -2; i <= 2; i++) g.add(P(S(sph(0.3, 0x9cc0e8, { r: 0.9 }, 12, 8), 0.05, 0.43, 1.03), i * 0.18, 0.131, 0));
    const cap = G(R(cone(0.17, 0.46, 0x3f6fb5, null, 16), 0, 0, 0), P(sph(0.065, 0xffffff), 0, 0.25, 0), P(R(tor(0.165, 0.035, 0xffffff), HP, 0, 0), 0, -0.22, 0));
    P(cap, 0.14, 0.44, 0); cap.rotation.z = -0.55; g.add(cap);
    const zs = [[-0.2, 0.52, 0.16], [-0.34, 0.74, 0.22], [-0.5, 1.02, 0.3]];
    zs.forEach((z) => g.add(P(label('Z', z[2], z[2], { fg: '#ffffff' }), z[0], z[1], 0.1)));
    return g;
  };

  D.casamiento = () => {
    const g = G(plate(0.56)); const w = 0xfffaf2;
    const tiers = [[0.38, 0.2, 0.17], [0.27, 0.18, 0.36], [0.16, 0.14, 0.52]];
    tiers.forEach((t, k) => {
      g.add(P(cyl(t[0], t[0], t[1], w, { r: 0.6 }, 28), 0, t[2], 0));
      const n = 12 - k * 3;
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; g.add(P(sph(0.032, k === 1 ? 0xf2c230 : 0xf48fb1), Math.cos(a) * t[0], t[2] + t[1] / 2, Math.sin(a) * t[0])); }
    });
    const gold = { m: 0.8, r: 0.25 };
    g.add(R(P(tor(0.1, 0.022, 0xf2c230, gold), -0.06, 0.71, 0), 0, 0.3, 0));
    g.add(R(P(tor(0.1, 0.022, 0xf2c230, gold), 0.07, 0.71, 0), 0, -0.9, 0));
    return g;
  };

  D.laburar = () => {
    const g = G(); const y = 0xf5c518, o = { r: 0.35 };
    g.add(P(M(new T.SphereGeometry(0.31, 18, 10, 0, Math.PI * 2, 0, HP), y, o), -0.15, 0.04, 0.05));
    g.add(P(cyl(0.37, 0.37, 0.035, y, o, 24), -0.15, 0.04, 0.05));
    g.add(P(S(sph(0.31, 0xe0b30f, o, 12, 8), 0.16, 1.03, 1.03), -0.15, 0.04, 0.05));
    g.add(P(box(0.2, 0.03, 0.2, y, o), -0.15, 0.03, 0.38));
    const p = G(P(cyl(0.026, 0.026, 0.85, 0xa9743f), 0, 0.62, 0), P(box(0.26, 0.32, 0.03, 0x9aa0a6, { m: 0.6, r: 0.35 }), 0, 0.12, 0), P(cone(0.13, 0.12, 0x9aa0a6, { m: 0.6, r: 0.35 }, 4), 0, -0.08, 0), P(tor(0.07, 0.02, 0xa9743f), 0, 1.1, 0));
    p.children[2].rotation.set(Math.PI, Math.PI / 4, 0); p.children[2].scale.set(1.4, 1, 0.16);
    P(p, 0.42, 0.1, -0.15); p.rotation.z = -0.3; g.add(p);
    return g;
  };

  D.receta = () => {
    const g = G();
    for (const sx of [-1, 1]) {
      const page = G(box(0.44, 0.03, 0.62, 0x7a2e1d), P(box(0.41, 0.05, 0.58, 0xfbf3dc), 0, 0.035, 0));
      for (let i = 0; i < 6; i++) page.add(P(box(i === 0 ? 0.2 : 0.32, 0.005, 0.022, i === 0 ? 0xc8281c : 0x8a7a66), i === 0 ? -0.05 : 0, 0.062, -0.21 + i * 0.085));
      P(page, sx * 0.218, 0.07, 0); page.rotation.z = sx * 0.13; g.add(page);
    }
    g.add(P(box(0.03, 0.02, 0.6, 0xc8281c), 0, 0.06, 0.02));
    const sp = G(R(cyl(0.022, 0.022, 0.62, 0xc99a5b), 0, 0, HP), P(S(sph(0.085, 0xc99a5b), 1.35, 0.4, 1), 0.38, 0, 0));
    P(sp, 0.02, 0.2, 0.36); sp.rotation.set(0, 0.25, 0.08); g.add(sp);
    return g;
  };

  D.olla = () => {
    const g = G(); const o = { m: 0.6, r: 0.4, side: T.DoubleSide };
    g.add(lathe([[0, 0], [0.36, 0], [0.42, 0.06], [0.42, 0.5], [0.45, 0.5], [0.45, 0.54], [0.38, 0.54], [0.38, 0.08], [0, 0.08]], 0x6d7278, o));
    g.add(P(cyl(0.385, 0.385, 0.02, 0xd9772b, { r: 0.5 }, 24), 0, 0.46, 0));
    const cols = [0xf08a24, 0xf0cf6a, 0x7a3b1e, 0x4c9a3a];
    for (let i = 0; i < 12; i++) { const a = rnd(0, 6.28), r = rnd(0.03, 0.3); g.add(P(sph(rnd(0.04, 0.07), cols[i % 4]), Math.cos(a) * r, 0.47, Math.sin(a) * r)); }
    for (const sx of [-1, 1]) g.add(R(P(tor(0.09, 0.022, 0x4a4e53, { m: 0.6, r: 0.4 }, Math.PI), sx * 0.45, 0.42, 0), HP, 0, sx > 0 ? -HP : HP));
    const lad = G(P(cyl(0.02, 0.02, 0.7, 0x9aa0a6, { m: 0.6, r: 0.35 }), 0, 0.35, 0), P(M(new T.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, HP, HP), 0x9aa0a6, o), 0, 0.02, 0));
    P(lad, 0.14, 0.44, -0.08); lad.rotation.set(-0.25, 0, -0.5); g.add(lad);
    for (let i = 0; i < 5; i++) g.add(P(sph(0.07 + i * 0.012, 0xffffff, { op: 0.45, r: 1 }), -0.15 + rnd(-0.1, 0.1) + i * 0.03, 0.68 + i * 0.12, rnd(-0.08, 0.08)));
    return g;
  };

  D.fiado = () => {
    const g = G();
    const nb = G(box(0.62, 0.06, 0.82, 0x1c1c1c), P(box(0.57, 0.05, 0.77, 0xfbf3dc), 0, 0.03, 0));
    for (let i = 0; i < 8; i++) nb.add(P(box(0.5, 0.004, 0.012, 0x8fb4d9), 0.02, 0.057, -0.28 + i * 0.085));
    nb.add(P(box(0.012, 0.004, 0.74, 0xd62839), -0.19, 0.058, 0));
    for (let i = 0; i < 9; i++) nb.add(R(P(tor(0.03, 0.008, 0xbfc4c9, { m: 0.7, r: 0.3 }), -0.25 + i * 0.0625, 0.05, -0.39), 0, HP, 0));
    nb.add(R(P(label('DEBE', 0.34, 0.16, { fg: '#c8281c' }), 0.05, 0.062, 0.05), -HP, 0, 0.25));
    nb.rotation.y = 0.2; P(nb, -0.05, 0.03, 0); g.add(nb);
    const pen = G(R(cyl(0.026, 0.026, 0.5, 0xf2c230, null, 6), 0, 0, HP), P(R(cone(0.026, 0.07, 0xe9d7a8, null, 6), 0, 0, -HP), 0.285, 0, 0), P(R(cyl(0.027, 0.027, 0.05, 0xf48fb1, null, 6), 0, 0, HP), -0.275, 0, 0));
    P(pen, 0.34, 0.035, 0.3); pen.rotation.y = 0.9; g.add(pen);
    return g;
  };

  D.cayetano = () => {
    const g = G(); const gold = { m: 0.6, r: 0.35 };
    g.add(P(cyl(0.2, 0.24, 0.04, 0xd4af37, gold), -0.12, 0.02, 0));
    g.add(P(cyl(0.1, 0.1, 0.5, 0xfdf6e3), -0.12, 0.29, 0));
    g.add(P(S(sph(0.1, 0xfdf6e3), 1, 0.3, 1), -0.12, 0.54, 0));
    g.add(P(cyl(0.006, 0.006, 0.06, 0x222222), -0.12, 0.58, 0));
    g.add(P(S(sph(0.065, 0xffc531, { e: 0xff9a1f, ei: 1 }), 1, 1.8, 1), -0.12, 0.69, 0));
    g.add(P(S(sph(0.03, 0xfff6c9, { e: 0xfff0a0, ei: 1 }), 1, 1.6, 1), -0.12, 0.66, 0.02));
    const e = G(P(cyl(0.012, 0.012, 0.75, 0xcfa23a), 0, 0.375, 0));
    for (let i = 0; i < 9; i++) {
      const s = i % 2 ? 1 : -1;
      e.add(R(P(S(sph(0.048, 0xe2b84b), 0.6, 1.4, 0.6), s * 0.038, 0.46 + i * 0.048, 0), 0, 0, -s * 0.45));
      e.add(R(P(cyl(0.004, 0.004, 0.16, 0xe9cf7a), s * 0.085, 0.56 + i * 0.048, 0), 0, 0, -s * 0.5));
    }
    P(e, 0.28, 0, 0.04); e.rotation.z = -0.3; g.add(e);
    const e2 = e.clone(); P(e2, 0.2, 0, -0.08); e2.rotation.z = -0.12; e2.scale.setScalar(0.85); g.add(e2);
    return g;
  };

  D.kiosco = () => {
    const g = G(); const wood = 0x2f6b55, o = { r: 0.5 };
    g.add(P(box(1.0, 0.5, 0.5, wood, o), 0, 0.25, 0));
    g.add(P(box(1.04, 0.04, 0.54, 0xd9c08a), 0, 0.52, 0));
    g.add(P(box(0.92, 0.36, 0.02, 0xfff3c4, { e: 0xffe9a8, ei: 0.3 }), 0, 0.27, 0.252));
    for (const sx of [-1, 1]) g.add(P(box(0.05, 0.62, 0.05, wood, o), sx * 0.48, 0.84, -0.2));
    const roof = P(box(1.12, 0.05, 0.62, 0xc8281c), 0, 1.16, -0.04); roof.rotation.x = 0.12; g.add(roof);
    for (let i = 0; i < 5; i++) g.add(P(box(0.11, 0.08, 0.02, i % 2 ? 0xfffaf0 : 0xc8281c), -0.44 + i * 0.22, 1.1, 0.27));
    const sign = P(label('KIOSCO', 0.9, 0.18, { bg: '#f2c230', fg: '#24140c' }), 0, 1.3, -0.02); g.add(sign);
    const jar = (x, c) => g.add(P(G(cyl(0.085, 0.085, 0.22, 0xdfeef5, { op: 0.45, r: 0.1 }), P(cyl(0.07, 0.07, 0.14, c, { r: 0.4 }), 0, -0.03, 0), P(cyl(0.09, 0.09, 0.04, 0xc8281c), 0, 0.12, 0)), x, 0.65, -0.05));
    jar(-0.34, 0xf48fb1); jar(-0.14, 0xf2c230); jar(0.06, 0x7fd0ff);
    for (let i = 0; i < 6; i++) g.add(R(P(box(0.12, 0.03, 0.07, [0x6b3418, 0xd62839, 0x2b62ab][i % 3]), 0.18 + (i % 3) * 0.1, 0.56 + Math.floor(i / 3) * 0.032, 0.12), 0, 0.2, 0));
    const diario = G(box(0.36, 0.02, 0.26, 0xf2efe6), P(box(0.3, 0.004, 0.04, 0x333333), 0, 0.012, -0.08));
    for (let i = 0; i < 3; i++) diario.add(P(box(0.13, 0.004, 0.012, 0x888888), -0.07, 0.012, -0.01 + i * 0.04));
    P(diario, -0.22, 0.555, 0.12); diario.rotation.y = -0.2; g.add(diario);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; g.add(P(sph(0.035, [0xd62839, 0xf2c230, 0x2e9e4f, 0xf48fb1][i % 4], { r: 0.25 }), 0.5 + Math.cos(a) * 0.12, 0.03, 0.35 + Math.sin(a) * 0.08)); }
    return g;
  };

  // =====================================================================
  const protos = {};
  MD.names = Object.keys(D);
  MD.get = function (name) {
    if (!protos[name]) {
      if (!D[name]) name = 'pan';
      let h = 7; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100000;
      seed = 1000 + h;
      protos[name] = D[name]();
    }
    return protos[name].clone(true);
  };

  // Miniaturas: se renderiza cada modelo 3D a un canvas (arte de las cartas e íconos del HUD)
  MD.renderThumbs = function () {
    const W = 320, H = 240;
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.outputEncoding = T.sRGBEncoding;
    r.setClearColor(0x000000, 0);
    const sc = new T.Scene();
    sc.add(new T.AmbientLight(0xffffff, 0.62));
    const d1 = new T.DirectionalLight(0xffffff, 0.95); d1.position.set(2, 4, 3); sc.add(d1);
    const d2 = new T.DirectionalLight(0xffe0b0, 0.4); d2.position.set(-3, 2, -1); sc.add(d2);
    const cam = new T.PerspectiveCamera(28, W / H, 0.1, 50);
    const dir = new T.Vector3(0.32, 0.6, 1).normalize();
    NG.thumbs = {};
    for (const name of MD.names) {
      const m = MD.get(name);
      sc.add(m);
      const bb = new T.Box3().setFromObject(m);
      const c = bb.getCenter(new T.Vector3());
      const rad = bb.getSize(new T.Vector3()).length() / 2;
      const dist = (rad / Math.sin((14 * Math.PI) / 180)) * 0.9;
      cam.position.copy(c).addScaledVector(dir, dist);
      cam.lookAt(c);
      r.render(sc, cam);
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      cv.getContext('2d').drawImage(r.domElement, 0, 0);
      NG.thumbs[name] = cv;
      sc.remove(m);
    }
    r.dispose();
    if (r.forceContextLoss) r.forceContextLoss();
  };
})();
