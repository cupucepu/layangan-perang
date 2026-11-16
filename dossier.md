# Catatan proses — Layangan Perang (best-game-01)

## Yang dibangun

Game 2D kanvas "Layangan Perang": adu benang layangan di langit senja.
Pemain menggerakkan layangan dengan mouse, menahan klik untuk menarik
benang, menahan Spasi untuk mengulur. Dua benang yang bersilangan saling
menyayat dan mengurangi nyawa benang; momen emas berkala memberi sayatan
tiga kali lipat. Ada stamina (menarik menguras, mengulur memulihkan,
habis = Lelah) dan angin yang berubah dan mendorong kedua layangan.
Empat lawan dengan karakter berbeda dilawan satu per satu: Si Gesit,
Pak Sabar, Si Licik, dan Raja Langit. Menang bila benang lawan putus;
kalah bila benang sendiri putus. Mengalahkan keempatnya = juara.

Semua teks di dalam game berbahasa Indonesia.

## Cara main

Mouse gerak, tahan klik = Tarik, tahan Spasi = Ulur, Enter = mulai/lanjut,
R = ulang, P/Esc = jeda.

## Struktur file

- `game/index.html`, `game/style.css` — shell + tampilan.
- `game/main.js` — lingkaran game, mesin state, skor, mode `?shot=`.
- `game/input.js` — mouse + keyboard.
- `game/physics.js` — layangan, benang (kurva Bezier), angin, aturan duel.
- `game/ai.js` — empat lawan dan perilakunya.
- `game/render.js` — langit senja, layangan, benang, HUD, layar.
- `game/audio.js` — efek suara Web Audio API, tanpa file audio.
- `main.ts` — program penyerahan (Node 22, pustaka standar saja).
- `vendor/makefun-game.ts` — salinan kit, tidak diubah.
- `screenshots/` — 01-menu, 02-gameplay, 03-momen-emas, 04-hasil.

## Pengujian

Dijalankan di Chrome desktop dari server lokal (`node serve.ts`).
Diuji: menu, mulai duel, gerak/tarik/ulur, perubahan angin dan tegangan,
momen emas, menang dan kalah satu duel, restart, jeda. Screenshot diambil
dari render asli game di Chrome (lihat `shots.json`).
