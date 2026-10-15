import { photos, type PhotoKey } from '../content';

const TILDA_WIDTHS = [480, 800, 1200];

function tildaUrl(path: string, width: number): string {
  const [dir, file] = path.split('/');
  return `https://static.tildacdn.info/${dir}/-/resize/${width}x/${file}`;
}

export interface PhotoUrls {
  /** Запасной src для <img> */
  src: string;
  /** srcset для <img> (у фото с Тильды) */
  srcSet?: string;
  /** srcset для <source type="image/avif"> и webp (у своих фото) */
  avif?: string;
  webp?: string;
}

/** Адреса картинки во всех нужных размерах — для <picture> и для preload. */
export function photoUrls(key: PhotoKey): PhotoUrls {
  const p = photos[key];
  if (p.widths?.length) {
    const base = `${import.meta.env.BASE_URL}img/${key}`;
    const set = (ext: string) => p.widths!.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
    const mid = p.widths[Math.min(1, p.widths.length - 1)];
    return { src: `${base}-${mid}.webp`, avif: set('avif'), webp: set('webp') };
  }
  if (!p.tilda) throw new Error(`У фото «${key}» не задан источник`);
  return {
    src: tildaUrl(p.tilda, 800),
    srcSet: TILDA_WIDTHS.map((w) => `${tildaUrl(p.tilda!, w)} ${w}w`).join(', '),
  };
}
