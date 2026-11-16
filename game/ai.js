// Layangan Perang — ai.js
// Perilaku lawan: empat karakter yang dilawan satu per satu sebagai tangga.
// Satu file, satu tugas: siapa lawanmu dan bagaimana ia memutuskan tarikan.

import { mulberry32, MODE_NEUTRAL, MODE_PULL, MODE_SLACK } from './physics.js';

// Empat lawan, dari yang paling mudah ke yang paling tajam benangnya.
export const OPPONENTS = [
  {
    id: 'gesit',
    name: 'Si Gesit',
    title: 'Si Kilat Senja',
    line: 'Cepat dan suka menyayat.',
    color: '#2ec4b6',
    color2: '#ffe66d',
    kite: 'dart',
    hp: 100,
    pow: 0.8,
    spd: 1.6,
    agg: 0.35,
    gold: 0.4,
  },
  {
    id: 'sabar',
    name: 'Pak Sabar',
    title: 'Si Batu Karang',
    line: 'Mengulur dulu, menyayat tiba-tiba.',
    color: '#8ac926',
    color2: '#ff595e',
    kite: 'wide',
    hp: 100,
    pow: 1.0,
    spd: 1.2,
    agg: 0.25,
    gold: 0.6,
  },
  {
    id: 'licik',
    name: 'Si Licik',
    title: 'Si Pemburu Emas',
    line: 'Menunggu momen emas.',
    color: '#b185db',
    color2: '#f8f32b',
    kite: 'diamond',
    hp: 110,
    pow: 1.05,
    spd: 1.9,
    agg: 0.3,
    gold: 0.95,
  },
  {
    id: 'raja',
    name: 'Raja Langit',
    title: 'Si Benang Tajam',
    line: 'Benang paling tajam di kampung.',
    color: '#ff9f1c',
    color2: '#2b2d42',
    kite: 'diamond',
    hp: 130,
    pow: 1.2,
    spd: 2.2,
    agg: 0.5,
    gold: 0.8,
  },
];

// Otak satu lawan: memutuskan mode (0 biasa, 1 tarik, 2 ulur) dan, untuk
// karakter tertentu, menimpa titik terbangnya (misalnya menerjang).
export class FoeBrain {
  constructor(foe, seed) {
    this.foe = foe;
    this.rng = mulberry32(seed + 31337);
    this._timer = 1;
    this._mode = MODE_NEUTRAL;
    this._lunge = 0; // Pak Sabar: muatan serangan mendadak
  }

  // Dipanggil tiap frame saat duel berjalan. Mengembalikan mode lawan.
  update(dt, duel) {
    this._timer -= dt;
    if (this._timer <= 0) {
      this._timer = 0.7 + this.rng() * 1.3;
      const r = this.rng();
      if (r < this.foe.agg) this._mode = MODE_PULL;
      else if (r < this.foe.agg + 0.4) this._mode = MODE_SLACK;
      else this._mode = MODE_NEUTRAL;
      // Pak Sabar menyimpan serangan, lalu menghantam sekali jadi.
      if (this.foe.id === 'sabar') {
        if (this._lunge < 1) this._lunge += 0.25;
        else {
          this._lunge = 0;
          this._mode = MODE_PULL;
        }
      }
    }
    // Si Licik hampir selalu menarik saat momen emas.
    if (duel.golden.on && duel.golden.foeTakesIt) this._mode = MODE_PULL;
    return { mode: this._mode };
  }

  // Menimpa titik terbang lawan (dipakai karakter penyerang).
  // Mengembalikan {x, y} yang akhirnya dipakai.
  targetOverride(duel, x, y) {
    // Si Gesit dan Raja Langit menerjang ke arah layangan pemain.
    if (this.foe.id === 'gesit' || this.foe.id === 'raja') {
      if (this._mode === MODE_PULL) {
        return { x: duel.player.x, y: duel.player.y - 30 };
      }
    }
    return { x, y };
  }
}
