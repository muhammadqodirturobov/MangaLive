import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  List, BookOpen, AlertCircle, Maximize2, Minimize2,
  ZoomIn, ZoomOut, RefreshCw
} from 'lucide-react';
import { getCachedManga, fetchMangaById } from '../services/mangaService.js';
import { getCachedChapters, fetchChapters, fetchChapterPages } from '../services/chapterService.js';
import { recordReadingProgress } from '../services/userService.js';
import { recordChapterOpen } from '../services/analyticsService.js';
import { recordGuestChapterRead } from '../components/GuestPrompt/GuestPrompt.jsx';
import { navigateBackFromReader } from '../utils/navigationTracker.js';
import styles from './ReaderPage.module.css';

const WIDTH_OPTIONS = [
  { id: 'fit', label: 'Asl (720px)', maxPx: 720 },
  { id: 'wide', label: 'Keng (960px)', maxPx: 960 },
  { id: 'narrow', label: 'Ixcham (640px)', maxPx: 640 },
];

export default function ReaderPage() {
  const { id, chapterNumber } = useParams();
  const navigate = useNavigate();
  const chNum = parseInt(chapterNumber, 10);

  const handleBackToManga = useCallback(() => {
    navigateBackFromReader(navigate, id);
  }, [navigate, id]);

  // Check cache first to avoid flashing false 404
  const cachedManga = getCachedManga(id);
  const cachedChapters = cachedManga ? getCachedChapters(cachedManga.id) : null;

  const [manga, setManga] = useState(cachedManga || null);
  const [chapters, setChapters] = useState(cachedChapters || []);
  const [loading, setLoading] = useState(!cachedManga || !cachedChapters);
  const [error, setError] = useState(null);

  // Chapter navigation targets
  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
  const currentIndex = sortedChapters.findIndex((c) => c.number === chNum);
  const chapter = sortedChapters.find((c) => c.number === chNum) || null;
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // Pages state (real pages only)
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);

  // Reader settings
  const [pageWidthMode, setPageWidthMode] = useState('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // 1. Load manga and chapter list
  const loadReaderData = useCallback(async () => {
    setError(null);
    if (!cachedManga || !cachedChapters) {
      setLoading(true);
    }

    try {
      const remoteManga = await fetchMangaById(id);
      if (!remoteManga) {
        setManga(null);
        setChapters([]);
        setLoading(false);
        return;
      }

      setManga(remoteManga);

      const remoteChapters = await fetchChapters(remoteManga.id);
      setChapters(remoteChapters || []);
    } catch (err) {
      console.error('[ReaderPage] Remote load error:', err);
      setError(err.message || 'Boblar ro\'yxatini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [id, cachedManga, cachedChapters]);

  useEffect(() => {
    loadReaderData();
  }, [loadReaderData]);

  // 2. Load live chapter pages when chapter is resolved
  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      if (!chapter?.id) {
        setPages([]);
        setPagesLoading(false);
        return;
      }

      setPagesLoading(true);
      try {
        const livePages = await fetchChapterPages(chapter.id);
        if (!cancelled) {
          setPages(livePages || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ReaderPage] Failed to fetch live pages:', err);
        }
      } finally {
        if (!cancelled) {
          setPagesLoading(false);
        }
      }
    }

    loadPages();
    return () => {
      cancelled = true;
    };
  }, [chapter?.id]);

  // 3. Record verified chapter open and guest progress counter
  useEffect(() => {
    if (manga && !Number.isNaN(chNum)) {
      recordChapterOpen(manga.id, chNum, manga.slug);
      recordGuestChapterRead();
    }
  }, [manga?.id, chNum]);

  // 4. Auto-record reading history
  useEffect(() => {
    if (manga && !Number.isNaN(chNum)) {
      const totalChs = Number(manga.availableChapters ?? manga.chapters ?? manga.chapters_count ?? 0);
      recordReadingProgress(
        manga.id,
        manga.title,
        chNum,
        readingProgress,
        manga.slug,
        manga.coverImage || '',
        totalChs
      );
    }
  }, [manga, chNum, readingProgress]);

  // Track vertical scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((window.scrollY / scrollHeight) * 100)));
        setReadingProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleBackToManga();
        }
      } else if (e.key === 'ArrowLeft' && prevChapter) {
        navigate(`/manga/${manga?.slug || id}/chapter/${prevChapter.number}`, { replace: true });
        window.scrollTo(0, 0);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        navigate(`/manga/${manga?.slug || id}/chapter/${nextChapter.number}`, { replace: true });
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, manga, prevChapter, nextChapter, navigate, isFullscreen, handleBackToManga]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Loading state (prevents premature 404!)
  if (loading) {
    return (
      <main className={styles.readerRoot}>
        <div className={styles.loadingContainer}>
          <RefreshCw size={28} className={styles.spinning} />
          <p>Bob ma'lumotlari yuklanmoqda...</p>
        </div>
      </main>
    );
  }

  // Network / server error (recoverable)
  if (error && !manga) {
    return (
      <main className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h1>Ulanishda xatolik yuz berdi</h1>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={loadReaderData}>
            <RefreshCw size={14} />
            <span>Qayta urinish</span>
          </button>
        </div>
      </main>
    );
  }

  // Genuine 404 (only after completed fetch confirming manga does not exist)
  if (!manga) {
    return (
      <main className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h1>Manga topilmadi</h1>
          <p>Ushbu sarlavha mavjud emas yoki tizimdan olib tashlangan.</p>
          <Link to="/" className="btn btn-primary">Bosh sahifaga qaytish</Link>
        </div>
      </main>
    );
  }

  // Genuine chapter not found (only after chapters list is fully loaded)
  if (!chapter) {
    return (
      <main className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h1>{chNum === 0 ? '0-bob (Prolog)' : `${chNum}-bob`} mavjud emas</h1>
          <p>Bu bob hozircha yuklanmagan yoki ma'lumotlar bazasida yo'q.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleBackToManga}
              className="btn btn-primary"
            >
              Manga sahifasiga qaytish
            </button>
            {sortedChapters.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  navigate(`/manga/${manga.slug || manga.id}/chapter/${sortedChapters[0].number}`, { replace: true });
                  window.scrollTo(0, 0);
                }}
                className="btn btn-outline"
              >
                {sortedChapters[0].number === 0 ? '0-bob (Prolog)' : `${sortedChapters[0].number}-bob`}dan boshlash
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const activeWidthConfig = WIDTH_OPTIONS.find((w) => w.id === pageWidthMode) || WIDTH_OPTIONS[0];

  return (
    <div className={styles.readerRoot}>
      {/* ── Sticky Top Bar ────────────────────────────────────────── */}
      <header className={styles.readerHeader} role="banner">
        {/* Left: Back button & Manga Title */}
        <div className={styles.headerLeft}>
          <button
            type="button"
            onClick={handleBackToManga}
            className={styles.backBtn}
            title={`${manga.title} sahifasiga qaytish`}
            aria-label={`${manga.title} sahifasiga qaytish`}
          >
            <ArrowLeft size={16} />
            <span className={styles.backText}>{manga.title}</span>
          </button>
          <span className={styles.chapterTag}>
            {chapter.number === 0 ? '0-bob (Prolog)' : `${chapter.number}-bob`}
          </span>
        </div>

        {/* Center: Chapter navigation selector */}
        <div className={styles.headerCenter}>
          <div className={styles.chapterNavGroup}>
            <button
              type="button"
              className={styles.iconNavBtn}
              disabled={!prevChapter}
              onClick={() => {
                if (prevChapter) {
                  navigate(`/manga/${manga.slug || manga.id}/chapter/${prevChapter.number}`, { replace: true });
                  window.scrollTo(0, 0);
                }
              }}
              title={prevChapter ? `Oldingi bob: ${prevChapter.number}-bob` : "Birinchi bob"}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className={styles.chapterSelectorBtn}
              onClick={() => setShowChapterMenu((prev) => !prev)}
              aria-expanded={showChapterMenu}
              aria-label="Boblar ro'yxatini ochish"
            >
              <List size={14} />
              <span>{chapter.number === 0 ? '0-bob (Prolog)' : `${chapter.number}-bob`}</span>
            </button>

            <button
              type="button"
              className={styles.iconNavBtn}
              disabled={!nextChapter}
              onClick={() => {
                if (nextChapter) {
                  navigate(`/manga/${manga.slug || manga.id}/chapter/${nextChapter.number}`, { replace: true });
                  window.scrollTo(0, 0);
                }
              }}
              title={nextChapter ? `Keyingi bob: ${nextChapter.number}-bob` : "Oxirgi bob"}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Width and fullscreen settings */}
        <div className={styles.headerRight}>
          <div className={styles.widthToggleGroup} role="radiogroup" aria-label="Sahifa kengligi">
            {WIDTH_OPTIONS.map((w) => (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={pageWidthMode === w.id}
                className={`${styles.widthBtn} ${pageWidthMode === w.id ? styles.widthBtnActive : ''}`}
                onClick={() => setPageWidthMode(w.id)}
                title={`${w.label} kenglik (${w.maxPx}px)`}
              >
                {w.id === 'narrow' ? <ZoomOut size={13} /> : w.id === 'wide' ? <ZoomIn size={13} /> : <BookOpen size={13} />}
                <span>{w.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.fullscreenBtn}
            onClick={toggleFullscreen}
            title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
            aria-label={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── Reading Progress Bar ──────────────────────────────────── */}
      <div className={styles.readingProgressBarWrapper} aria-hidden="true">
        <div
          className={styles.readingProgressBar}
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* ── Chapter Menu Modal / Dropdown ─────────────────────────── */}
      {showChapterMenu && (
        <div
          className={styles.chapterMenuOverlay}
          onClick={() => setShowChapterMenu(false)}
        >
          <div
            className={styles.chapterMenuModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Boblar ro'yxati"
          >
            <div className={styles.chapterMenuHeader}>
              <h3 className={styles.chapterMenuTitle}>
                {manga.title} — Boblar ({chapters.length})
              </h3>
              <button
                type="button"
                className={styles.closeMenuBtn}
                onClick={() => setShowChapterMenu(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.chapterMenuList}>
              {sortedChapters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.chapterMenuItem} ${c.number === chNum ? styles.activeChapterItem : ''}`}
                  onClick={() => {
                    navigate(`/manga/${manga.slug || manga.id}/chapter/${c.number}`, { replace: true });
                    setShowChapterMenu(false);
                    window.scrollTo(0, 0);
                  }}
                >
                  <div className={styles.menuItemLeft}>
                    <span className={styles.menuItemNumber}>
                      {c.number === 0 ? '0-bob (Prolog)' : `${c.number}-bob`}
                    </span>
                    <span className={styles.menuItemTitle}>{c.title}</span>
                  </div>
                  <span className={styles.menuItemPages}>
                    {c.pageCount || 0} bet
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Vertical Comic Strip Canvas ──────────────────────── */}
      <main className={styles.canvasContainer}>
        <div
          className={styles.verticalPageColumn}
          style={{ maxWidth: `${activeWidthConfig.maxPx}px` }}
        >
          {pagesLoading ? (
            <div className={styles.loadingContainer}>
              <RefreshCw size={24} className={styles.spinning} />
              <p>Sahifalar yuklanmoqda...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className={styles.emptyPagesNotice}>
              <BookOpen size={36} style={{ color: '#a855f7' }} />
              <h3>Sahifalar hali yuklanmagan</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                Ushbu bob ({chapter.number === 0 ? '0-bob' : `${chapter.number}-bob`}) uchun sahifa rasmlari hali serverga yuklanmagan.
              </p>
              {nextChapter && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/manga/${manga.slug || manga.id}/chapter/${nextChapter.number}`, { replace: true });
                    window.scrollTo(0, 0);
                  }}
                  className="btn btn-primary"
                >
                  Keyingi bobga o'tish ({nextChapter.number}-bob)
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            pages.map((p, idx) => (
              <div key={p.id || idx} className={styles.pageFrame}>
                <img
                  src={p.imageUrl || p.src || p.image_url}
                  alt={`${manga.title} - ${chapter.number}-bob, ${p.pageNumber}-sahifa`}
                  className={styles.comicPageImage}
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <div className={styles.pageNumberIndicator} aria-hidden="true">
                  {p.pageNumber || idx + 1} / {pages.length}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ── Chapter Bottom Navigation Bar ─────────────────────────── */}
      <nav className={styles.chapterBottomNav} aria-label="Bob navigatsiyasi">
        <div
          className={styles.bottomNavContainer}
          style={{ maxWidth: `${activeWidthConfig.maxPx}px` }}
        >
          <div className={styles.bottomButtonsRow}>
            {prevChapter ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  navigate(`/manga/${manga.slug || manga.id}/chapter/${prevChapter.number}`, { replace: true });
                  window.scrollTo(0, 0);
                }}
              >
                <ChevronLeft size={16} />
                <span>Oldingi: {prevChapter.number === 0 ? '0-bob (Prolog)' : `${prevChapter.number}-bob`}</span>
              </button>
            ) : (
              <span className={styles.disabledNavLabel}>Eng birinchi bob</span>
            )}

            <button
              type="button"
              onClick={handleBackToManga}
              className="btn btn-outline"
            >
              <List size={15} />
              <span>Manga sahifasi</span>
            </button>

            {nextChapter ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  navigate(`/manga/${manga.slug || manga.id}/chapter/${nextChapter.number}`, { replace: true });
                  window.scrollTo(0, 0);
                }}
              >
                <span>Keyingi: {nextChapter.number === 0 ? '0-bob (Prolog)' : `${nextChapter.number}-bob`}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <span className={styles.disabledNavLabel}>Eng so'nggi bob</span>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
