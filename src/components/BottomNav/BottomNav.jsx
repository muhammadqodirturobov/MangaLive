import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, Bookmark, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { resolveAvatar } from '../../data/avatars.js';
import { getGuestAvatar } from '../../data/userStorage.js';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

  const userAvatar = user?.user_metadata?.avatar_url || getGuestAvatar();
  const avatarSrc = userAvatar ? resolveAvatar(userAvatar) : null;

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
        to="/profil"
        className={`${styles.navItem} ${path === '/profil' ? styles.active : ''}`}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className={`${styles.bottomNavAvatar} ${path === '/profil' ? styles.activeAvatar : ''}`}
          />
        ) : (
          <User size={20} className={styles.icon} />
        )}
        <span className={styles.label}>Profil</span>
      </Link>
    </nav>
  );
}
