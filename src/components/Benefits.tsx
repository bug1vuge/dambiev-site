import type { CSSProperties } from 'react';
import { benefits } from '../content';
import './Benefits.css';

export function Benefits() {
  return (
    <section className="section section--butter benefits" id="benefits" aria-labelledby="benefits-title">
      <div className="container">
        <div className="section-head">
          <h2 id="benefits-title" data-reveal="up">
            Весело гостям, спокойно вам
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            Лёгкость на празднике — это результат подготовки. Вот за что меня рекомендуют друзьям.
          </p>
        </div>
        <ul className="benefits__grid">
          {benefits.map((b, i) => (
            <li key={b.title} className="benefits__item" data-reveal="up" style={{ '--delay': `${(i % 3) * 0.1}s` } as CSSProperties}>
              <h3>
                <span className="benefits__mark">{b.title}</span>
              </h3>
              <p>{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
