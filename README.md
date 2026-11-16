[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![Peringkat](https://make.fun/badge/best-game-01/cupucepu/layangan-perang/rank.svg)](https://make.fun/bounty/best-game-01)
[![Hadiah](https://make.fun/badge/best-game-01/cupucepu/layangan-perang/reward.svg)](https://make.fun/bounty/best-game-01)

# Layangan Perang

Aduan benang layangan di langit senja. Kamu menerbangkan layangan di atas
kampung saat matahari terbenam, melawan empat pemain lain satu per satu.
Benang yang putus lebih dulu kalah.

Masuk ke [make.fun — Make the best game](https://make.fun/bounty/best-game-01).

## Cara main

- **Mouse** — gerakkan layanganmu.
- **Tahan klik kiri (Tarik)** — menarik benang: serangan kuat, tapi tenaga
  cepat habis. Saat dua benang bersilangan, tarikanmu menyayat benang lawan.
- **Tahan Spasi (Ulur)** — mengulur benang: lebih aman, tenaga pulih lebih
  cepat, dan sayatan lawan berkurang setengah.
- **Momen emas** — sesekali muncul sinyal emas. Menarik saat momen emas
  memberi sayatan **tiga kali lipat** dan bonus skor.
- **Tenaga (stamina)** — menarik menguras tenaga. Kalau tenaga habis,
  layanganmu **Lelah** dan tidak bisa menarik sampai tenaganya pulih.
- **Angin** — berubah-ubah dan mendorong kedua layangan. Perhatikan panah
  angin di HUD.
- **Enter** — mulai / lanjut. **R** — ulang dari awal. **P** atau **Esc** — jeda.

## Aturan menang

Satu duel berakhir saat sebuah benang putus. Kalau **benang lawan putus**,
kamu menang dan maju ke lawan berikutnya. Kalau **benangmu putus** lebih
dulu, kamu kalah dan turnamen diulang dari awal. Kalahkan keempat lawan —
Si Gesit, Pak Sabar, Si Licik, dan Raja Langit — untuk menjadi
**Juara layangan kampung**.

Skor satu ronde = dasar + bonus waktu + sayatan emas + sisa benang,
dikalikan beruntun kemenanganmu.

## Lawan

| Lawan | Karakter |
| --- | --- |
| **Si Gesit** | Cepat dan suka menyayat. |
| **Pak Sabar** | Mengulur dulu, menyayat tiba-tiba. |
| **Si Licik** | Menunggu momen emas. |
| **Raja Langit** | Benang paling tajam di kampung. |

## Menjalankan

Game ini file statis tanpa request jaringan. Jalankan server lokal lalu buka
di Chrome desktop:

```sh
node serve.ts
# buka http://localhost:8080
```

Untuk mengambil screenshot keadaan tertentu (dipakai `shots.json`):

```sh
# ?shot=menu | play | golden | end, dengan ?seed= untuk hasil yang sama
http://localhost:8080/?shot=play&seed=1
```

## Struktur

- `game/index.html` — titik masuk, kanvas.
- `game/style.css` — tampilan halaman.
- `game/main.js` — lingkaran game dan mesin state.
- `game/input.js` — mouse + keyboard.
- `game/physics.js` — layangan, benang, angin, aturan duel.
- `game/ai.js` — empat lawan dan perilakunya.
- `game/render.js` — langit senja, layangan, benang, HUD, layar.
- `game/audio.js` — suara lewat Web Audio API, tanpa file audio.
- `main.ts` — program penyerahan (menyalin game + screenshot, menulis dossier).
- `screenshots/` — 4 tangkapan layar asli dari game yang berjalan.

---

## English summary

**Layangan Perang (Kite War)** — a 2D canvas kite-fighting game set in a
dusk sky over an Indonesian village. Move your kite with the mouse, hold
left-click to pull the string (a strong attack that drains stamina), hold
Space to slacken it (safer, stamina recovers). When the two strings cross,
they slash each other's string HP; pulling during a periodic golden moment
deals triple damage and bonus score. Wind shifts constantly and pushes both
kites. Win a duel by breaking the opponent's string before yours breaks.
Beat all four opponents — Si Gesit, Pak Sabar, Si Licik, and Raja Langit —
to become the village kite champion. Fully offline static files, no network
requests; all art is drawn in code and all sound is Web Audio.
