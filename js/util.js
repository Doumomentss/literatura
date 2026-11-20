/* La Nona: ¡A Morfar! — utilidades */
(function () {
  'use strict';
  const NG = (window.NG = window.NG || {});
  const U = (NG.U = {});

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  // interpolación exponencial independiente del framerate
  U.damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  U.wpick = (items, wf) => {
    let tot = 0;
    const ws = items.map((it) => { const w = Math.max(0, wf(it)); tot += w; return w; });
    let r = Math.random() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  U.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };

  // ---- mini gestor de tweens (corre con el tiempo de juego, se frena en pausa) ----
  let tweens = [];
  NG.tween = function (dur, fn, done, ease) {
    const t = { t: 0, dur: Math.max(0.0001, dur), fn: fn, done: done, ease: ease || U.ease.linear, dead: false };
    tweens.push(t);
    return t;
  };
  NG.after = (dur, done) => NG.tween(dur, null, done);
  NG.updateTweens = function (dt) {
    const n = tweens.length;
    for (let i = 0; i < n; i++) {
      const t = tweens[i];
      if (t.dead) continue;
      t.t += dt;
      const k = Math.min(1, t.t / t.dur);
      if (t.fn) t.fn(t.ease(k));
      if (k >= 1) { t.dead = true; if (t.done) t.done(); }
    }
    let alive = false;
    for (let i = 0; i < tweens.length; i++) if (tweens[i].dead) { alive = true; break; }
    if (alive) tweens = tweens.filter((t) => !t.dead);
  };
  NG.clearTweens = function () { tweens.forEach((t) => (t.dead = true)); tweens = []; };

  // guardado local, a prueba de modo privado
  NG.store = {
    get(k, d) { try { const v = localStorage.getItem('nona_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('nona_' + k, JSON.stringify(v)); } catch (e) { /* sin guardado */ } },
  };
})();
