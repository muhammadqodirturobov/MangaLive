import { Link } from 'react-router-dom';
import { BookOpen, Heart } from 'lucide-react';
import styles from './Footer.module.css';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Bosh sahifa', to: '/'          },
    { label: 'Katalog',     to: '/katalog'   },
    { label: 'Reyting',     to: '/reyting'  },
    { label: 'Hamjamiyat',  to: '/hamjamiyat'},
  ],
  Yordam: [
    { label: 'Biz haqimizda', to: '/haqimizda' },
    { label: 'Muallif bo\'lib qo\'shiling', to: '/muallif' },
    { label: 'Hisobot berish', to: '/hisobot' },
    { label: 'Tez-tez so\'raladigan savollar', to: '/faq' },
  ],
  Huquqiy: [
    { label: 'Foydalanish shartlari', to: '/shartlar'  },
    { label: 'Maxfiylik siyosati',    to: '/maxfiylik' },
    { label: 'Mualliflik huquqi',     to: '/dmca'      },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.inner}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link to="/" className={styles.logo} aria-label="MangaLive.uz bosh sahifasi">
            <BookOpen size={20} aria-hidden="true" />
            <span>Manga<span className={styles.accent}>Live</span>.uz</span>
          </Link>
          <p className={styles.tagline}>
            O'zbekistonning eng katta manga, manhwa va manhua o'qish platformasi.
          </p>
          <p className={styles.disclaimer}>
            Ushbu sayt namoyish uchun yaratilgan namuna. Barcha sarlavhalar va ma'lumotlar
            hayoliy va faqat rivojlanish maqsadida ishlatiladi.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <nav key={group} aria-label={`${group} havolalari`}>
            <h3 className={styles.groupTitle}>{group}</h3>
            <ul className={styles.linkList}>
              {links.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={styles.link}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className="container">
          <p className={styles.copyright}>
            © {year} MangaLive.uz — Namuna loyiha. Barcha huquqlar saqlanmagan.
          </p>
          <p className={styles.madeWith}>
            <Heart size={12} aria-hidden="true" className={styles.heart} />
            O'zbekiston uchun sevgi bilan yaratildi
          </p>
        </div>
      </div>
    </footer>
  );
}
