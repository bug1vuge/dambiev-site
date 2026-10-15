import { useEffect, useRef, useState } from 'react';
import { localPhotos, photos, type PhotoKey } from '../content';

const WIDTHS = [480, 800, 1200] as const;

function tildaUrl(path: string, width: number): string {
  const [dir, file] = path.split('/');
  return `https://static.tildacdn.info/${dir}/-/resize/${width}x/${file}`;
}

function srcSet(key: PhotoKey, format: 'avif' | 'webp' | 'remote'): string {
  return WIDTHS.map((w) =>
    format === 'remote' ? `${tildaUrl(photos[key].tilda, w)} ${w}w` : `${import.meta.env.BASE_URL}img/${key}-${w}.${format} ${w}w`,
  ).join(', ');
}

interface PhotoProps {
  photo: PhotoKey;
  /** Атрибут sizes — подсказка браузеру, какой ширины картинка на экране. */
  sizes: string;
  className?: string;
  /** Первый экран: грузим сразу и с высоким приоритетом. */
  priority?: boolean;
  /** Переопределить alt (например, пустой для декоративных копий). */
  alt?: string;
}

/**
 * Адаптивная картинка: srcset, ленивая загрузка, фиксированные пропорции
 * (без скачков вёрстки) и аккуратная заглушка, если фото не загрузилось.
 */
export function Photo({ photo, sizes, className, priority = false, alt }: PhotoProps) {
  const data = photos[photo];
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // После гидратации проверяем картинки, которые успели загрузиться/упасть до React.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth === 0) setFailed(true);
    else setLoaded(true);
  }, []);

  const width = 800;
  const height = Math.round(width / data.ratio);
  const cls = ['photo', loaded ? 'is-loaded' : '', failed ? 'is-failed' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} style={{ aspectRatio: String(data.ratio) }}>
      {failed ? (
        alt === '' ? (
          <span className="photo__fallback" aria-hidden="true">
            ЛД
          </span>
        ) : (
          <span className="photo__fallback" role="img" aria-label={alt ?? data.alt}>
            <span aria-hidden="true">ЛД</span>
          </span>
        )
      ) : (
        <picture>
          {localPhotos && <source type="image/avif" srcSet={srcSet(photo, 'avif')} sizes={sizes} />}
          {localPhotos && <source type="image/webp" srcSet={srcSet(photo, 'webp')} sizes={sizes} />}
          <img
            ref={imgRef}
            src={localPhotos ? `${import.meta.env.BASE_URL}img/${photo}-800.webp` : tildaUrl(data.tilda, 800)}
            srcSet={localPhotos ? undefined : srcSet(photo, 'remote')}
            sizes={localPhotos ? undefined : sizes}
            alt={alt ?? data.alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </span>
  );
}
