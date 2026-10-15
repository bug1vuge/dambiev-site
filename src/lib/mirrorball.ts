/**
 * Диско-шар на canvas: вращающиеся грани + блики, разлетающиеся по первому экрану.
 * Курсор работает как прожектор: шар «ловит» свет с его стороны,
 * а блики рядом с курсором вспыхивают ярче. Без зависимостей, ~1 мс на кадр.
 */

interface Spot {
  lat: number;
  lon: number;
  size: number;
  tint: number;
  twinkle: number;
}

interface Options {
  /** Центр и радиус шара в пикселях холста. */
  anchor: (w: number, h: number) => { x: number; y: number; r: number };
  reduced: boolean;
}

const TINTS = ['255,246,227', '255,197,61', '255,111,145', '186,190,255'];

function makeSprite(rgb: string): HTMLCanvasElement {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  if (g) {
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, `rgba(${rgb},1)`);
    grd.addColorStop(0.25, `rgba(${rgb},0.55)`);
    grd.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  }
  return c;
}

export function createMirrorBall(canvas: HTMLCanvasElement, opts: Options) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined, setPointer: () => undefined, setActive: () => undefined };

  const sprites = TINTS.map(makeSprite);
  const spots: Spot[] = Array.from({ length: 90 }, () => ({
    lat: (Math.random() - 0.35) * 1.5,
    lon: Math.random() * Math.PI * 2,
    size: 10 + Math.random() * 30,
    tint: (Math.random() * TINTS.length) | 0,
    twinkle: Math.random() * Math.PI * 2,
  }));

  let w = 0;
  let h = 0;
  let dpr = 1;
  let rot = 0;
  let raf = 0;
  let active = true;
  let last = performance.now();
  // Указатель в нормализованных координатах (-1..1), плавно догоняемый.
  const ptr = { x: 0.3, y: -0.4, tx: 0.3, ty: -0.4, px: -9999, py: -9999 };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawBall = (cx: number, cy: number, R: number) => {
    // Нить, на которой висит шар
    ctx.strokeStyle = 'rgba(255,246,227,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy - R);
    ctx.stroke();

    // Ореол света вокруг шара
    const halo = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 3.2);
    halo.addColorStop(0, 'rgba(255,197,61,0.22)');
    halo.addColorStop(1, 'rgba(255,197,61,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Подложка-тень
    ctx.fillStyle = '#0d0f33';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Направление света из позиции курсора
    let lx = ptr.x;
    let ly = ptr.y;
    let lz = 0.9;
    const ll = Math.hypot(lx, ly, lz);
    lx /= ll;
    ly /= ll;
    lz /= ll;

    const rows = 16;
    for (let i = 0; i < rows; i++) {
      const a0 = -Math.PI / 2 + (i / rows) * Math.PI;
      const a1 = -Math.PI / 2 + ((i + 1) / rows) * Math.PI;
      const am = (a0 + a1) / 2;
      const cols = Math.max(6, Math.round(32 * Math.cos(am)));
      for (let j = 0; j < cols; j++) {
        const o0 = (j / cols) * Math.PI * 2 + rot + i * 0.17;
        const o1 = ((j + 1) / cols) * Math.PI * 2 + rot + i * 0.17;
        const om = (o0 + o1) / 2;
        const nz = Math.cos(am) * Math.cos(om);
        if (nz <= 0.02) continue;
        const nx = Math.cos(am) * Math.sin(om);
        const ny = Math.sin(am);
        const shade = Math.max(0, nx * lx + ny * ly + nz * lz);
        const spec = Math.pow(shade, 18);
        const twinkle = ((i * 7 + j * 13) % 17 === 0 ? 0.5 + 0.5 * Math.sin(rot * 9 + i + j) : 0) * nz;
        const base = 60 + 150 * shade;
        const r = Math.min(255, base * 0.86 + 255 * spec + 120 * twinkle);
        const g = Math.min(255, base * 0.88 + 220 * spec + 110 * twinkle);
        const b = Math.min(255, base * 1.08 + 120 * spec + 60 * twinkle);
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;

        const pts = [
          [a0 + 0.012, o0 + 0.012],
          [a0 + 0.012, o1 - 0.012],
          [a1 - 0.012, o1 - 0.012],
          [a1 - 0.012, o0 + 0.012],
        ];
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const [la, lo] = pts[k];
          const x = cx + R * Math.cos(la) * Math.sin(lo);
          const y = cy + R * Math.sin(la);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Объём: затемнение по краю
    const vg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.2, cx, cy, R * 1.02);
    vg.addColorStop(0, 'rgba(255,255,255,0.08)');
    vg.addColorStop(0.7, 'rgba(13,15,51,0)');
    vg.addColorStop(1, 'rgba(13,15,51,0.65)');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSpots = (cx: number, cy: number, R: number, t: number) => {
    ctx.globalCompositeOperation = 'lighter';
    const reach = Math.max(w, h) * 0.75;
    for (const s of spots) {
      const lo = s.lon + rot * 1.6;
      const facing = Math.cos(lo);
      if (facing < -0.2) continue;
      const x = cx + Math.sin(lo) * reach * (0.55 + 0.45 * Math.abs(Math.sin(s.lat * 2)));
      const y = cy + R + (s.lat + 0.35) * h * 0.75 * (1 - 0.3 * facing);
      if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
      const near = Math.max(0, 1 - Math.hypot(x - ptr.px, y - ptr.py) / 220);
      const tw = 0.55 + 0.45 * Math.sin(t * 0.004 + s.twinkle);
      const alpha = Math.min(1, (0.3 + 0.7 * Math.max(0, facing)) * tw * 0.85 + near * 0.7);
      const size = s.size * (1 + near * 1.2);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprites[s.tint], x - size, y - size * 0.7, size * 2, size * 1.4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(48, t - last);
    last = t;
    ptr.x += (ptr.tx - ptr.x) * 0.06;
    ptr.y += (ptr.ty - ptr.y) * 0.06;
    rot += dt * 0.00018 + (ptr.tx - ptr.x) * 0.02;

    ctx.clearRect(0, 0, w, h);
    const { x: cx, y: cy, r } = opts.anchor(w, h);
    drawSpots(cx, cy, r, t);
    drawBall(cx, cy, r);
    if (active && !opts.reduced) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const onResize = () => {
    resize();
    if (opts.reduced || !active) frame(performance.now());
  };

  resize();
  window.addEventListener('resize', onResize, { passive: true });
  if (opts.reduced) frame(performance.now());
  else start();

  return {
    setPointer(clientX: number, clientY: number) {
      const r = canvas.getBoundingClientRect();
      ptr.px = clientX - r.left;
      ptr.py = clientY - r.top;
      ptr.tx = (ptr.px / r.width) * 2 - 1;
      ptr.ty = (ptr.py / r.height) * 2 - 1;
    },
    setActive(v: boolean) {
      active = v;
      if (v && !opts.reduced) start();
      else if (!v && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    },
  };
}
