import { contacts } from '../content';
import { PhoneIcon, TelegramIcon, WhatsAppIcon } from './Icons';
import './MobileBar.css';

/** Нижняя панель на телефоне: контакты всегда под пальцем. */
export function MobileBar() {
  return (
    <nav className="mobile-bar" aria-label="Быстрая связь">
      <a href={contacts.phoneHref} className="mobile-bar__call">
        <PhoneIcon />
        Позвонить
      </a>
      <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Написать в WhatsApp">
        <WhatsAppIcon />
      </a>
      <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" aria-label="Написать в Telegram">
        <TelegramIcon />
      </a>
      <a href="#booking" className="mobile-bar__book">
        Заявка
      </a>
    </nav>
  );
}
