// Layangan Perang — main.ts
// Program penyerahan (Node 22, pustaka standar saja).
// Menyalin game/ dan screenshots/ dari repo ini ke direktori keluaran,
// lalu menulis dossier.json lewat pustaka make.fun yang divendor.
//
// Di luar wadah penilai, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Folder repo ini (tempat main.ts berada) dan folder keluaran.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Batas yang dipakai penilai (lihat RULES.txt): hanya text_max_bytes yang
// membentuk isi dossier; sisanya menolak entri yang penilai akan tolak
// (lebih dari 4 screenshot atau satu di atas 256 KiB; game/ di atas 993
// berkas atau 48 MiB, atau ada path di bawah game/ yang lebih dari 1000 byte).
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('Layangan Perang diserahkan: game/ + screenshots/ + dossier.json (' + dossier.length + ' byte).');
