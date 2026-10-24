import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import styles from './PlaceholderPage.module.css';

/**
 * PlaceholderPage — used for routes that exist in the nav but aren't
 * implemented yet (Reyting, Hamjamiyat, etc.).
 */
export default function PlaceholderPage({ title, description }) {
  return (
    <main className={`container ${styles.page}`}>
      <Construction size={56} className={styles.icon} aria-hidden="true" />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.desc}>
        {description ?? 'Bu sahifa hozircha ishlab chiqilmoqda.'}
      </p>
      <Link to="/" className="btn btn-primary">
        Bosh sahifaga qaytish
      </Link>
    </main>
  );
}
