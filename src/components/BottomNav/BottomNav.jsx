import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, Bookmark, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className={styles.bottomNav} aria-label="Mobil navigatsiya paneli">
      <Link
        to="/"
        className={`${styles.navItem} ${path === '/' ? styles.active : ''}`}
      >
        <Home size={20} className={styles.icon} />
        <span className={styles.label}>Bosh</span>
      </Link>

      <Link
        to="/katalog?search=open"
        className={`${styles.navItem} ${path === '/katalog' && location.search.includes('search') ? styles.active : ''}`}
      >
        <Search size={20} className={styles.icon} />
        <span className={styles.label}>Qidirish</span>
      </Link>

      <Link
        to="/katalog"
        className={`${styles.navItem} ${path === '/katalog' && !location.search.includes('search') ? styles.active : ''}`}
      >
        <BookOpen size={20} className={styles.icon} />
        <span className={styles.label}>Katalog</span>
      </Link>

      <Link
        to="/kutubxona"
        className={`${styles.navItem} ${path === '/kutubxona' ? styles.active : ''}`}
      >
        <Bookmark size={20} className={styles.icon} />
        <span className={styles.label}>Kutubxona</span>
      </Link>

      <Link
        to="/kutubxona"
        className={`${styles.navItem} ${path === '/profil' ? styles.active : ''}`}
      >
        <User size={20} className={styles.icon} />
        <span className={styles.label}>Profil</span>
      </Link>
    </nav>
  );
}
