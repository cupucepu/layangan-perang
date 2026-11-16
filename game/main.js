// Layangan Perang — main.js
// Lingkaran game dan mesin state: menu -> lawan -> duel -> hasil -> juara.
// Satu file, satu tugas: menjalankan game. Semua teks berbahasa Indonesia.

import { OPPONENTS, FoeBrain } from './ai.js';
import { Duel } from './physics.js';
import { Input } from './input.js';
import { drawFrame } from './render.js';
import { unlockAudio, playPull, playGolden, playSnap, playWin, playLose } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 1) || 1;

const game = {
  state: 'menu', // menu | play | ending | result | final | paused
  round: 0,
  total: 0,
  streak: 0,
  best: 0,
  time: 0,
  result: null,
  duel: null,
  endTimer: 0,
  prevState: 'play',
};

let pullSoundAt = 0;
let goldenSoundAt = 0;

function newDuel() {
  const foe = OPPONENTS[game.round];
  const brain = new FoeBrain(foe, seed);
  game.duel = new Duel(game.round, seed, foe, brain);
  game.state = 'play';
  game.endTimer = 0;
}

function restartTournament() {
  game.round = 0;
  game.total = 0;
  game.streak = 0;
  newDuel();
}

// Selesai satu duel: hitung skor, tentukan layar berikutnya.
function finishDuel() {
  const duel = game.duel;
  if (duel.result === 'win') {
    const score = duel.computeScore(game.streak);
    game.total += score.total;
    game.best = Math.max(game.best, game.total);
    game.result = { win: true, ...score };
    game.streak += 1;
    game.state = game.round >= OPPONENTS.length - 1 ? 'final' : 'result';
    playWin();
  } else {
    game.result = { win: false };
    game.streak = 0;
    game.state = 'result';
    playLose();
  }
  game.endTimer = 0;
}

function proceed() {
  unlockAudio();
  if (game.state === 'menu') {
    restartTournament();
  } else if (game.state === 'result' && game.endTimer > 0.6) {
    if (game.result.win) {
      game.round += 1;
      newDuel();
    } else {
      restartTournament();
    }
  } else if (game.state === 'final' && game.endTimer > 0.6) {
    restartTournament();
  }
}

function togglePause() {
  if (game.state === 'play') {
    game.prevState = 'play';
    game.state = 'paused';
  } else if (game.state === 'paused') {
    game.state = game.prevState;
  }
}

// ---------------------------------------------------------------------------
// Mode screenshot (?shot=): atur game ke satu keadaan tetap untuk difoto.
// menu = layar judul, play = duel berjalan, golden = momen emas aktif,
// end = layar juara. Dipakai shots.json; bukan jalan pintas bermain.
// ---------------------------------------------------------------------------
function applyShot() {
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'menu') {
    game.state = 'menu';
    game.duel = new Duel(0, seed, OPPONENTS[0], new FoeBrain(OPPONENTS[0], seed));
  } else if (shot === 'play') {
    game.round = 0;
    game.total = 0;
    game.streak = 0;
    newDuel();
    // Atur duel ke tengah pertarungan: benang bersilangan, tegangan sedang.
    // Mouse diarahkan ke layangan pemain supaya ia tetap di tempat, dan
    // tombol ditahan supaya label "Tarik!" terlihat.
    const d = game.duel;
    d.intro = 0;
    input.mouseX = 460;
    input.mouseY = 300;
    input.mouseHeld = true;
    d.player.x = 460;
    d.player.y = 300;
    d.enemy.x = 880;
    d.enemy.y = 280;
    d.player.hp = 72;
    d.enemy.hp = 64;
    d.player.mode = 1;
    d.enemy.mode = 1;
  } else if (shot === 'golden') {
    game.round = 2;
    game.total = 2450;
    game.streak = 2;
    newDuel();
    const d = game.duel;
    d.intro = 0;
    input.mouseX = 460;
    input.mouseY = 300;
    input.mouseHeld = true;
    d.player.x = 460;
    d.player.y = 300;
    d.enemy.x = 880;
    d.enemy.y = 280;
    d.player.hp = 68;
    d.enemy.hp = 55;
    d.player.mode = 1;
    d.enemy.mode = 1;
    // Nyalakan momen emas dan silangkan benang. Durasinya dipanjangkan
    // supaya spanduk emas masih menyala saat tangkapan layar diambil.
    d.golden.on = true;
    d.golden.left = 30;
    d.golden.next = 8;
    d.update(0.01, { mouseX: 460, mouseY: 300, mouseHeld: true, spaceHeld: false });
    d.golden.on = true;
    d.golden.left = 30;
  } else if (shot === 'end') {
    game.round = OPPONENTS.length - 1;
    game.total = 8450;
    game.streak = 3;
    game.best = 8450;
    game.result = { win: true, base: 1750, timeBonus: 320, goldBonus: 300, remainBonus: 340, mult: 1.75, total: 4742 };
    game.state = 'final';
    game.duel = new Duel(OPPONENTS.length - 1, seed, OPPONENTS[OPPONENTS.length - 1], new FoeBrain(OPPONENTS[OPPONENTS.length - 1], seed));
    game.duel.player.hp = 68;
    game.duel.enemy.hp = 0;
    game.duel.enemy.cut = true;
  }
}

// ---------------------------------------------------------------------------
// Input.
// ---------------------------------------------------------------------------
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  input.mouseX = ((e.clientX - r.left) / r.width) * 1280;
  input.mouseY = ((e.clientY - r.top) / r.height) * 720;
});
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  input.mouseX = ((e.clientX - r.left) / r.width) * 1280;
  input.mouseY = ((e.clientY - r.top) / r.height) * 720;
  unlockAudio();
  if (game.state === 'play') {
    input.mouseHeld = true;
  } else {
    proceed();
  }
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) {
    // Bukan masalah: tangkapan pointer hanya kenyamanan.
  }
});
window.addEventListener('pointerup', () => {
  input.mouseHeld = false;
});
window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (e.code === 'Space') {
    e.preventDefault();
  } else if (e.code === 'Enter') {
    proceed();
  } else if (e.code === 'KeyR' && game.state !== 'menu') {
    restartTournament();
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    togglePause();
  } else if (e.code === 'KeyM') {
    // Mute tidak diikat ke tombol lain; diam saja.
  }
});
window.addEventListener('blur', () => {
  input.mouseHeld = false;
});

// ---------------------------------------------------------------------------
// Lingkaran utama.
// ---------------------------------------------------------------------------
function update(dt) {
  game.time += dt;
  const duel = game.duel;
  if (!duel) return;

  if (game.state === 'play') {
    const wasGolden = duel.golden.on;
    duel.update(dt, input, true);
    if (input.mouseHeld && game.time - pullSoundAt > 0.25) {
      pullSoundAt = game.time;
      playPull();
    }
    if (duel.golden.on && !wasGolden && game.time - goldenSoundAt > 1) {
      goldenSoundAt = game.time;
      playGolden();
    }
    if (duel.result) {
      game.state = 'ending';
      game.endTimer = 0;
      playSnap();
    }
  } else if (game.state === 'ending') {
    // Layangan yang kalah jatuh dulu sebelum layar hasil muncul.
    duel.update(dt, input, false);
    game.endTimer += dt;
    if (game.endTimer > 1.8) finishDuel();
  } else if (game.state === 'result' || game.state === 'final') {
    duel.update(dt, input, false);
    game.endTimer += dt;
  } else if (game.state === 'menu') {
    duel.update(dt, input, false);
  }
  // 'paused': duel tidak diperbarui.
}

let last = 0;
function loop(ts) {
  const dt = Math.max(0.001, Math.min(0.05, (ts - last) / 1000));
  last = ts;
  update(dt);
  if (game.duel) drawFrame(ctx, game, game.duel);
  input.endFrame();
  requestAnimationFrame(loop);
}

// Mulai: satu duel latar untuk layar menu, lalu terapkan ?shot= bila ada.
game.duel = new Duel(0, seed, OPPONENTS[0], new FoeBrain(OPPONENTS[0], seed));
applyShot();
// Pegangan untuk pengujian otomatis saja (tidak dipakai game-nya sendiri).
window.__layangan = game;
requestAnimationFrame(loop);
