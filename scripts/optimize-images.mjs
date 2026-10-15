/**
 * Оптимизация фото: кладёте исходники в /photos-src с именами
 *   hero.jpg, stage.jpg, smile.jpg, party.jpg, portrait.jpg, mic.jpg
 * и запускаете `npm run images`. Скрипт сделает AVIF + WebP шириной
 * 480/800/1200 px в /public/img. Затем в src/content.ts поставьте localPhotos = true.
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { dirname, extname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'photos-src');
const out = resolve(root, 'public/img');
const WIDTHS = [480, 800, 1200];
const KEYS = new Set(['hero', 'stage', 'smile', 'party', 'portrait', 'mic']);

await mkdir(out, { recursive: true });
const files = (await readdir(src)).filter((f) => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f));
if (!files.length) {
  console.error('В папке photos-src нет фото. Положите туда hero.jpg, stage.jpg и т. д.');
  process.exit(1);
}

for (const file of files) {
  const key = basename(file, extname(file)).toLowerCase();
  if (!KEYS.has(key)) {
    console.warn(`Пропускаю ${file}: имя должно быть одним из ${[...KEYS].join(', ')}`);
    continue;
  }
  for (const w of WIDTHS) {
    // Кадрируем в 3:4 по центру внимания — так фото одинаково смотрятся в арках и галерее
    const pipeline = sharp(resolve(src, file))
      .rotate()
      .resize({ width: w, height: Math.round((w * 4) / 3), fit: 'cover', position: sharp.strategy.attention });
    await pipeline.clone().avif({ quality: 52, effort: 6 }).toFile(resolve(out, `${key}-${w}.avif`));
    await pipeline.clone().webp({ quality: 74 }).toFile(resolve(out, `${key}-${w}.webp`));
  }
  console.log(`✓ ${key}`);
}
console.log('Готово. Поставьте localPhotos = true в src/content.ts');
