/** Общие эффекты страницы: появление при скролле, параллакс, подсветка кнопок. */

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Появление блоков: [data-reveal] получает класс .is-in при входе в экран. */
export function initReveal(): () => void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return () => undefined;
  }
  // Элементы с clip-path «невидимы» для IntersectionObserver — следим за их родителем
  const targetFor = new Map<Element, HTMLElement>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (targetFor.get(e.target) ?? (e.target as HTMLElement)).classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );
  items.forEach((el) => {
    const watch = el.dataset.reveal === 'curtain' && el.parentElement ? el.parentElement : el;
    targetFor.set(watch, el);
    io.observe(watch);
  });
  return () => io.disconnect();
}

/**
 * Параллакс: у элемента data-parallax="0.15" (скорость, может быть < 0)
 * обновляется CSS-переменная --py. Считаем только видимые элементы.
 * data-parallax-axis="x" — сдвиг по горизонтали (переменная --px).
 */
export function initParallax(): () => void {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return () => undefined;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const visible = new Set<HTMLElement>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
      schedule();
    },
    { rootMargin: '20% 0px' },
  );
  els.forEach((el) => io.observe(el));

  let raf = 0;
  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    visible.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax ?? '0');
      const host = el.parentElement ?? el;
      const r = host.getBoundingClientRect();
      const center = r.top + r.height / 2 - vh / 2;
      const value = -center * speed;
      if (el.dataset.parallaxAxis === 'x') el.style.setProperty('--px', `${value.toFixed(1)}px`);
      else el.style.setProperty('--py', `${value.toFixed(1)}px`);
    });
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}

/** Блик на кнопках следует за курсором (переменные --mx/--my). */
export function initButtonGlow(): () => void {
  if (!isFinePointer()) return () => undefined;
  const onMove = (e: PointerEvent) => {
    const btn = (e.target as Element | null)?.closest?.('.btn') as HTMLElement | null;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
    btn.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  return () => document.removeEventListener('pointermove', onMove);
}

/** Праздничный салют из конфетти — при успешной отправке заявки. */
export function burstConfetti(originX: number, originY: number): void {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: `${w}px`,
    height: `${h}px`,
    pointerEvents: 'none',
    zIndex: '200',
  });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  const colors = ['#ffc53d', '#ff6f91', '#fff6e3', '#8f95ff', '#f2a900'];
  const parts = Array.from({ length: 140 }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = 6 + Math.random() * 10;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 7,
      r: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0],
    };
  });
  const start = performance.now();
  const tick = (t: number) => {
    const elapsed = t - start;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - elapsed / 2200);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    }
    if (elapsed < 2200) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
