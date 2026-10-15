import type { CSSProperties } from 'react';
import type { PhotoKey } from '../content';
import { Photo } from './Photo';
import './Gallery.css';

const ROW_A: PhotoKey[] = ['stage', 'party', 'smile', 'stage', 'party', 'smile'];
const ROW_B: PhotoKey[] = ['mic', 'portrait', 'hero', 'mic', 'portrait', 'hero'];

function Row({ items, speed }: { items: PhotoKey[]; speed: number }) {
  return (
    <div className="gallery__row" data-parallax={speed} data-parallax-axis="x">
      {items.map((p, i) => (
        <figure key={`${p}-${i}`} className={`gallery__item gallery__item--${i % 3}`}>
          {/* Повторы картинок — декоративные, без alt для скринридеров */}
          <Photo photo={p} alt={i < 3 ? undefined : ''} sizes="(min-width: 1024px) 24vw, (min-width: 600px) 36vw, 60vw" />
        </figure>
      ))}
    </div>
  );
}

export function Gallery() {
  return (
    <section className="section section--night-deep gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="section-head">
          <h2 id="gallery-title" data-reveal="up">
            Так выглядят мои вечера
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            Живые эмоции, полный танцпол и гости, которые не хотят расходиться.
          </p>
        </div>
      </div>
      <div className="gallery__rows">
        <Row items={ROW_A} speed={0.35} />
        <Row items={ROW_B} speed={-0.35} />
      </div>
    </section>
  );
}
