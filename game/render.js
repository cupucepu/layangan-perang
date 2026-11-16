// Layangan Perang — render.js
// Semua gambar: langit senja, matahari, bintang, awan, atap rumah, pohon
// palem, anak yang memegang benang, layangan, benang, HUD, dan layar menu /
// hasil / juara. Satu file, satu tugas: menggambar. Semua teks di dalam
// game berbahasa Indonesia.

import { VIEW_W, VIEW_H, GROUND_Y, PLAYER_ANCHOR, FOE_ANCHOR } from './physics.js';
import { OPPONENTS } from './ai.js';

const FONT = '"Trebuchet MS","Segoe UI",Verdana,sans-serif';
const PI = Math.PI;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Atap-atap rumah di kejauhan, dibuat sekali (deterministik).
const ROOFTOPS = [];
for (let x = -10, i = 0; x < VIEW_W + 60; i++) {
  const w = 50 + ((i * 37) % 40);
  const h = 26 + ((i * 53) % 52);
  ROOFTOPS.push([x, w, h]);
  x += w;
}

function text(ctx, s, x, y, size, col, align, weight) {
  ctx.font = (weight || 700) + ' ' + size + 'px ' + FONT;
  ctx.fillStyle = col;
  ctx.textAlign = align || 'center';
  ctx.fillText(s, x, y);
}

function titleText(ctx, s, x, y, size, col) {
  ctx.font = '800 ' + size + 'px ' + FONT;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size / 8;
  ctx.strokeStyle = '#2a0f3d';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = col;
  ctx.fillText(s, x, y);
}

function palm(ctx, x, y, s, time) {
  ctx.strokeStyle = '#0d0618';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 14 * s, y - 90 * s, x + 4 * s, y - 170 * s);
  ctx.stroke();
  const tx = x + 4 * s;
  const ty = y - 170 * s;
  ctx.lineWidth = 3 * s;
  for (let i = 0; i < 7; i++) {
    const a = -PI / 2 + (i - 3) * 0.55 + Math.sin(time * 0.8 + i) * 0.04;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * 40 * s,
      ty + Math.sin(a) * 40 * s - 12 * s,
      tx + Math.cos(a) * 78 * s,
      ty + Math.sin(a) * 78 * s + 22 * s,
    );
    ctx.stroke();
  }
}

// Anak kecil yang memegang benang di tanah.
function kid(ctx, x, dir) {
  const y = GROUND_Y - 8;
  ctx.fillStyle = '#0d0618';
  ctx.strokeStyle = '#0d0618';
  ctx.beginPath();
  ctx.arc(x, y - 34, 7, 0, PI * 2);
  ctx.fill();
  ctx.fillRect(x - 6, y - 28, 12, 22);
  ctx.fillRect(x - 6, y - 8, 5, 12);
  ctx.fillRect(x + 1, y - 8, 5, 12);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x + dir * 10, y - 40);
  ctx.stroke();
}

function drawSky(ctx, wind, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#1d1440');
  sky.addColorStop(0.42, '#7a2e6e');
  sky.addColorStop(0.74, '#e8695c');
  sky.addColorStop(1, '#ffb866');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Bintang di langit atas.
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = 'rgba(255,240,220,' + (0.25 + 0.25 * Math.sin(time * 1.5 + i)) + ')';
    ctx.fillRect((i * 97) % VIEW_W, (i * 53) % 250, 2, 2);
  }

  // Matahari rendah di ufuk.
  const glow = ctx.createRadialGradient(900, 560, 10, 900, 560, 170);
  glow.addColorStop(0, 'rgba(255,236,170,.95)');
  glow.addColorStop(0.35, 'rgba(255,170,110,.35)');
  glow.addColorStop(1, 'rgba(255,140,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(650, 370, 500, 350);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(900, 560, 44, 0, PI * 2);
  ctx.fill();

  // Awan bergerak pelan mengikuti angin.
  ctx.fillStyle = 'rgba(255,205,200,.22)';
  for (let i = 0; i < 4; i++) {
    const cx = (((i * 300 + time * 8 + wind * 0.2) % 1560) - 150);
    const cy = 120 + i * 58;
    const parts = [
      [0, 0, 70, 16],
      [-45, 6, 48, 12],
      [50, 5, 52, 12],
    ];
    for (const e of parts) {
      ctx.beginPath();
      ctx.ellipse(cx + e[0], cy + e[1], e[2], e[3], 0, 0, PI * 2);
      ctx.fill();
    }
  }

  // Atap rumah di kejauhan.
  ctx.fillStyle = '#33193f';
  for (const f of ROOFTOPS) {
    ctx.fillRect(f[0], GROUND_Y - 8 - f[2], f[1], f[2]);
    ctx.beginPath();
    ctx.moveTo(f[0] - 4, GROUND_Y - 8 - f[2]);
    ctx.lineTo(f[0] + f[1] / 2, GROUND_Y - 8 - f[2] - 22);
    ctx.lineTo(f[0] + f[1] + 4, GROUND_Y - 8 - f[2]);
    ctx.fill();
  }

  palm(ctx, 34, GROUND_Y - 8, 1, time);
  palm(ctx, 1246, GROUND_Y - 8, 1.1, time);
  ctx.fillStyle = '#0d0618';
  ctx.fillRect(0, GROUND_Y - 8, VIEW_W, 16);
  kid(ctx, PLAYER_ANCHOR.x - 60, 1);
  kid(ctx, FOE_ANCHOR.x + 60, -1);
}

function drawKite(ctx, k, time) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.tilt + k.spin);
  // Ekor layangan.
  ctx.strokeStyle = k.color2;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 38);
  for (let i = 1; i <= 8; i++) {
    ctx.lineTo(Math.sin(time * 5 + i * 0.9 + k.phase) * 10 * (i / 8) - k.tilt * 18 * (i / 2), 38 + i * 11);
  }
  ctx.stroke();
  // Badan layangan sesuai bentuknya.
  ctx.fillStyle = k.color;
  ctx.beginPath();
  if (k.shape === 'dart') {
    ctx.moveTo(0, -48);
    ctx.lineTo(20, -2);
    ctx.lineTo(0, 34);
    ctx.lineTo(-20, -2);
  } else if (k.shape === 'wide') {
    ctx.moveTo(0, -36);
    ctx.lineTo(38, -6);
    ctx.lineTo(0, 40);
    ctx.lineTo(-38, -6);
  } else {
    ctx.moveTo(0, -42);
    ctx.lineTo(28, -4);
    ctx.lineTo(0, 38);
    ctx.lineTo(-28, -4);
  }
  ctx.closePath();
  ctx.fill();
  // Belahan warna.
  ctx.fillStyle = k.color2;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(28, -4);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 38);
  ctx.lineTo(-28, -4);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
  // Rangka.
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(0, 38);
  ctx.moveTo(-28, -4);
  ctx.lineTo(28, -4);
  ctx.stroke();
  ctx.restore();
}

function drawString(ctx, pts, col, golden) {
  ctx.strokeStyle = col;
  ctx.lineWidth = golden ? 2.4 : 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
}

function bar(ctx, x, y, w, h, value, max, col, right) {
  ctx.fillStyle = 'rgba(10,5,20,.6)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  const f = clamp(value / max, 0, 1) * w;
  if (f > 0) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(right ? x + w - f : x, y, f, h, h / 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// HUD: nyawa benang + stamina kedua pihak, ronde, skor, angin, label mode.
// ---------------------------------------------------------------------------
export function drawHUD(ctx, game, duel) {
  const p = duel.player;
  const e = duel.enemy;
  text(ctx, 'Kamu', 24, 28, 16, '#fff', 'left');
  bar(ctx, 24, 36, 300, 16, p.hp, p.maxHp, p.hp < 30 ? '#ff595e' : '#ffd166', false);
  bar(ctx, 24, 58, 300, 8, p.st, 100, p.lock ? '#8d99ae' : '#6ec6ff', false);
  text(ctx, 'Benang', 332, 50, 12, '#ffd9b0', 'left');
  text(ctx, 'Tenaga', 332, 67, 12, '#ffd9b0', 'left');

  text(ctx, duel.foe.name, VIEW_W - 24, 28, 16, '#fff', 'right');
  bar(ctx, VIEW_W - 324, 36, 300, 16, e.hp, e.maxHp, e.hp < 30 ? '#ff595e' : e.color, true);
  bar(ctx, VIEW_W - 324, 58, 300, 8, e.st, 100, e.lock ? '#8d99ae' : '#6ec6ff', true);
  text(ctx, 'Benang', VIEW_W - 332, 50, 12, '#ffd9b0', 'right');
  text(ctx, 'Tenaga', VIEW_W - 332, 67, 12, '#ffd9b0', 'right');

  text(ctx, 'Ronde ' + (game.round + 1) + '/' + OPPONENTS.length, VIEW_W / 2, 28, 16, '#fff');
  text(ctx, 'Skor ' + game.total, VIEW_W / 2, 52, 20, '#ffd166');

  if (game.state === 'play') {
    text(ctx, 'Mouse: gerak   Tahan klik: tarik   Tahan Spasi: ulur   R: ulang   P: jeda', 16, VIEW_H - 22, 13, '#c9b3dd', 'left');
  }
  // Angin.
  text(ctx, 'Angin', VIEW_W - 130, VIEW_H - 22, 14, '#ffd9b0', 'right');
  const x0 = VIEW_W - 90;
  const x1 = x0 + duel.wind.push * 0.8;
  ctx.strokeStyle = '#ffd9b0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, VIEW_H - 26);
  ctx.lineTo(x1, VIEW_H - 26);
  ctx.stroke();
  const d = duel.wind.push >= 0 ? 1 : -1;
  ctx.fillStyle = '#ffd9b0';
  ctx.beginPath();
  ctx.moveTo(x1 + d * 8, VIEW_H - 26);
  ctx.lineTo(x1, VIEW_H - 32);
  ctx.lineTo(x1, VIEW_H - 20);
  ctx.fill();

  // Label mode di atas tiap layangan.
  for (const k of [p, e]) {
    if (!k.cut && game.state === 'play') {
      const label = k.lock ? 'Lelah' : k.mode === 1 ? 'Tarik!' : k.mode === 2 ? 'Ulur' : '';
      text(ctx, label, k.x, k.y - 58, 14, k.mode === 1 ? '#ffd166' : '#fff');
    }
  }

  // Perkenalan lawan di awal ronde.
  if (game.state === 'play' && duel.intro > 0) {
    text(ctx, 'Ronde ' + (game.round + 1), VIEW_W / 2, 150, 22, '#ffd9b0');
    titleText(ctx, duel.foe.name, VIEW_W / 2, 205, 52, '#fff');
    text(ctx, duel.foe.line, VIEW_W / 2, 240, 20, '#ffe9d0');
  } else if (duel.golden.on && game.state === 'play') {
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(game.time * 14);
    titleText(ctx, 'Momen emas! Tarik sekarang!', VIEW_W / 2, 125, 32, '#ffd166');
    ctx.globalAlpha = 1;
  }

  // Toast (misalnya "Sayat emas! +150").
  duel.toasts.forEach((o, i) => {
    ctx.globalAlpha = clamp(o.life * 2, 0, 1);
    text(ctx, o.text, VIEW_W / 2, 165 + i * 28, 22, '#ffe28a');
    ctx.globalAlpha = 1;
  });
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,5,20,.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#241338';
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Layar menu.
// ---------------------------------------------------------------------------
export function drawMenu(ctx, game) {
  panel(ctx, 240, 95, 800, 420);
  titleText(ctx, 'Layangan Perang', VIEW_W / 2, 185, 62, '#ffd166');
  text(ctx, 'Aduan benang di langit senja', VIEW_W / 2, 225, 22, '#ffe9d0');
  const lines = [
    'Gerakkan mouse untuk menerbangkan layanganmu',
    'Tahan klik kiri untuk menarik benang: serangan kuat, tenaga cepat habis',
    'Tahan Spasi untuk mengulur: lebih aman, tenaga pulih lebih cepat',
    'Saat sinyal emas muncul, menarik memberi sayatan tiga kali lipat',
    'Putuskan benang lawan sebelum benangmu putus',
  ];
  lines.forEach((s, i) => text(ctx, s, VIEW_W / 2, 275 + i * 30, 17, '#f1e4ff', 'center', 500));
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(game.time * 4);
  text(ctx, 'Klik atau tekan Enter untuk mulai', VIEW_W / 2, 470, 22, '#ffd166');
  ctx.globalAlpha = 1;
  if (game.best > 0) text(ctx, 'Skor terbaik: ' + game.best, VIEW_W / 2, 497, 15, '#c9b3dd');
}

// ---------------------------------------------------------------------------
// Layar hasil satu ronde (menang atau kalah) dan layar juara.
// ---------------------------------------------------------------------------
export function drawResult(ctx, game) {
  panel(ctx, 340, 95, 600, 400);
  const res = game.result;
  if (res.win) {
    titleText(
      ctx,
      game.state === 'final' ? 'Juara layangan kampung!' : 'Benang lawan putus!',
      VIEW_W / 2,
      150,
      game.state === 'final' ? 34 : 38,
      '#ffd166',
    );
    const rows = [
      ['Dasar', res.base],
      ['Bonus waktu', res.timeBonus],
      ['Sayatan emas', res.goldBonus],
      ['Sisa benang', res.remainBonus],
      ['Beruntun x' + res.mult.toFixed(2), ''],
      ['Skor ronde', res.total],
    ];
    rows.forEach((r, i) => {
      const y = 210 + i * 30;
      text(ctx, r[0], 390, y, 18, i === 5 ? '#ffd166' : '#f1e4ff', 'left');
      if (r[1] !== '') text(ctx, String(r[1]), 890, y, 18, i === 5 ? '#ffd166' : '#f1e4ff', 'right');
    });
    text(ctx, 'Total: ' + game.total, VIEW_W / 2, 415, 26, '#fff');
    text(
      ctx,
      game.state === 'final' ? 'Klik atau Enter: main dari awal' : 'Klik atau Enter: lawan berikutnya',
      VIEW_W / 2,
      460,
      18,
      '#ffd166',
    );
  } else {
    titleText(ctx, 'Benangmu putus...', VIEW_W / 2, 160, 38, '#ff8fa3');
    text(ctx, 'Kalah dari ' + game.duel.foe.name + ' di ronde ' + (game.round + 1), VIEW_W / 2, 225, 20, '#f1e4ff');
    text(ctx, 'Skor akhir: ' + game.total, VIEW_W / 2, 285, 28, '#ffd166');
    text(ctx, 'Skor terbaik: ' + game.best, VIEW_W / 2, 325, 18, '#c9b3dd');
    text(ctx, 'Klik atau Enter: main lagi', VIEW_W / 2, 440, 18, '#ffd166');
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10,5,20,.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  titleText(ctx, 'Jeda', VIEW_W / 2, 340, 56, '#fff');
  text(ctx, 'Tekan P atau Esc untuk lanjut', VIEW_W / 2, 390, 20, '#ffe9d0');
}

// ---------------------------------------------------------------------------
// Gambar satu frame penuh.
// ---------------------------------------------------------------------------
export function drawFrame(ctx, game, duel) {
  drawSky(ctx, duel.wind.push, game.time);
  const goldenGlow = duel.golden.on && duel.cross && game.state === 'play';
  ctx.save();
  if (goldenGlow) {
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 16;
  }
  drawString(ctx, duel.curveP, goldenGlow ? '#ffe28a' : 'rgba(255,255,255,.9)', goldenGlow);
  drawString(ctx, duel.curveE, goldenGlow ? '#ffe28a' : 'rgba(255,255,255,.9)', goldenGlow);
  ctx.restore();

  if (duel.cross) {
    ctx.strokeStyle = duel.golden.on ? '#ffd166' : 'rgba(255,255,255,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(duel.cross.x, duel.cross.y, 10 + Math.sin(game.time * 20) * 3, 0, PI * 2);
    ctx.stroke();
  }

  drawKite(ctx, duel.player, game.time);
  drawKite(ctx, duel.enemy, game.time);

  for (const s of duel.sparks) {
    ctx.globalAlpha = clamp(s.life * 2, 0, 1);
    ctx.fillStyle = s.gold ? '#ffd166' : '#fff4d6';
    ctx.fillRect(s.x, s.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  if (game.state !== 'menu') drawHUD(ctx, game, duel);
  if (game.state === 'menu') drawMenu(ctx, game);
  if (game.state === 'result' || game.state === 'final') drawResult(ctx, game);
  if (game.state === 'paused') drawPaused(ctx);
}
