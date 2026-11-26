// Entrypoint pengemasan Dompet Keluarga untuk Node 22+ (hanya pustaka standar Node).
// Menyalin direktori app/ dan screenshots/ ke MAKEFUN_OUTPUT_DIR lalu menulis dossier.json.

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const DOSSIER_BYTE_CAP = 1572864; // Batas maksimum gate untuk dossier.json (1,5 MiB)
const SHOT_NAME_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}\.(?:png|jpe?g)$/i;
const MIN_SCREENSHOTS = 3;

const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
  app_path_max_bytes: 1000,
};

function validateScreenshotsDir(shotsDir: string): string[] {
  if (!existsSync(shotsDir)) {
    throw new Error('Direktori screenshots/ tidak ditemukan.');
  }
  const names = readdirSync(shotsDir)
    .filter((name) => !name.startsWith('.'))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  if (names.length < MIN_SCREENSHOTS || names.length > GATE_CAPS.screenshots.max) {
    throw new Error(
      `Jumlah tangkapan layar harus antara ${MIN_SCREENSHOTS} dan ${GATE_CAPS.screenshots.max} berkas (ditemukan ${names.length}).`,
    );
  }

  for (const name of names) {
    if (!SHOT_NAME_PATTERN.test(name)) {
      throw new Error(`Nama tangkapan layar tidak sesuai aturan gate: ${name}`);
    }
    const stat = lstatSync(join(shotsDir, name));
    if (!stat.isFile()) {
      throw new Error(`Tangkapan layar harus berupa berkas reguler: ${name}`);
    }
    if (stat.size > GATE_CAPS.screenshots.max_bytes) {
      throw new Error(
        `Ukuran ${name} (${stat.size} byte) melebihi batas ${GATE_CAPS.screenshots.max_bytes} byte.`,
      );
    }
  }
  return names;
}

function mirrorFolder(sourcePath: string, targetPath: string, ignoreHidden: boolean): void {
  rmSync(targetPath, { recursive: true, force: true });
  mkdirSync(targetPath, { recursive: true });
  cpSync(sourcePath, targetPath, {
    recursive: true,
    force: true,
    filter: ignoreHidden ? (entry) => !basename(entry).startsWith('.') : undefined,
  });
}

function buildSubmission(): void {
  const projectDir = dirname(fileURLToPath(import.meta.url));
  const outRoot = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
  const appDir = join(projectDir, 'app');
  const shotsDir = join(projectDir, 'screenshots');

  if (!existsSync(join(appDir, 'index.html'))) {
    throw new Error('Berkas wajib app/index.html tidak ditemukan.');
  }

  validateScreenshotsDir(shotsDir);

  mkdirSync(outRoot, { recursive: true });
  mirrorFolder(appDir, join(outRoot, 'app'), false);
  mirrorFolder(shotsDir, join(outRoot, 'screenshots'), true);

  const dossier = buildDossier(outRoot, GATE_CAPS);
  if (dossier.byteLength > DOSSIER_BYTE_CAP) {
    throw new Error(
      `Ukuran dossier.json (${dossier.byteLength} byte) melebihi batas ${DOSSIER_BYTE_CAP} byte.`,
    );
  }
  writeFileSync(join(outRoot, 'dossier.json'), dossier);
}

buildSubmission();
