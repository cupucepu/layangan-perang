// Layangan Perang — audio.js
// Suara lewat Web Audio API saja, tanpa file audio.
// Semua efek dibuat dengan osilator; kalau audio tidak tersedia,
// semua panggilan diam-diam tidak melakukan apa-apa.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

// Panggil sekali dari gestur pengguna pertama (klik / tombol).
export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setMuted(m) {
  muted = m;
}

function tone(freqStart, freqEnd, duration, type, volume) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch (e) {
    // Audio gagal: game tetap jalan tanpa suara.
  }
}

// Desir pendek saat mulai menarik benang.
export function playPull() {
  tone(320, 520, 0.09, 'sine', 0.05);
}

// Denting terang saat momen emas muncul.
export function playGolden() {
  tone(880, 880, 0.12, 'triangle', 0.08);
  setTimeout(() => tone(1318, 1318, 0.16, 'triangle', 0.07), 90);
}

// Benang putus: nada turun yang tajam.
export function playSnap() {
  tone(700, 90, 0.28, 'sawtooth', 0.12);
}

// Kemenangan duel: tiga nada naik.
export function playWin() {
  tone(523, 523, 0.14, 'triangle', 0.09);
  setTimeout(() => tone(659, 659, 0.14, 'triangle', 0.09), 130);
  setTimeout(() => tone(784, 784, 0.22, 'triangle', 0.1), 260);
}

// Kekalahan: dua nada turun.
export function playLose() {
  tone(392, 392, 0.2, 'triangle', 0.09);
  setTimeout(() => tone(262, 220, 0.34, 'triangle', 0.09), 180);
}
