import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle, RefreshCw, Compass } from 'lucide-react';
import FeaturedBanner from '../components/FeaturedBanner/FeaturedBanner.jsx';
import SpotlightRecommendations from '../components/SpotlightRecommendations/SpotlightRecommendations.jsx';
import MangaCarousel from '../components/MangaCarousel/MangaCarousel.jsx';
import LatestUpdatesGrid from '../components/LatestUpdatesGrid/LatestUpdatesGrid.jsx';
import ContinueReading from '../components/ContinueReading/ContinueReading.jsx';
import WeeklyRanking from '../components/WeeklyRanking/WeeklyRanking.jsx';
import { WEEKLY_RANKINGS } from '../data/rankings.js';
import { GENRES } from '../data/genres.js';
import { getReadingHistory, fetchUnifiedReadingHistory } from '../services/userService.js';
import {
  fetchFeaturedMangas,
  fetchPopularManga,
  fetchLatestManga,
  getFeaturedMangas,
  getPopularManga,
  getLatestManga,
} from '../services/mangaService.js';
import styles from './HomePage.module.css';

const POPULAR_GENRES = [
  'jangovar',
  'fantaziya',
  'sarguzasht',
  'isekai',
  'komediya',
  'romantik',
  'sirli',
  'harakatli',
];

export default function HomePage() {
  const initialFeatured = getFeaturedMangas(10);
  const initialPopular = getPopularManga(10);
  const initialLatest = getLatestManga(8);

  const [featuredMangas, setFeaturedMangas] = useState(initialFeatured || []);
  const [popularManga, setPopularManga] = useState(initialPopular || []);
  const [latestManga, setLatestManga] = useState(initialLatest || []);
  const [readingHistory, setReadingHistory] = useState([]);
  const [loading, setLoading] = useState(initialFeatured.length === 0);
  const [dbError, setDbError] = useState(null);

  // Load reading history on mount (instant local-first, then sync unified)
  useEffect(() => {
    const local = getReadingHistory();
    if (local && local.length > 0) {
      setReadingHistory(local);
    }
    fetchUnifiedReadingHistory().then((unified) => {
      if (Array.isArray(unified)) {
        setReadingHistory(unified);
      }
    }).catch((err) => {
      console.warn('[HomePage] Unified reading history fetch error:', err);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (initialFeatured.length === 0) {
      setLoading(true);
    }
    setDbError(null);

    try {
      const [featured, popular, latest] = await Promise.all([
        fetchFeaturedMangas(10),
        fetchPopularManga(10),
        fetchLatestManga(8),
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

  return (
    <main className={styles.homeMain}>
      {/* ── Database error banner with Retry button */}
      {dbError && (
        <div className={styles.dbErrorBanner} role="alert">
          <AlertTriangle size={16} />
          <span>Ma'lumotlar bazasi xatoligi: {dbError}</span>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadData}
            style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
          >
            <RefreshCw size={12} />
            <span>Qayta urinish</span>
          </button>
        </div>
      )}

      {/* ── 1. Compact Featured Hero Carousel with Peeking Slides ─── */}
      {featuredMangas.length > 0 && <FeaturedBanner mangas={featuredMangas} />}

      <div className={`container ${styles.container}`}>
        {/* ── 2. O'qishni davom ettirish (Multi-Series Continue Reading Row) ── */}
        <ContinueReading
          items={readingHistory}
          allMangas={[...featuredMangas, ...popularManga, ...latestManga]}
        />

        {/* ── 3. Ommabop Asarlar (Trending Manga Carousel) ──────────── */}
        {popularManga.length > 0 && (
          <section className={styles.sectionBlock}>
            <MangaCarousel
              title="Ommabop Asarlar"
              subtitle="O'zbek tiliga tarjima qilingan eng mashhur manhwa va mangalar"
              mangas={popularManga}
              showRank={true}
              rightAction={
                <Link to="/katalog" className={styles.viewAllTextLink}>
                  <span>Hammasini ko'rish</span>
                  <ChevronRight size={14} />
                </Link>
              }
            />
          </section>
        )}

        {/* ── 5. Sizga Tavsiya Etiladi (Editorial Curated Showcase) ──── */}
        {popularManga.length > 0 && (
          <SpotlightRecommendations
            mangas={popularManga.filter((m) => m.rating >= 7.5 || m.canonicalRating10 >= 7.5)}
          />
        )}

        {/* ── 6. Quick Genre Explorer Pills ─────────────────────────── */}
        <section className={styles.genreBar} aria-label="Ommabop janrlar">
          <div className={styles.genreHeader}>
            <Compass size={15} className={styles.genreIcon} />
            <span className={styles.genreBarTitle}>Janrlar bo'yicha:</span>
          </div>
          <div className={styles.genrePills}>
            {POPULAR_GENRES.map((slug) => {
              const genreObj = GENRES.find((g) => g.slug === slug);
              return (
                <Link
                  key={slug}
                  to={`/katalog?janr=${encodeURIComponent(slug)}`}
                  className={styles.genrePill}
                >
                  <span className={styles.genrePillIcon}>{genreObj?.icon || '✨'}</span>
                  <span>{genreObj?.label || slug}</span>
                </Link>
              );
            })}
            <Link to="/katalog" className={`${styles.genrePill} ${styles.genrePillAll}`}>
              <span>Barcha janrlar →</span>
            </Link>
          </div>
        </section>

        {/* ── 7. Main 2-Column Section: Latest Releases + AniList Top Ranking ── */}
        <div className={styles.splitLayout}>
          <div className={styles.mainColumn}>
            {latestManga.length > 0 && (
              <section className={styles.sectionBlock}>
                <LatestUpdatesGrid
                  title="So'nggi Yangilanishlar"
                  subtitle="Yangi qo'shilgan va tarjima qilingan boblar"
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
          </div>

          <aside className={styles.sidebarColumn}>
            <WeeklyRanking rankings={WEEKLY_RANKINGS} />
          </aside>
        </div>

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
