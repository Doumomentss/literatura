/* La Nona: ¡A Morfar! — audio 100% procedural (WebAudio): efectos + tarantela original */
(function () {
  'use strict';
  const NG = window.NG, U = NG.U;
  const A = (NG.audio = { ctx: null, muted: NG.store.get('mute', false), intensity: 0, frenzy: false, calm: true });
  let ctx = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null, timer = null;

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = A.ctx = new AC();
    master = ctx.createGain();
    master.gain.value = A.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    master.connect(comp); comp.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.42; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.85; sfxGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.startMusic();
  };

  A.toggleMute = function () {
    A.muted = !A.muted;
    NG.store.set('mute', A.muted);
    if (master) master.gain.setTargetAtTime(A.muted ? 0 : 0.9, ctx.currentTime, 0.03);
    return A.muted;
  };
  A.suspend = function () { if (ctx && ctx.state === 'running') ctx.suspend(); };
  A.resume = function () { if (ctx && ctx.state === 'suspended') ctx.resume(); };

  // ---------- primitivas ----------
  function tone(o) {
    const t = (o.at !== undefined ? o.at : ctx.currentTime) + (o.t || 0);
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const a = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol || 0.2, t + a);
    if (o.hold) g.gain.setValueAtTime(o.vol || 0.2, t + Math.max(a, o.dur * o.hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g);
    g.connect(o.dest || sfxGain);
    osc.start(t); osc.stop(t + o.dur + 0.03);
  }
  function noise(o) {
    const t = (o.at !== undefined ? o.at : ctx.currentTime) + (o.t || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'highpass';
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    f.Q.value = o.q || 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxGain);
    src.start(t, Math.random() * 0.5); src.stop(t + o.dur + 0.03);
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- efectos ----------
  const SFX = {
    card() { noise({ f: 2600, dur: 0.07, vol: 0.22 }); tone({ f: 500, f2: 820, type: 'triangle', dur: 0.07, vol: 0.14 }); },
    draw() { noise({ type: 'bandpass', f: 1700, q: 1.2, dur: 0.05, vol: 0.1 }); },
    discard() { noise({ type: 'lowpass', f: 2400, f2: 400, dur: 0.14, vol: 0.14 }); },
    chomp() {
      noise({ type: 'lowpass', f: 1000, f2: 180, dur: 0.09, vol: 0.5 });
      tone({ f: 170, f2: 70, type: 'square', dur: 0.08, vol: 0.12 });
    },
    coin() { tone({ f: 988, type: 'square', dur: 0.07, vol: 0.09 }); tone({ f: 1319, type: 'square', dur: 0.2, vol: 0.09, t: 0.07 }); },
    coinBig() { [988, 1319, 1568, 1976].forEach((f, i) => tone({ f, type: 'square', dur: 0.14, vol: 0.085, t: i * 0.06 })); },
    work() { noise({ type: 'bandpass', f: 900, q: 3, dur: 0.05, vol: 0.2 }); tone({ f: 300, f2: 420, type: 'triangle', dur: 0.1, vol: 0.14 }); },
    match(c) {
      const base = 523.25 * Math.pow(2, Math.min(c || 1, 12) / 12);
      tone({ f: base, type: 'triangle', dur: 0.12, vol: 0.2 });
      tone({ f: base * 1.26, type: 'triangle', dur: 0.12, vol: 0.2, t: 0.055 });
      tone({ f: base * 1.5, type: 'triangle', dur: 0.2, vol: 0.2, t: 0.11 });
    },
    miss() { tone({ f: 233, f2: 110, type: 'sawtooth', dur: 0.3, vol: 0.16 }); tone({ f: 220, f2: 98, type: 'sawtooth', dur: 0.3, vol: 0.16 }); },
    error() { tone({ f: 150, type: 'square', dur: 0.07, vol: 0.14 }); tone({ f: 120, type: 'square', dur: 0.1, vol: 0.14, t: 0.09 }); },
    bang(v) {
      tone({ f: 120, f2: 42, dur: 0.13, vol: 0.4 * (v || 1) });
      noise({ type: 'lowpass', f: 500, dur: 0.05, vol: 0.2 * (v || 1) });
    },
    burp() { tone({ f: 105, f2: 58, type: 'sawtooth', dur: 0.32, vol: 0.2 }); tone({ f: 52, f2: 40, type: 'square', dur: 0.3, vol: 0.12 }); },
    roar() {
      tone({ f: 95, f2: 38, type: 'sawtooth', dur: 1.5, vol: 0.4, hold: 0.5 });
      tone({ f: 64, f2: 30, type: 'square', dur: 1.5, vol: 0.25, hold: 0.5 });
      noise({ type: 'lowpass', f: 900, f2: 120, dur: 1.5, vol: 0.5 });
      for (let i = 0; i < 6; i++) SFX_chompAt(0.5 + i * 0.13);
    },
    alarm() { tone({ f: 880, type: 'square', dur: 0.09, vol: 0.1 }); tone({ f: 660, type: 'square', dur: 0.09, vol: 0.1, t: 0.11 }); },
    frenzy() { [72, 76, 79, 84, 88, 91].forEach((m, i) => tone({ f: hz(m), type: 'square', dur: 0.16, vol: 0.11, t: i * 0.055 })); },
    banner() { tone({ f: hz(57), type: 'triangle', dur: 0.22, vol: 0.22 }); tone({ f: hz(64), type: 'triangle', dur: 0.35, vol: 0.22, t: 0.12 }); },
    dayEnd() { [69, 73, 76, 81].forEach((m, i) => tone({ f: hz(m), type: 'triangle', dur: 0.3, vol: 0.18, t: i * 0.1 })); },
    select() { tone({ f: 660, type: 'triangle', dur: 0.08, vol: 0.18 }); tone({ f: 990, type: 'triangle', dur: 0.16, vol: 0.18, t: 0.07 }); },
    hover() { tone({ f: 1250, type: 'sine', dur: 0.03, vol: 0.05 }); },
    scheme() { tone({ f: 330, f2: 990, type: 'sawtooth', dur: 0.25, vol: 0.1 }); noise({ type: 'bandpass', f: 600, f2: 4000, q: 2, dur: 0.25, vol: 0.14 }); },
    snore() { noise({ type: 'lowpass', f: 300, f2: 120, dur: 0.6, vol: 0.2 }); },
    lost() { [64, 63, 60, 57, 52].forEach((m, i) => tone({ f: hz(m), type: 'sawtooth', dur: 0.4, vol: 0.12, t: i * 0.17 })); },
    gameover() { [69, 65, 62, 57, 45].forEach((m, i) => tone({ f: hz(m), type: 'triangle', dur: 0.7, vol: 0.2, t: i * 0.32 })); },
    talk(n) {
      n = n || 4;
      for (let i = 0; i < n; i++) tone({ f: U.rand(150, 240), f2: U.rand(130, 260), type: 'square', dur: 0.06, vol: 0.085, t: i * 0.075 });
    },
  };
  function SFX_chompAt(t) {
    noise({ type: 'lowpass', f: 1000, f2: 180, dur: 0.09, vol: 0.4, t });
  }
  A.sfx = function (name, arg) {
    if (!ctx || A.muted || ctx.state !== 'running') return;
    const f = SFX[name];
    if (f) { try { f(arg); } catch (e) { /* nunca romper el juego por audio */ } }
  };

  // ---------- música: tarantela original en La menor, 6/8 ----------
  const _ = null;
  const MEL_A = [
    [69, 72, 76, 81, 76, 72], [71, 72, 74, 76, _, 76], [76, 80, 83, 80, 76, 74], [72, 71, 68, 71, _, _],
    [69, 72, 76, 81, _, 81], [81, 77, 74, 77, 76, 74], [76, 74, 72, 71, 68, 71], [69, _, 69, 69, _, _],
  ];
  const CH_A = ['Am', 'Am', 'E', 'E', 'Am', 'Dm', 'E', 'Am'];
  const MEL_B = [
    [79, 76, 72, 76, 79, 84], [83, 79, 74, 79, _, 79], [77, 74, 71, 74, 77, 81], [79, _, 76, 72, _, _],
    [81, _, 81, 80, 81, 83], [81, 77, 74, 69, 74, 77], [76, 80, 76, 74, 71, 68], [69, _, _, 81, _, _],
  ];
  const CH_B = ['C', 'G', 'G', 'C', 'Am', 'Dm', 'E', 'Am'];
  const CHORDS = {
    Am: { b: 45, n: [57, 60, 64] }, Dm: { b: 50, n: [57, 62, 65] }, E: { b: 40, n: [56, 59, 62, 64] },
    C: { b: 48, n: [55, 60, 64] }, G: { b: 43, n: [55, 59, 62] },
  };
  let nextT = 0, step = 0;

  function acc(m, at, dur, vol) {
    const f = hz(m);
    tone({ f, type: 'sawtooth', at, dur, vol: vol * 0.55, detune: -7, dest: musicGain, attack: 0.012, hold: 0.55 });
    tone({ f, type: 'sawtooth', at, dur, vol: vol * 0.55, detune: 8, dest: musicGain, attack: 0.012, hold: 0.55 });
    tone({ f: f * 2, type: 'square', at, dur: dur * 0.8, vol: vol * 0.16, dest: musicGain, attack: 0.01 });
  }
  function playStep(s, at, sd) {
    const sec = Math.floor(s / 48), isB = sec === 2;
    const bar = Math.floor((s % 48) / 6), k = s % 6;
    const mel = (isB ? MEL_B : MEL_A)[bar][k];
    const ch = CHORDS[(isB ? CH_B : CH_A)[bar]];
    const tr = A.frenzy ? 2 : 0;
    const calm = A.calm;
    if (mel !== null) acc(mel + tr, at, sd * (calm ? 1.5 : 0.92), calm ? 0.1 : 0.15);
    if (k === 0) tone({ f: hz(ch.b + tr), type: 'triangle', at, dur: sd * 2.4, vol: 0.34, dest: musicGain });
    if (k === 3) tone({ f: hz(ch.b + 7 + tr), type: 'triangle', at, dur: sd * 2.2, vol: 0.28, dest: musicGain });
    if (k === 2 || k === 5 || (!calm && (k === 1 || k === 4) && A.intensity > 0.6)) {
      for (const n of ch.n) tone({ f: hz(n + tr), type: 'square', at, dur: sd * 0.7, vol: 0.035, dest: musicGain });
    }
    if (!calm) {
      const accent = k === 0 || k === 3;
      noise({ at, f: 6500, dur: accent ? 0.07 : 0.035, vol: accent ? 0.12 : 0.05, dest: musicGain });
      if (accent && A.intensity > 0.35) tone({ f: 150, f2: 55, at, dur: 0.1, vol: 0.22, dest: musicGain });
    }
  }
  function sched() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextT < ctx.currentTime - 0.2) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.14) {
      let bpm = A.calm ? 78 : U.lerp(104, 172, U.clamp(A.intensity, 0, 1));
      if (A.frenzy) bpm = 190;
      const sd = 60 / bpm / 3;
      playStep(step, nextT, sd);
      nextT += sd;
      step = (step + 1) % 192;
    }
  }
  A.startMusic = function () {
    if (!ctx || timer) return;
    nextT = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(sched, 30);
  };
  A.setCalm = function (c) { if (A.calm !== c) { A.calm = c; } };
})();
