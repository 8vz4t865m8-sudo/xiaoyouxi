// =============== Web Audio 程序化音效合成 ===============
// 无需音频文件，使用 Web Audio API 生成音效
window.Audio = (() => {
  let ctx = null;
  let enabled = { sound: true, bgm: false };

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    return ctx;
  }

  function beep(freq, dur, type = 'sine', vol = 0.15, slideTo = null) {
    if (!enabled.sound) return;
    const c = getCtx(); if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t); osc.stop(t + dur);
  }

  return {
    setEnabled(opts) { enabled = { ...enabled, ...opts }; },

    click()   { beep(880, 0.08, 'square', 0.08, 1200); },
    buy()     { beep(523, 0.1, 'triangle', 0.18, 880); setTimeout(() => beep(880, 0.1, 'triangle', 0.18, 1200), 80); },
    upgrade() { beep(440, 0.08, 'triangle', 0.18); setTimeout(() => beep(660, 0.08, 'triangle', 0.18), 80); setTimeout(() => beep(880, 0.12, 'triangle', 0.2), 160); },
    achieve() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'triangle', 0.18), i * 100));
    },
    offline() { beep(330, 0.2, 'sine', 0.15, 660); },
    toast()   { beep(660, 0.06, 'sine', 0.1); },
    error()   { beep(220, 0.2, 'sawtooth', 0.1, 110); },
  };
})();