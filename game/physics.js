// Layangan Perang — physics.js
// Layangan, benang, dan angin: semua aturan gerak dan adu benang.
// Satu file, satu tugas: fisika dan aturan duel. Tidak ada gambar di sini,
// tidak ada DOM, tidak ada jaringan. Semua aset dibuat dengan kode.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 692;

// Dua titik di tanah: tempat tiap pemain berdiri dan benang bermula.
export const PLAYER_ANCHOR = { x: 200, y: GROUND_Y };
export const FOE_ANCHOR = { x: 1080, y: GROUND_Y };

// Mode benang: 0 = biasa, 1 = tarik, 2 = ulur.
export const MODE_NEUTRAL = 0;
export const MODE_PULL = 1;
export const MODE_SLACK = 2;

// Seberapa kuat tiap mode menyayat saat benang bersilangan.
export const MODE_POWER = [1, 2.2, 0.3];
export const GOLDEN_MULT = 3; // sayatan saat momen emas

// Stamina (0..100). Menarik mengurasnya, mengulur memulihkannya.
export const STAMINA_DRAIN = 32; // per detik saat menarik
export const STAMINA_RECOVER_SLACK = 30; // per detik saat mengulur
export const STAMINA_RECOVER_IDLE = 14; // per detik saat biasa
export const STAMINA_UNLOCK_AT = 25; // lelah hilang saat stamina kembali segini

// Kerusakan dasar per detik saat benang bersilangan.
export const CLASH_DPS = 9;
export const CLASH_PULL_BONUS = 2; // lawan ikut menarik juga menyayat balik

// RNG deterministik (mulberry32) supaya ?seed= menghasilkan duel yang sama.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Angin: dorongan mendatar yang berubah seperti sinus, ditambah hembusan.
// Nilainya positif = bertiup ke kanan, negatif = ke kiri.
// ---------------------------------------------------------------------------
export class Wind {
  constructor(seed) {
    this.rng = mulberry32(seed);
    this.value = 0;
    this.time = 0;
    this.gust = 0;
  }

  get push() {
    return this.value;
  }
  get isGusting() {
    return this.gust > 0;
  }
  get speedKmh() {
    return Math.round(Math.abs(this.value) * 0.9);
  }
  get direction() {
    return this.value >= 0 ? 'TIMUR' : 'BARAT';
  }

  update(dt) {
    this.time += dt;
    // Pola dasar: dua gelombang sinus yang saling mengisi.
    const base = Math.sin(this.time * 0.35) * 45 + Math.sin(this.time * 0.9) * 20;
    let v = base;
    if (this.gust <= 0 && this.rng() < 0.12 * dt) this.gust = 1.6;
    if (this.gust > 0) {
      this.gust -= dt;
      v += (this.value >= 0 ? 40 : -40);
    }
    // Bergerak pelan menuju target supaya tidak melompat.
    this.value += (v - this.value) * Math.min(1, 2.5 * dt);
  }
}

// ---------------------------------------------------------------------------
// Layangan: posisi, nyawa benang (hp), stamina, mode, dan benangnya.
// ---------------------------------------------------------------------------
export class Kite {
  constructor(anchor, color, color2, shape, maxHp) {
    this.anchor = anchor;
    this.color = color;
    this.color2 = color2;
    this.shape = shape; // 'diamond' | 'dart' | 'wide'
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.st = 100; // stamina
    this.lock = false; // lelah: tidak bisa menarik sampai stamina pulih
    this.mode = MODE_NEUTRAL;
    this.sag = 30; // kendur benang: kecil = tegang, besar = kendur
    this.cut = false; // benang putus
    this.spin = 0; // putaran saat benang putus dan layangan jatuh
    this.tilt = 0;
    this.x = anchor.x;
    this.y = 280;
    this.vx = 0;
    this.vy = 0;
    // Titik pulang saat tidak bertarung (layangan melayang sendiri).
    this.homeX = anchor.x;
    this.homeY = 280;
    this.phase = Math.random() * 6;
  }

  // Titik tempat benang menempel pada layangan.
  get attach() {
    return this.cut ? { x: this.bx, y: this.by } : { x: this.x, y: this.y + 12 };
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.st = 100;
    this.lock = false;
    this.mode = MODE_NEUTRAL;
    this.sag = 30;
    this.cut = false;
    this.spin = 0;
    this.tilt = 0;
    this.homeX = x;
    this.homeY = y;
  }

  // Stamina: menarik menguras, mengulur dan diam memulihkan.
  updateStamina(dt) {
    if (this.lock && this.st >= STAMINA_UNLOCK_AT) this.lock = false;
    if (this.lock && this.mode === MODE_PULL) this.mode = MODE_NEUTRAL;
    if (this.mode === MODE_PULL) {
      this.st -= STAMINA_DRAIN * dt;
      if (this.st <= 0) {
        this.st = 0;
        this.lock = true;
        this.mode = MODE_NEUTRAL;
      }
    } else {
      this.st = Math.min(
        100,
        this.st + (this.mode === MODE_SLACK ? STAMINA_RECOVER_SLACK : STAMINA_RECOVER_IDLE) * dt,
      );
    }
  }

  // Terbang mengikuti target dengan kelancaran (lerp), ditambah dorongan angin.
  follow(dt, target, rate, wind, time) {
    const f = Math.min(1, rate * dt);
    const ox = this.x;
    this.x += (target.x - this.x) * f;
    this.y += (target.y - this.y) * f;
    // Angin menggeser layangan sedikit.
    this.x += wind.push * 0.12 * dt;
    const bank = Math.max(-0.55, Math.min(0.55, (this.x - ox) / Math.max(dt, 0.001) / 420));
    this.tilt += (bank + Math.sin(time * 2 + this.phase) * 0.07 - this.tilt) * Math.min(1, 6 * dt);
    // Kendur benang menyesuaikan mode.
    const wantSag = this.mode === MODE_SLACK ? 72 : this.mode === MODE_PULL ? 6 : 28;
    this.sag += (wantSag - this.sag) * Math.min(1, 6 * dt);
  }

  // Benang putus: layangan jatuh sambil berputar.
  fall(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 14 * dt;
    this.spin += 3 * dt;
    this.sag += (170 - this.sag) * Math.min(1, 3 * dt);
  }
}

// Benang sebagai kurva Bezier kuadrat dari tangan ke layangan.
// Mengembalikan titik-titik sepanjang kurva (untuk digambar dan dicek silang).
export function sampleString(anchor, attach, sag, wind) {
  const pts = [];
  const cx = (anchor.x + attach.x) / 2 + wind * 0.6;
  const cy = (anchor.y + attach.y) / 2 + sag;
  for (let i = 0; i <= 22; i++) {
    const u = i / 22;
    const a = (1 - u) * (1 - u);
    const b = 2 * u * (1 - u);
    const c = u * u;
    pts.push([a * anchor.x + b * cx + c * attach.x, a * anchor.y + b * cy + c * attach.y]);
  }
  return pts;
}

// Titik potong dua polyline (benang yang sudah disampel), atau null.
export function stringCross(a, b) {
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      const p = a[i];
      const q = a[i + 1];
      const r = b[j];
      const s = b[j + 1];
      const d1x = q[0] - p[0];
      const d1y = q[1] - p[1];
      const d2x = s[0] - r[0];
      const d2y = s[1] - r[1];
      const den = d1x * d2y - d1y * d2x;
      if (!den) continue;
      const u = ((r[0] - p[0]) * d2y - (r[1] - p[1]) * d2x) / den;
      const v = ((r[0] - p[0]) * d1y - (r[1] - p[1]) * d1x) / den;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        return { x: p[0] + u * d1x, y: p[1] + u * d1y };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Duel: satu pertarungan melawan satu lawan.
// foe: data lawan (dari ai.js). brain: FoeBrain lawan itu.
// ---------------------------------------------------------------------------
export class Duel {
  constructor(index, seed, foe, brain) {
    this.index = index;
    this.foe = foe;
    this.brain = brain;
    this.rng = mulberry32(seed + index * 7919);
    this.wind = new Wind(seed + index * 104729);
    this.time = 0;
    this.roundTime = 0;
    this.player = new Kite(PLAYER_ANCHOR, '#e63946', '#ffd166', 'diamond', 100);
    this.enemy = new Kite(FOE_ANCHOR, foe.color, foe.color2, foe.kite, foe.hp);
    this.player.reset(380, 280);
    this.enemy.reset(900, 260);
    this.cross = null; // titik silang dua benang
    this.golden = { on: false, next: 5, left: 0, hit: false, foeTakesIt: false };
    this.sparks = [];
    this.toasts = [];
    this.goldenSlashes = 0; // jumlah sayatan emas yang berhasil
    this.intro = 2.2; // jeda perkenalan lawan di awal ronde
    this.result = null; // 'win' | 'lose'
    this.score = null; // rincian skor, diisi saat duel selesai
  }

  toast(text) {
    this.toasts.push({ text, life: 1.3 });
  }

  // Momen emas muncul berkala. Lawan yang licik ikut memanfaatkannya.
  updateGolden(dt) {
    const g = this.golden;
    if (!g.on) {
      g.next -= dt;
      if (g.next <= 0) {
        g.on = true;
        g.left = 1.6;
        g.hit = false;
        g.foeTakesIt = this.rng() < this.foe.gold;
      }
    } else {
      g.left -= dt;
      if (g.left <= 0) {
        g.on = false;
        g.next = 4.5 + this.rng() * 3;
      }
    }
  }

  // Benang putus: yang kalah jatuh, yang menang bertahan.
  cutString(loser, winner, windPush) {
    loser.cut = true;
    loser.hp = 0;
    loser.bx = this.cross ? this.cross.x : loser.x;
    loser.by = this.cross ? this.cross.y : loser.y;
    loser.vx = windPush * 3 + 20 + this.rng() * 60;
    loser.vy = -70;
    winner.homeX = winner.x;
    winner.homeY = winner.y;
  }

  // Rincian skor ronde (dipakai layar hasil).
  computeScore(streak) {
    const base = 1000 + this.index * 250;
    const timeBonus = Math.max(0, Math.round(60 - this.roundTime)) * 10;
    const goldBonus = this.goldenSlashes * 150;
    const remainBonus = Math.round(this.player.hp) * 5;
    const mult = 1 + 0.25 * streak;
    const total = Math.round((base + timeBonus + goldBonus + remainBonus) * mult);
    return { base, timeBonus, goldBonus, remainBonus, mult, total };
  }

  update(dt, input, playing) {
    this.time += dt;
    this.wind.update(dt);

    if (playing) {
      this.player.mode = input.spaceHeld ? MODE_SLACK : input.mouseHeld ? MODE_PULL : MODE_NEUTRAL;
      const decision = this.brain.update(dt, this);
      this.enemy.mode = decision.mode;
      if (this.golden.on && this.golden.foeTakesIt) this.enemy.mode = MODE_PULL;
      if (this.enemy.st < 15 && !this.golden.on && this.enemy.mode === MODE_PULL) {
        this.enemy.mode = MODE_SLACK;
      }
    } else {
      this.player.mode = MODE_NEUTRAL;
      this.enemy.mode = MODE_NEUTRAL;
    }

    this.player.updateStamina(dt);
    this.enemy.updateStamina(dt);

    if (!this.player.cut) {
      const tx = playing
        ? Math.max(40, Math.min(1240, input.mouseX + this.wind.push * 0.4))
        : this.player.homeX + Math.sin(this.time * 0.8 + this.player.phase) * 30;
      const ty = playing
        ? Math.max(90, Math.min(450, input.mouseY))
        : this.player.homeY + Math.cos(this.time * 0.7 + this.player.phase) * 20;
      this.player.follow(dt, { x: tx, y: ty }, playing ? 5 : 2, this.wind, this.time);
    } else {
      this.player.fall(dt);
    }

    if (!this.enemy.cut) {
      let tx;
      let ty;
      if (playing) {
        tx = Math.max(40, Math.min(1240, this.player.x - 70 + Math.sin(this.time * 1.3) * 70 + this.wind.push * 0.3));
        ty = Math.max(90, Math.min(450, this.player.y - 35 + Math.cos(this.time * 0.9) * 55));
        // Otak lawan boleh menimpa targetnya (misalnya menerjang).
        const override = this.brain.targetOverride(this, tx, ty);
        tx = override.x;
        ty = override.y;
      } else {
        tx = this.enemy.homeX + Math.sin(this.time * 0.8 + this.enemy.phase) * 30;
        ty = this.enemy.homeY + Math.cos(this.time * 0.7 + this.enemy.phase) * 20;
      }
      this.enemy.follow(dt, { x: tx, y: ty }, playing ? this.foe.spd : 2, this.wind, this.time);
    } else {
      this.enemy.fall(dt);
    }

    const curveP = sampleString(PLAYER_ANCHOR, this.player.attach, this.player.sag, this.wind.push);
    const curveE = sampleString(FOE_ANCHOR, this.enemy.attach, this.enemy.sag, this.wind.push);

    // Kedua layangan tidak boleh menumpuk di satu titik: dorong saling menjauh
    // supaya duel selalu terbaca (dua layangan, bukan satu).
    const kdx = this.enemy.x - this.player.x;
    const kdy = this.enemy.y - this.player.y;
    const kdist = Math.hypot(kdx, kdy);
    const minDist = 70;
    if (kdist > 0.01 && kdist < minDist) {
      const push = (minDist - kdist) / 2;
      const nx = kdx / kdist;
      const ny = kdy / kdist;
      this.player.x -= nx * push;
      this.player.y -= ny * push;
      this.enemy.x += nx * push;
      this.enemy.y += ny * push;
    }

    this.cross = this.player.cut || this.enemy.cut ? null : stringCross(curveP, curveE);
    this.curveP = curveP;
    this.curveE = curveE;

    if (this.intro > 0 && playing) this.intro -= dt;
    const live = playing && this.intro <= 0;

    if (live) {
      this.roundTime += dt;
      this.updateGolden(dt);

      if (this.cross) {
        const goldP = this.golden.on && this.player.mode === MODE_PULL ? GOLDEN_MULT : 1;
        const goldE = this.golden.on && this.enemy.mode === MODE_PULL ? GOLDEN_MULT : 1;
        this.enemy.hp -=
          (CLASH_DPS * MODE_POWER[this.player.mode] * (this.enemy.mode === MODE_SLACK ? 0.5 : 1) * goldP +
            (this.enemy.mode === MODE_PULL ? CLASH_PULL_BONUS : 0)) *
          dt;
        this.player.hp -=
          (CLASH_DPS * MODE_POWER[this.enemy.mode] * (this.player.mode === MODE_SLACK ? 0.5 : 1) * goldE * this.foe.pow +
            (this.player.mode === MODE_PULL ? CLASH_PULL_BONUS : 0)) *
          dt;

        if (goldP > 1 && !this.golden.hit) {
          this.golden.hit = true;
          this.goldenSlashes += 1;
          this.toast('Sayat emas! +150');
        }
        for (let i = 0; i < 2; i++) {
          this.sparks.push({
            x: this.cross.x,
            y: this.cross.y,
            vx: (this.rng() - 0.5) * 260,
            vy: -this.rng() * 200,
            life: 0.5,
            gold: this.golden.on,
          });
        }

        if (this.player.hp <= 0 || this.enemy.hp <= 0) {
          const loser =
            this.player.hp <= 0 && this.enemy.hp <= 0
              ? this.player.hp < this.enemy.hp
                ? this.player
                : this.enemy
              : this.player.hp <= 0
                ? this.player
                : this.enemy;
          const winner = loser === this.player ? this.enemy : this.player;
          this.cutString(loser, winner, this.wind.push);
          this.result = loser === this.enemy ? 'win' : 'lose';
        }
      }
    }

    for (const s of this.sparks) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 500 * dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    for (const o of this.toasts) o.life -= dt;
    this.toasts = this.toasts.filter((o) => o.life > 0);
  }
}
