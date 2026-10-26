import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, Sparkles, BookOpen, Star, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { getMangaThematicProfile } from '../../assets/coverHelper.js';
import { getLastReadChapter } from '../../services/userService.js';
import { formatExternalRating } from '../../services/ratingService.js';
import styles from './FeaturedBanner.module.css';

const SLIDE_DURATION_MS = 6500;

export default function FeaturedBanner({ mangas = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Normalize items
  const items = Array.isArray(mangas) && mangas.length > 0
    ? mangas
    : mangas ? [mangas] : [];
  const total = items.length;

  const currentManga = items[currentIndex] || null;
  const currentSlug = currentManga?.slug || currentManga?.id || '';
  const theme = getMangaThematicProfile(currentSlug);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const handlePrev = useCallback(() => {
    goToSlide((currentIndex - 1 + total) % total);
  }, [currentIndex, total, goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide((currentIndex + 1) % total);
  }, [currentIndex, total, goToSlide]);

  // Handle timer & progress bar
  useEffect(() => {
    if (total <= 1 || isPaused || prefersReducedMotion) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= SLIDE_DURATION_MS) {
        goToSlide((currentIndex + 1) % total);
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, total, isPaused, prefersReducedMotion, goToSlide]);

  if (!currentManga) return null;

  const extRating = formatExternalRating(currentSlug);
  const lastRead = getLastReadChapter(currentManga.id) || (currentManga.slug ? getLastReadChapter(currentManga.slug) : null);
  const availableChapters = Number(currentManga.availableChapters ?? currentManga.chapters ?? currentManga.lastChapter ?? 0);
  const targetChapter = lastRead
    ? Math.min(Math.max(1, Number(lastRead.chapterNumber) || 1), Math.max(1, availableChapters))
    : 1;

  const coverUrl = currentManga.coverImage || '';
  const mangaTarget = currentManga.slug || currentManga.id;

  return (
    <section
      className={styles.heroSection}
      aria-label="Tavsiya etilgan bosh asarlar"
      style={{
        '--hero-accent': theme.accent,
        '--hero-glow': theme.glow,
        '--hero-color-1': theme.palette[0],
        '--hero-color-2': theme.palette[1],
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.stageCard}>
          {/* ── 1. Panoramic Ambient Backdrop ──────────────────────── */}
          <div
            className={styles.backdropArt}
            style={{ backgroundImage: `url("${coverUrl}")` }}
            aria-hidden="true"
          />
          <div className={styles.ambientGlow} aria-hidden="true" />
          <div className={styles.scrimHorizontal} aria-hidden="true" />
          <div className={styles.scrimVertical} aria-hidden="true" />

          {/* ── 2. Arrow Navigation Controls (Desktop) ─────────────── */}
          {total > 1 && (
            <div className={styles.arrowControls} aria-hidden="true">
              <button
                type="button"
                className={`${styles.arrowBtn} ${styles.prevArrow}`}
                onClick={handlePrev}
                aria-label="Oldingi tavsiya"
                tabIndex={0}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className={`${styles.arrowBtn} ${styles.nextArrow}`}
                onClick={handleNext}
                aria-label="Keyingi tavsiya"
                tabIndex={0}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}

          {/* ── 3. Main Split Stage Layout ──────────────────────────── */}
          <div className={styles.stageGrid}>
            {/* ── Left Column: Editorial & Action Showcase ─────────── */}
            <div className={styles.contentCol}>
              {/* Badges Strip */}
              <div className={styles.badgeRow}>
                <span className={styles.spotlightPill}>
                  <Sparkles size={13} className={styles.sparkleIcon} aria-hidden="true" />
                  HAFTANING ASOSIY TANLOVI
                </span>
                <span className={styles.typePill}>
                  {currentManga.type ? currentManga.type.toUpperCase() : 'MANHWA'}
                </span>
                <span className={styles.statusPill}>
                  <span className={styles.pulsingDot} aria-hidden="true" />
                  DAVOM ETMOQDA
                </span>
              </div>

              {/* Title & International Subtitle */}
              <div className={styles.titleGroup}>
                <h1 className={styles.heroTitle}>
                  {currentManga.title}
                </h1>
                {currentManga.titleEn && currentManga.titleEn.trim() && (
                  <span className={styles.heroSubtitle}>
                    {currentManga.titleEn.trim()}
                  </span>
                )}
              </div>

              {/* Metadata row: Rating, Chapters, Author */}
              <div className={styles.metaRow}>
                {extRating.hasRating ? (
                  <div
                    className={styles.ratingBadge}
                    title={`${extRating.badge} — ${extRating.members}`}
                  >
                    <Star size={14} className={styles.starIcon} aria-hidden="true" />
                    <span className={styles.ratingScore}>{extRating.score}</span>
                    <span className={styles.ratingScale}>/10</span>
                    <span className={styles.ratingMembers}>({extRating.members})</span>
                  </div>
                ) : (
                  <div className={styles.ratingBadge}>
                    <span className={styles.ratingMembers}>AniList Baholanmagan</span>
                  </div>
                )}

                <div className={styles.chaptersBadge}>
                  <BookOpen size={13} aria-hidden="true" />
                  <span>{availableChapters} ta bob mavjud</span>
                </div>

                {currentManga.author && (
                  <span className={styles.authorBadge}>
                    <span>{currentManga.author}</span>
                  </span>
                )}
              </div>

              {/* Uzbek Synopsis */}
              <p className={styles.synopsisText}>
                {currentManga.synopsis || "O'zbek tilidagi ajoyib sarguzasht va hayajonli jang sahnalari."}
              </p>

              {/* Genre Tags */}
              {Array.isArray(currentManga.genres) && currentManga.genres.length > 0 && (
                <div className={styles.genresList}>
                  {currentManga.genres.slice(0, 5).map((genre) => (
                    <Link
                      key={genre}
                      to={`/katalog?janr=${encodeURIComponent(genre)}`}
                      className={styles.genrePill}
                    >
                      #{genre}
                    </Link>
                  ))}
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className={styles.ctaRow}>
                <Link
                  to={`/manga/${mangaTarget}/chapter/${targetChapter}`}
                  className={`${styles.primaryCta} btn`}
                >
                  {lastRead ? (
                    <>
                      <RotateCcw size={18} aria-hidden="true" />
                      <span>O'qishni davom ettirish ({lastRead.chapterNumber}-bob)</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" aria-hidden="true" />
                      <span>Hozir o'qish ({targetChapter}-bob)</span>
                    </>
                  )}
                </Link>

                <Link
                  to={`/manga/${mangaTarget}`}
                  className={`${styles.secondaryCta} btn`}
                >
                  <Bookmark size={16} aria-hidden="true" />
                  <span>Batafsil ma'lumot</span>
                </Link>
              </div>
            </div>

            {/* ── Right Column: 3D Grand Artwork Showcase ──────────── */}
            <div className={styles.artworkCol} aria-hidden="true">
              <div className={styles.artworkPerspective}>
                <div className={styles.artworkGlow} />
                <div className={styles.artworkFrame}>
                  <CoverImage
                    src={coverUrl}
                    alt={`${currentManga.title} muqovasi`}
                    title={currentManga.title}
                    type={currentManga.type}
                    priority={true}
                    fetchpriority="high"
                  />
                  <div className={styles.artworkGlassSheen} />
                  <div className={styles.coverFloatingBadge}>
                    <span className={styles.badgePulse} />
                    <span>{availableChapters} ta bob</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Interactive Slide Switcher / Thumbnail Deck ──────── */}
          {total > 1 && (
            <div
              className={styles.switcherDeck}
              role="tablist"
              aria-label="Tavsiya etilgan asarlar ro'yxati"
            >
              {items.map((manga, idx) => {
                const isActive = idx === currentIndex;
                const mSlug = manga.slug || manga.id;
                const mRating = formatExternalRating(mSlug);

                return (
                  <button
                    key={`${mSlug}-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${idx + 1}-tavsiya: ${manga.title}`}
                    className={`${styles.switcherTab} ${isActive ? styles.switcherTabActive : ''}`}
                    onClick={() => goToSlide(idx)}
                  >
                    {/* Progress Fill Line on Active Tab */}
                    {isActive && (
                      <div
                        className={styles.tabProgressFill}
                        style={{ width: `${progress}%` }}
                        aria-hidden="true"
                      />
                    )}

                    <div className={styles.tabThumb}>
                      <img
                        src={manga.coverImage}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={styles.tabThumbImg}
                      />
                    </div>

                    <div className={styles.tabInfo}>
                      <span className={styles.tabTitle}>{manga.title}</span>
                      <div className={styles.tabMeta}>
                        {mRating.hasRating && (
                          <span className={styles.tabScore}>★ {mRating.score}</span>
                        )}
                        <span className={styles.tabCh}>
                          {manga.availableChapters ?? manga.chapters ?? 0} bob
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
