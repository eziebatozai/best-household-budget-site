// Dompet Keluarga submission entrypoint for Node 22+ (standard library only).
// Packages app/ and screenshots/ into the output directory and generates dossier.json
// using the unchanged vendored make.fun dossier builder.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const DOSSIER_MAX_BYTES = 1572864; // 1.5 MiB gate cap for dossier.json
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
  app_path_max_bytes: 1000,
};

function copyCleanDirectory(srcDir: string, destDir: string, skipDotfiles = false): void {
  rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });
  cpSync(srcDir, destDir, {
    recursive: true,
    force: true,
    filter: skipDotfiles ? (src) => !basename(src).startsWith('.') : undefined,
  });
}

function packageEntry(): void {
  const repoRoot = dirname(fileURLToPath(import.meta.url));
  const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

  const appSource = join(repoRoot, 'app');
  const shotsSource = join(repoRoot, 'screenshots');

  if (!existsSync(join(appSource, 'index.html'))) {
    throw new Error(`Missing required site entrypoint: ${join(appSource, 'index.html')}`);
  }

  mkdirSync(outputDir, { recursive: true });
  copyCleanDirectory(appSource, join(outputDir, 'app'));

  const shotsDest = join(outputDir, 'screenshots');
  if (existsSync(shotsSource)) {
    copyCleanDirectory(shotsSource, shotsDest, true);
  } else {
    rmSync(shotsDest, { recursive: true, force: true });
    mkdirSync(shotsDest, { recursive: true });
  }

  const dossierBytes = buildDossier(outputDir, DOSSIER_LIMITS);
  if (dossierBytes.byteLength > DOSSIER_MAX_BYTES) {
    throw new Error(`dossier.json is ${dossierBytes.byteLength} bytes, exceeding ${DOSSIER_MAX_BYTES} byte limit`);
  }
  writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
}

packageEntry();
