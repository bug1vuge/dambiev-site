import { contacts, person, sections } from '../content';
import { InstagramIcon, PhoneIcon, SparkIcon, TelegramIcon, VkIcon, WhatsAppIcon } from './Icons';
import { NAV } from './Header';
import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <a className="footer__cta" href="#booking">
          <span className="footer__cta-text">{sections.footer.cta}</span>
          <span className="footer__cta-btn btn">Забронировать дату</span>
        </a>

        <div className="footer__grid">
          <div className="footer__brand">
            <p className="footer__logo">
              <SparkIcon />
              {person.fullName}
            </p>
            <p className="footer__role">{person.tagline}</p>
          </div>

          <nav className="footer__nav" aria-label="Навигация в подвале">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <address className="footer__contacts">
            <a className="footer__phone" href={contacts.phoneHref}>
              <PhoneIcon />
              {contacts.phone}
            </a>
            <div className="footer__socials">
              <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <WhatsAppIcon />
              </a>
              <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <TelegramIcon />
              </a>
              <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href={contacts.vk} target="_blank" rel="noopener noreferrer" aria-label="ВКонтакте">
                <VkIcon />
              </a>
            </div>
          </address>
        </div>

        <div className="footer__bottom">
          <p>
            © {year} {person.fullName}. Ведущий мероприятий.
          </p>
          <a href={`${import.meta.env.BASE_URL}privacy.html`}>Политика конфиденциальности</a>
        </div>
      </div>
    </footer>
  );
}
