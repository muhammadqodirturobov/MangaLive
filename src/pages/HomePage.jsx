import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import FeaturedBanner from '../components/FeaturedBanner/FeaturedBanner.jsx';
import MangaCarousel from '../components/MangaCarousel/MangaCarousel.jsx';
import LatestUpdatesGrid from '../components/LatestUpdatesGrid/LatestUpdatesGrid.jsx';
import {
  fetchFeaturedMangas,
  fetchPopularManga,
  fetchLatestManga,
  getFeaturedMangas,
  getPopularManga,
  getLatestManga,
} from '../services/mangaService.js';
import styles from './HomePage.module.css';

// Popularity time tabs
const TIME_TABS = [
  { id: 'daily',   label: 'Kunlik' },
  { id: 'weekly',  label: 'Haftalik' },
  { id: 'monthly', label: 'Oylik' },
];

// Days of week tabs
const DAYS = [
  { id: 'mon', label: 'Dushanba', short: 'Dush' },
  { id: 'tue', label: 'Seshanba', short: 'Sesh' },
  { id: 'wed', label: 'Chorshanba', short: 'Chor' },
  { id: 'thu', label: 'Payshanba', short: 'Pay' },
  { id: 'fri', label: 'Juma', short: 'Juma' },
  { id: 'sat', label: 'Shanba', short: 'Shan' },
  { id: 'sun', label: 'Yakshanba', short: 'Yak' },
];

export default function HomePage() {
  const [activeDay, setActiveDay] = useState('tue');
  const [activeTimeTab, setActiveTimeTab] = useState('weekly');

  const initialFeatured = getFeaturedMangas(4);
  const initialPopular = getPopularManga(10);
  const initialLatest = getLatestManga(6);

  const [featuredMangas, setFeaturedMangas] = useState(initialFeatured || []);
  const [popularManga, setPopularManga] = useState(initialPopular || []);
  const [latestManga, setLatestManga] = useState(initialLatest || []);
  const [loading, setLoading] = useState(initialFeatured.length === 0);
  const [dbError, setDbError] = useState(null);

  const loadData = useCallback(async () => {
    if (initialFeatured.length === 0) {
      setLoading(true);
    }
    setDbError(null);

    try {
      const [featured, popular, latest] = await Promise.all([
        fetchFeaturedMangas(4),
        fetchPopularManga(10),
        fetchLatestManga(6),
      ]);
      setFeaturedMangas(featured || []);
      setPopularManga(popular || []);
      setLatestManga(latest || []);
    } catch (err) {
      console.error('[HomePage] Failed to load data from Supabase:', err);
      setDbError(err.message || "Ma'lumotlar bazasiga ulanishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [initialFeatured.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real ongoing manga list for the schedule carousel
  const scheduleManga = popularManga.filter((m) => m.status === 'davom etmoqda');

  return (
    <main className={styles.homeMain}>
      {/* ── Database error banner with Retry button */}
      {dbError && (
        <div className={styles.dbErrorBanner} role="alert">
          <AlertTriangle size={16} />
          <span>Ma'lumotlar bazasi xatoligi: {dbError}</span>
          <button type="button" className="btn btn-outline" onClick={loadData} style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}>
            <RefreshCw size={12} />
            <span>Qayta urinish</span>
          </button>
        </div>
      )}

      {/* ── 1. Featured Manga Rotating Banner Carousel ────────────────── */}
      {featuredMangas.length > 0 && <FeaturedBanner mangas={featuredMangas} />}

      <div className={`container ${styles.container}`}>
        {/* ── 2. Mashhurlar (MangaBox style: Rank 1, 2, 3...) ─────────── */}
        {popularManga.length > 0 && (
          <section className={styles.sectionBlock}>
            <MangaCarousel
              title="Mashhurlar"
              subtitle="Eng ko'p o'qilayotgan top asarlar"
              mangas={popularManga}
              showRank={true}
              rightAction={
                <div className={styles.timeTabs}>
                  {TIME_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.timeTabBtn} ${activeTimeTab === t.id ? styles.activeTimeTabBtn : ''}`}
                      onClick={() => setActiveTimeTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              }
            />
          </section>
        )}

        {/* ── 3. Haftalik Jadval (Horizontal Weekday Carousel) ────────── */}
        {scheduleManga.length > 0 && (
          <section className={styles.sectionBlock}>
            {/* Schedule Days Tab Bar */}
            <div className={styles.scheduleTabBar}>
              <div className={styles.daysScroll}>
                {DAYS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`${styles.dayBtn} ${activeDay === d.id ? styles.activeDayBtn : ''}`}
                    onClick={() => setActiveDay(d.id)}
                  >
                    <span className={styles.dayFull}>{d.label}</span>
                    <span className={styles.dayShort}>{d.short}</span>
                  </button>
                ))}
              </div>
              <Link to="/katalog" className={styles.viewListLink}>
                <span>Katalogga o'tish</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Swipeable Carousel */}
            <MangaCarousel
              title="Haftalik jadval"
              mangas={scheduleManga}
            />
          </section>
        )}

        {/* ── 4. So'nggi Qo'shilganlar (Latest Updates Compact Grid) ──── */}
        {latestManga.length > 0 && (
          <section className={styles.sectionBlock}>
            <LatestUpdatesGrid
              title="So'nggi qo'shilganlar"
              subtitle="Kutubxonaga yangi qo'shilgan asarlar va boblar"
              mangas={latestManga}
              rightAction={
                <Link to="/katalog" className={styles.viewAllTextLink}>
                  <span>Barcha mangalar</span>
                  <ChevronRight size={14} />
                </Link>
              }
            />
          </section>
        )}

        {/* Clean empty state if database has no mangas yet */}
        {!loading && featuredMangas.length === 0 && popularManga.length === 0 && latestManga.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#94a3b8' }}>
            <h2>Kutubxona hozircha bo'sh</h2>
            <p>Admin panel orqali yangi manga va boblarni qo'shishingiz mumkin.</p>
            <Link to="/admin" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Admin panelga o'tish
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
