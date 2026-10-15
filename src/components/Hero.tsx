import { useEffect, useRef, type CSSProperties } from 'react';
import { contacts, hero, person, site } from '../content';
import { createMirrorBall } from '../lib/mirrorball';
import { isFinePointer, prefersReducedMotion } from '../lib/motion';
import { WhatsAppIcon } from './Icons';
import { Photo } from './Photo';
import './Hero.css';

function Word({ text, offset }: { text: string; offset: number }) {
  return (
    <span className="hero__word">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="hero__letter" style={{ '--i': i + offset } as CSSProperties}>
          <span className="hero__glyph">{ch}</span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const archRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const name = nameRef.current;
    const arch = archRef.current;
    if (!section || !canvas || !name || !arch) return;

    const reduced = prefersReducedMotion();
    const ball = createMirrorBall(canvas, {
      reduced,
      anchor: (w, h) => {
        if (w >= 1024) return { x: w * 0.555, y: Math.min(h * 0.21, 200), r: 66 };
        if (w >= 600) return { x: w * 0.8, y: 150, r: 44 };
        return { x: w - 42, y: 118, r: 27 };
      },
    });

    // Останавливаем анимацию, когда первый экран не виден
    const io = new IntersectionObserver(([e]) => ball.setActive(e.isIntersecting), { threshold: 0 });
    io.observe(section);
    const onVis = () => ball.setActive(!document.hidden);
    document.addEventListener('visibilitychange', onVis);

    const letters = Array.from(name.querySelectorAll<HTMLElement>('.hero__glyph'));
    let raf = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      raf = 0;
      ball.setPointer(px, py);
      if (reduced) return;
      // Буквы «пританцовывают» рядом с курсором
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const dx = px - (r.left + r.width / 2);
        const dy = py - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        const k = Math.max(0, 1 - d / 240);
        l.style.setProperty('--lift', `${(-k * 26).toFixed(1)}px`);
        l.style.setProperty('--tilt', `${(k * (dx > 0 ? -10 : 10)).toFixed(1)}deg`);
        l.style.setProperty('--glow', k.toFixed(2));
      }
      // Арка с фото чуть поворачивается за курсором
      const ar = arch.getBoundingClientRect();
      const nx = (px - (ar.left + ar.width / 2)) / window.innerWidth;
      const ny = (py - (ar.top + ar.height / 2)) / window.innerHeight;
      arch.style.setProperty('--ry', `${(nx * 14).toFixed(2)}deg`);
      arch.style.setProperty('--rx', `${(-ny * 10).toFixed(2)}deg`);
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      letters.forEach((l) => {
        l.style.setProperty('--lift', '0px');
        l.style.setProperty('--tilt', '0deg');
        l.style.setProperty('--glow', '0');
      });
      arch.style.setProperty('--ry', '0deg');
      arch.style.setProperty('--rx', '0deg');
    };

    const fine = isFinePointer();
    if (fine) {
      section.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);
    }

    // На телефоне: тап по имени — буквы танцуют волной
    const onTap = () => {
      if (reduced) return;
      name.classList.remove('is-waving');
      void name.offsetWidth;
      name.classList.add('is-waving');
    };
    name.addEventListener('click', onTap);

    return () => {
      ball.destroy();
      io.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      name.removeEventListener('click', onTap);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero" id="top" aria-labelledby="hero-title">
      <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            <span ref={nameRef} className="hero__name">
              <Word text={person.firstName} offset={0} />{' '}
              <Word text={person.lastName} offset={person.firstName.length} />
            </span>{' '}
            <span className="hero__role">
              ведущий свадеб, юбилеев и корпоративов{site.cityIn ? ` ${site.cityIn}` : ''}
            </span>
          </h1>

          <p className="hero__tagline">{person.tagline}</p>
          <p className="hero__lead">{hero.lead}</p>

          <div className="hero__actions">
            <a className="btn" href="#booking">
              {hero.primaryCta}
            </a>
            <a className="btn btn--ghost" href={contacts.whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Написать в WhatsApp
            </a>
          </div>

          <a className="hero__phone" href={contacts.phoneHref}>
            <span className="hero__phone-label">Звоните, отвечу лично</span>
            <span className="hero__phone-number">{contacts.phone}</span>
          </a>
        </div>

        <div className="hero__visual">
          <div ref={archRef} className="hero__arch">
            <Photo photo="hero" priority sizes="(min-width: 1024px) 34vw, (min-width: 600px) 46vw, 78vw" />
            <svg className="hero__badge" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <circle cx="100" cy="100" r="98" className="hero__badge-bg" />
              <text>
                <textPath href="#badge-circle" startOffset="0">
                  поёт ✦ танцует ✦ ведёт ✦ зажигает ✦
                </textPath>
              </text>
              <path
                className="hero__badge-star"
                d="M100 70c1.6 17 13.4 28.4 30 30-16.6 1.6-28.4 13-30 30-1.6-17-13.4-28.4-30-30 16.6-1.6 28.4-13 30-30Z"
              />
            </svg>
          </div>
        </div>
      </div>

      <a className="hero__scroll" href="#about" aria-label="Листать ниже">
        <span />
      </a>
    </section>
  );
}
