import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, BookOpen, Clock, Play, AlertCircle,
  Heart, RotateCcw, ArrowUpDown, RefreshCw, Lock, Star
} from 'lucide-react';
import { getCachedManga, fetchMangaById } from '../services/mangaService.js';
import { getCachedChapters, fetchChapters } from '../services/chapterService.js';
import CoverImage from '../components/CoverImage/CoverImage.jsx';
import { isMangaFavorited, toggleFavorite, getLastReadChapter } from '../services/userService.js';
import { formatExternalRating } from '../services/ratingService.js';
import { formatViewCount } from '../services/analyticsService.js';
import { navigateBackFromOverview } from '../utils/navigationTracker.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isChapterLocked } from '../utils/chapterAccess.js';
import styles from './MangaDetailPage.module.css';

const TYPE_LABELS = { manga: 'Manga', manhwa: 'Manhwa', manhua: 'Manhua', komiks: 'Komiks' };
const STATUS_LABELS = {
  'davom etmoqda': { label: 'Davom etmoqda', cls: styles.statusOngoing },
  'tugallangan':   { label: 'Tugallangan',   cls: styles.statusCompleted },
  'pauza':         { label: 'Pauza',         cls: styles.statusHiatus },
};

export default function MangaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const handleBack = useCallback(() => {
    navigateBackFromOverview(navigate, id);
  }, [navigate, id]);

  // Instant cache check to eliminate lag and premature 404
  const cachedInitialManga = getCachedManga(id);
  const cachedInitialChapters = cachedInitialManga ? getCachedChapters(cachedInitialManga.id) : null;

  const [manga, setManga] = useState(cachedInitialManga || null);
  const [chapters, setChapters] = useState(cachedInitialChapters || []);
  const [loading, setLoading] = useState(!cachedInitialManga);
  const [error, setError] = useState(null);
  const [favorited, setFavorited] = useState(() => (cachedInitialManga ? isMangaFavorited(cachedInitialManga.id) : false));
  const [sortAscending, setSortAscending] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    // If already cached, we already display it, but revalidate in background without blocking
    if (!cachedInitialManga) {
      setLoading(true);
    }
    setError(null);

    try {
      const remoteManga = await fetchMangaById(id, { forceRefresh: true });
      if (!remoteManga) {
        setManga(null);
        setChapters([]);
        setLoading(false);
        return;
      }

      setManga(remoteManga);
      setFavorited(isMangaFavorited(remoteManga.id) || (remoteManga.slug ? isMangaFavorited(remoteManga.slug) : false));

      // Fetch real chapters for this manga
      const remoteChapters = await fetchChapters(remoteManga.id);
      setChapters(remoteChapters || []);
    } catch (err) {
      console.error('[MangaDetailPage] Load error:', err);
      setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [id, cachedInitialManga]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Loading skeleton state
  if (loading && !manga) {
    return (
      <main className="container" style={{ padding: '3rem 1rem' }}>
        <button
          className={`btn btn-ghost ${styles.backBtn}`}
          onClick={handleBack}
          aria-label="Orqaga"
        >
          <ArrowLeft size={18} />
          Orqaga
        </button>
        <div className={styles.skeletonBody}>
          <div className={styles.skeletonCover} />
          <div className={styles.skeletonMeta}>
            <div className={styles.skeletonLine} style={{ width: '30%', height: '24px' }} />
            <div className={styles.skeletonLine} style={{ width: '60%', height: '36px' }} />
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
            <div className={styles.skeletonLine} style={{ width: '100%', height: '80px', marginTop: '16px' }} />
          </div>
        </div>
      </main>
    );
  }

  // Network / server error state (recoverable, not 404)
  if (error && !manga) {
    return (
      <main className="container">
        <div className={styles.errorBox}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h1 className={styles.errorTitle}>Ulanishda xatolik yuz berdi</h1>
          <p className={styles.errorDesc}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={loadData}>
            <RefreshCw size={15} />
            <span>Qayta urinish</span>
          </button>
        </div>
      </main>
    );
  }

  // Genuine 404 (only after completed fetch confirming record does not exist)
  if (!manga) {
    return (
      <main className="container">
        <div className={styles.notFound}>
          <AlertCircle size={48} className={styles.notFoundIcon} />
          <h1>Manga topilmadi</h1>
          <p>Ushbu sahifa mavjud emas yoki tizimdan olib tashlangan.</p>
          <Link to="/katalog" className="btn btn-primary">
            Katalogga qaytish
          </Link>
        </div>
      </main>
    );
  }

  const handleToggleFavorite = () => {
    const nextState = toggleFavorite(manga.id);
    setFavorited(nextState);
  };

  const statusInfo = STATUS_LABELS[manga.status] ?? { label: manga.status, cls: '' };
  const stars = Math.round(Number(manga.rating || 0));
  const extRating = formatExternalRating(manga.slug || manga.id);
  const formattedViews = formatViewCount(manga.views);

  const getChapNum = (c) => {
    if (!c) return 0;
    const val = Number(c.number ?? c.chapter_number ?? c.chapterNumber ?? c.chapter);
    return Number.isFinite(val) ? val : 0;
  };

  // Determine reading order & resume actions
  const lastReadRaw = getLastReadChapter(manga.id) || (manga.slug ? getLastReadChapter(manga.slug) : null);
  const sortedChapters = [...chapters].sort((a, b) => getChapNum(a) - getChapNum(b));
  // Validate that lastRead chapter actually exists in available chapters to never link to unavailable chapter
  const lastRead = lastReadRaw && sortedChapters.some((c) => getChapNum(c) === lastReadRaw.chapterNumber)
    ? lastReadRaw
    : null;

  const chapter0 = sortedChapters.find((c) => getChapNum(c) === 0);
  const chapter1 = sortedChapters.find((c) => getChapNum(c) === 1);
  const earliestChapter = sortedChapters[0] || null;
  const latestChapter = sortedChapters[sortedChapters.length - 1] || null;
  const firstAvailableChapter = chapter1 || earliestChapter;
  const firstChapNum = firstAvailableChapter ? getChapNum(firstAvailableChapter) : 1;
  const mangaTarget = manga.slug || manga.id;

  // Display list of chapters sorted according to user preference (default: latest first)
  const displayChapters = [...chapters].sort((a, b) =>
    sortAscending ? getChapNum(a) - getChapNum(b) : getChapNum(b) - getChapNum(a)
  );

  return (
    <main>
      {/* ── Hero backdrop ───────────────────────── */}
      <div className={styles.heroSection}>
        {manga.coverImage && (
          <div
            className={styles.heroBackdrop}
            style={{ backgroundImage: `url("${manga.coverImage}")` }}
            aria-hidden="true"
          />
        )}
        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={`container ${styles.heroContent}`}>
          <button
            className={`btn btn-ghost ${styles.backBtn}`}
            onClick={handleBack}
            aria-label="Orqaga qaytish"
          >
            <ArrowLeft size={18} />
            Orqaga
          </button>

          <div className={styles.heroBody}>
            {/* Cover */}
            <div className={styles.coverWrapper}>
              <CoverImage
                src={manga.coverImage}
                alt={`${manga.title} muqovasi`}
                title={manga.title}
                type={manga.type}
                priority
                className={styles.cover}
              />
              <span className={`${styles.statusTag} ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Meta */}
            <div className={styles.meta}>
              <div className={styles.typeBadge}>
                {TYPE_LABELS[manga.type] ?? manga.type}
              </div>
              <div className={styles.titleWrapper}>
                <h1 className={styles.title}>{manga.title}</h1>
                {manga.titleEn && manga.titleEn.trim() && (
                  <span className={styles.titleEn} aria-label={`Inglizcha nomi: ${manga.titleEn.trim()}`}>
                    {manga.titleEn.trim()}
                  </span>
                )}
              </div>

              <p className={styles.author}>
                <BookOpen size={14} aria-hidden="true" />
                {manga.author || "Noma'lum muallif"}
              </p>

              {/* Rating: Authentic External Rating */}
              <div className={styles.ratingRow}>
                {extRating.hasRating ? (
                  <>
                    <div className={styles.aniListBadge} title={`${extRating.source} ${extRating.score}/10 (${extRating.members} ovoz)`}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
                      <span className={styles.ratingScore}>{extRating.score}/10</span>
                      <span className={styles.ratingSource}>· {extRating.source}</span>
                    </div>
                    {extRating.members && (
                      <span className={styles.ratingCount}>({extRating.members} ovoz)</span>
                    )}
                    {extRating.url && (
                      <a
                        href={extRating.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.ratingLink}
                      >
                        {extRating.source} sahifasi ↗
                      </a>
                    )}
                  </>
                ) : (
                  <span className={styles.unratedBadge}>Baholanmagan</span>
                )}
              </div>

              {/* Stats */}
              <div className={styles.stats}>
                <Stat icon={<BookOpen size={14} />} label={`${chapters.length} ta bob mavjud`} />
                {formattedViews ? (
                  <Stat icon={<Eye size={14} />} label={`${formattedViews} ko'rish`} />
                ) : null}
                {manga.lastUpdated && (
                  <Stat icon={<Clock size={14} />} label={`${manga.lastUpdated} yangilangan`} />
                )}
              </div>

              {/* Genres */}
              {manga.genres && manga.genres.length > 0 && (
                <div className={styles.genres}>
                  {manga.genres.map((g) => (
                    <Link key={g} to={`/katalog?janr=${encodeURIComponent(g)}`} className={styles.genreChip}>
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Reading & Resume Actions (Requirement 3) ── */}
              <div className={styles.actions}>
                {lastRead ? (
                  <>
                    {/* Returning Reader: Primary CTA is Resume */}
                    <Link
                      to={`/manga/${mangaTarget}/chapter/${lastRead.chapterNumber}`}
                      className={`btn btn-primary ${styles.readBtn}`}
                      onClick={(e) => {
                        if (isChapterLocked(lastRead.chapterNumber, user)) {
                          e.preventDefault();
                          openAuthModal('signup', {
                            intendedDestination: `/manga/${mangaTarget}/chapter/${lastRead.chapterNumber}`,
                            reason: 'chapter_locked',
                            chapterNumber: lastRead.chapterNumber,
                            mangaTitle: manga.title,
                          });
                        }
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                      O'qishni davom ettirish ({lastRead.chapterNumber}-bob)
                    </Link>

                    {firstAvailableChapter && firstChapNum !== lastRead.chapterNumber && (
                      <Link
                        to={`/manga/${mangaTarget}/chapter/${firstChapNum}`}
                        className="btn btn-outline"
                      >
                        <RotateCcw size={14} />
                        Boshidan o'qish ({firstChapNum}-bob)
                      </Link>
                    )}
                  </>
                ) : chapters.length > 0 ? (
                  <>
                    {/* New Reader: Start from Chapter 1 if available, or earliest available */}
                    <Link
                      to={`/manga/${mangaTarget}/chapter/${firstChapNum}`}
                      className={`btn btn-primary ${styles.readBtn}`}
                      onClick={(e) => {
                        if (isChapterLocked(firstChapNum, user)) {
                          e.preventDefault();
                          openAuthModal('signup', {
                            intendedDestination: `/manga/${mangaTarget}/chapter/${firstChapNum}`,
                            reason: 'chapter_locked',
                            chapterNumber: firstChapNum,
                            mangaTitle: manga.title,
                          });
                        }
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                      O'qishni boshlash ({firstChapNum}-bob{firstChapNum === 0 ? ': Prolog' : ''})
                    </Link>

                    {chapter0 && firstChapNum !== 0 && (
                      <Link
                        to={`/manga/${mangaTarget}/chapter/0`}
                        className={`btn btn-outline ${styles.prologueBtn}`}
                        title="0-bob: Prolog mavjud"
                      >
                        0-bob (Prolog)
                      </Link>
                    )}

                    {latestChapter && getChapNum(latestChapter) !== firstChapNum && (
                      <Link
                        to={`/manga/${mangaTarget}/chapter/${getChapNum(latestChapter)}`}
                        className="btn btn-outline"
                        onClick={(e) => {
                          const latChNum = getChapNum(latestChapter);
                          if (isChapterLocked(latChNum, user)) {
                            e.preventDefault();
                            openAuthModal('signup', {
                              intendedDestination: `/manga/${mangaTarget}/chapter/${latChNum}`,
                              reason: 'chapter_locked',
                              chapterNumber: latChNum,
                              mangaTitle: manga.title,
                            });
                          }
                        }}
                      >
                        So'nggi bob ({getChapNum(latestChapter)}-bob)
                      </Link>
                    )}
                  </>
                ) : (
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Hozircha boblar yuklanmagan
                  </span>
                )}

                <button
                  className={`btn ${favorited ? styles.favoriteBtnActive : 'btn-outline'}`}
                  onClick={handleToggleFavorite}
                  title={favorited ? "Saralangandan o'chirish" : "Sevimlilarga qo'shish"}
                >
                  <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
                  {favorited ? 'Sevimlilarda' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Synopsis & Chapters ─────────────────── */}
      <div className={`container ${styles.body}`}>
        {/* Synopsis */}
        <section aria-label="Tavsif" className={styles.synopsisSection}>
          <h2 className="section-title">Tavsif</h2>
          <p className={styles.synopsis}>
            {manga.synopsis || "Ushbu asar uchun hozircha tavsif kiritilmagan."}
          </p>
        </section>

        {/* Chapter list */}
        <section aria-label="Boblar ro'yxati" className={styles.chaptersSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Boblar
              <span className={styles.chapterCount}>({chapters.length} ta mavjud)</span>
            </h2>

            {chapters.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSortAscending((prev) => !prev)}
                style={{ fontSize: '0.75rem', gap: '4px', padding: '4px 8px' }}
                title="Boblar tartibini o'zgartirish"
              >
                <ArrowUpDown size={13} />
                <span>{sortAscending ? 'Eskilari avval' : 'Yangilari avval'}</span>
              </button>
            )}
          </div>

          {chapters.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <p>Ushbu mangada hozircha birorta bob yuklanmagan.</p>
            </div>
          ) : (
            <div className={styles.chapterList} role="list">
              {displayChapters.map((ch) => {
                const chNum = getChapNum(ch);
                const isRead = lastRead && Number(lastRead.chapterNumber) === chNum;
                const locked = isChapterLocked(chNum, user);
                return (
                  <Link
                    key={ch.id || `chap-${chNum}`}
                    to={`/manga/${mangaTarget}/chapter/${chNum}`}
                    className={`${styles.chapterItem} ${isRead ? styles.chapterItemRead : ''} ${locked ? styles.chapterItemLocked : ''}`}
                    role="listitem"
                    aria-label={`${ch.title || `${chNum}-bob`}, ${ch.pageCount || 0} sahifa${locked ? ' (Hisob talab etiladi)' : ''}`}
                    onClick={(e) => {
                      if (locked) {
                        e.preventDefault();
                        openAuthModal('signup', {
                          intendedDestination: `/manga/${mangaTarget}/chapter/${chNum}`,
                          reason: 'chapter_locked',
                          chapterNumber: chNum,
                          mangaTitle: manga.title,
                        });
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.chNum}>
                        {chNum === 0 ? '0-bob (Prolog)' : (ch.title || `${chNum}-bob`)}
                      </span>
                      {locked && (
                        <span className={styles.lockBadge} title="2-bob va undan keyingi boblarni o'qish uchun hisob talab etiladi">
                          <Lock size={11} />
                          <span>Qulflangan</span>
                        </span>
                      )}
                      {isRead && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(124,58,237,0.3)', color: '#c084fc', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          O'qilgan
                        </span>
                      )}
                    </div>
                    <span className={styles.chPages}>{ch.pageCount || 0} bet</span>
                    <span className={styles.chDate}>
                      {ch.publishedAt ? new Date(ch.publishedAt).toLocaleDateString('uz-UZ') : '—'}
                    </span>
                    {ch.isNew && <span className={styles.chNew}>YANGI</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
      {icon}
      {label}
    </span>
  );
}
