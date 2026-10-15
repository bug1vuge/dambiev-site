import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { contacts, faq, localPhotos, person, photos, reviews, seo, site } from './content';

/** HTML приложения для пререндера (поисковики видят весь текст сразу). */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

const HERO_SIZES = '(min-width: 1024px) 34vw, (min-width: 600px) 46vw, 78vw';

/** Предзагрузка главного фото с тем же srcset, что у <img> — без двойной загрузки. */
function heroPreload(): string[] {
  const widths = [480, 800, 1200];
  if (localPhotos) {
    const set = widths.map((w) => `${import.meta.env.BASE_URL}img/hero-${w}.avif ${w}w`).join(', ');
    return [`<link rel="preload" as="image" type="image/avif" imagesrcset="${set}" imagesizes="${HERO_SIZES}" fetchpriority="high">`];
  }
  const [dir, file] = photos.hero.tilda.split('/');
  const set = widths.map((w) => `https://static.tildacdn.info/${dir}/-/resize/${w}x/${file} ${w}w`).join(', ');
  return [
    `<link rel="preconnect" href="https://static.tildacdn.info">`,
    `<link rel="preload" as="image" imagesrcset="${set}" imagesizes="${HERO_SIZES}" fetchpriority="high">`,
  ];
}

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Мета-теги, Open Graph и микроразметка Schema.org. */
export function head(): string {
  const url = `${site.url}/`;
  const sameAs = [contacts.instagram, contacts.vk];

  const realReviews = reviews.filter((r) => !r.placeholder);

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: person.fullName,
      jobTitle: person.role,
      description: seo.description,
      image: seo.ogImage,
      telephone: contacts.phone.replace(/[^\d+]/g, ''),
      url,
      sameAs,
    },
    {
      '@type': 'ProfessionalService',
      '@id': `${url}#service`,
      name: `${person.fullName} — ведущий мероприятий`,
      description: seo.description,
      image: seo.ogImage,
      telephone: contacts.phone.replace(/[^\d+]/g, ''),
      url,
      founder: { '@id': `${url}#person` },
      ...(site.city ? { areaServed: site.city, address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'RU' } } : {}),
      serviceType: ['Ведущий на свадьбу', 'Ведущий на юбилей', 'Ведущий корпоратива', 'Ведущий выпускного'],
      sameAs,
      ...(realReviews.length
        ? {
            review: realReviews.map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.name },
              reviewBody: r.text,
            })),
          }
        : {}),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

  return [
    `<title>${esc(seo.title)}</title>`,
    // Демо-версия (GitHub Pages с образцами отзывов) не должна попасть в поиск
    ...(import.meta.env.VITE_NOINDEX === '1' ? ['<meta name="robots" content="noindex, nofollow">'] : []),
    `<meta name="description" content="${esc(seo.description)}">`,
    `<meta name="keywords" content="${esc(seo.keywords)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="ru_RU">`,
    `<meta property="og:site_name" content="${esc(person.fullName)}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(seo.ogImage)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    ...heroPreload(),
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ');
}
