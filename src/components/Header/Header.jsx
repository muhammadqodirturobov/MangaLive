import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Trophy, Globe, LogIn, User, Menu, X, BookOpen } from 'lucide-react';
import GenresDropdown from '../GenresDropdown/GenresDropdown.jsx';
import styles from './Header.module.css';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState('UZ');
  const genresRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (genresRef.current && !genresRef.current.contains(event.target)) {
        setGenresOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setGenresOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/katalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <header className={styles.header} role="banner">
      <div className={`container ${styles.inner}`}>
        {/* ── Left: Logo & Main Navigation ─────────────────────────── */}
        <div className={styles.leftGroup}>
          <Link to="/" className={styles.logo} aria-label="MangaLive.uz — bosh sahifa">
            <BookOpen size={22} className={styles.logoIcon} aria-hidden="true" />
            <span className={styles.logoText}>
              Manga<span className={styles.logoAccent}>Live</span>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Asosiy menyu">
            <Link
              to="/katalog"
              className={`${styles.navLink} ${location.pathname === '/katalog' ? styles.activeLink : ''}`}
            >
              Katalog
            </Link>

            {/* Janrlar Popover Trigger */}
            <div className={styles.genresTriggerWrap} ref={genresRef}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.genresBtn} ${genresOpen ? styles.activeLink : ''}`}
                onClick={() => setGenresOpen((prev) => !prev)}
                aria-expanded={genresOpen}
                aria-haspopup="dialog"
              >
                <span>Janrlar</span>
                <ChevronDown size={14} className={`${styles.chevron} ${genresOpen ? styles.chevronRotated : ''}`} />
              </button>

              {genresOpen && (
                <GenresDropdown onClose={() => setGenresOpen(false)} />
              )}
            </div>

            <Link
              to="/kutubxona"
              className={`${styles.navLink} ${location.pathname === '/kutubxona' ? styles.activeLink : ''}`}
            >
              Kutubxona
            </Link>
          </nav>
        </div>

        {/* ── Center: Search Bar ──────────────────────────────────── */}
        <form className={styles.searchForm} onSubmit={handleSearch} role="search">
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Manga, muallif, janr..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Manga qidirish"
          />
          <button type="submit" className={styles.searchSubmit} aria-label="Qidirish">
            <Search size={15} />
          </button>
        </form>

        {/* ── Right: Pro/Reyting, Lang, Login ─────────────────────── */}
        <div className={styles.rightGroup}>
          <Link to="/reyting" className={styles.ratingBtn}>
            <Trophy size={14} className={styles.trophyIcon} />
            <span>Reyting</span>
          </Link>

          {/* Language pill */}
          <button
            type="button"
            className={styles.langBtn}
            onClick={() => setLang((l) => (l === 'UZ' ? 'RU' : 'UZ'))}
            aria-label="Tilni o'zgartirish"
          >
            <Globe size={13} />
            <span>{lang}</span>
          </button>

          {/* Login button (Desktop) */}
          <Link to="/kutubxona" className={`btn btn-primary ${styles.loginBtn}`}>
            <LogIn size={14} />
            <span>Kirish</span>
          </Link>

          {/* Mobile Profile Icon (MangaBox style) */}
          <Link to="/kutubxona" className={styles.mobileProfileBtn} aria-label="Profilga kirish">
            <User size={18} />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer Menu ────────────────────────────────────── */}
      {mobileOpen && (
        <div className={styles.mobileDrawer}>
          <form className={styles.mobileSearchForm} onSubmit={handleSearch}>
            <Search size={15} className={styles.mobileSearchIcon} />
            <input
              type="search"
              className={styles.mobileSearchInput}
              placeholder="Manga, muallif, janr..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className={styles.mobileNav}>
            <Link to="/katalog" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
              Katalog
            </Link>
            <Link to="/kutubxona" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
              Kutubxona
            </Link>
            <Link to="/reyting" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
              Reyting
            </Link>
          </nav>

          <div className={styles.mobileFooterRow}>
            <button
              type="button"
              className={styles.langBtn}
              onClick={() => setLang((l) => (l === 'UZ' ? 'RU' : 'UZ'))}
            >
              <Globe size={13} />
              <span>{lang}</span>
            </button>
            <Link
              to="/kutubxona"
              className={`btn btn-primary ${styles.loginBtn}`}
              onClick={() => setMobileOpen(false)}
            >
              <LogIn size={14} />
              <span>Kirish</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
