import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, Sparkles, BookOpen, Star, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { getMangaThematicProfile } from '../../assets/coverHelper.js';
import { getLastReadChapter } from '../../services/userService.js';
import { formatExternalRating } from '../../services/ratingService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isChapterLocked } from '../../utils/chapterAccess.js';
import styles from './FeaturedBanner.module.css';

// 6 seconds per slide (meets 5-7 seconds requirement)
const SLIDE_DURATION_MS = 6000;

export default function FeaturedBanner({ mangas = [] }) {
  const { user, openAuthModal } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const prevIndex = total > 1 ? (currentIndex - 1 + total) % total : 0;
  const nextIndex = total > 1 ? (currentIndex + 1) % total : 0;
  const prevManga = total > 1 ? items[prevIndex] : null;
  const nextManga = total > 1 ? items[nextIndex] : null;

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
      aria-label="Tavsiya etilgan asarlar karuseli"
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
        {/* ── Peeking Stage Track ──────────────────────────────────── */}
        <div className={styles.stageTrack}>
          {/* ── Left Peeking Slide (Previous Item Preview) ─────────── */}
          {total > 1 && prevManga && (
            <button
              type="button"
              className={`${styles.peekCard} ${styles.peekLeft}`}
              onClick={handlePrev}
              aria-label={`Oldingi asar: ${prevManga.title}`}
              title={`Oldingi: ${prevManga.title}`}
            >
              <div
                className={styles.peekCover}
                style={{ backgroundImage: `url("${prevManga.coverImage}")` }}
                aria-hidden="true"
              />
              <div className={styles.peekScrim} />
              <div className={styles.peekAction}>
                <div className={styles.peekArrowCircle}>
                  <ChevronLeft size={18} />
                </div>
                <span className={styles.peekTitle}>{prevManga.title}</span>
              </div>
            </button>
          )}

          {/* ── Center Active Compact Hero Stage Card ───────────────── */}
          <div className={styles.stageCard}>
            {/* Panoramic Ambient Backdrop */}
            <div
              className={styles.backdropArt}
              style={{ backgroundImage: `url("${coverUrl}")` }}
              aria-hidden="true"
            />
            <div className={styles.ambientGlow} aria-hidden="true" />
            <div className={styles.scrimHorizontal} aria-hidden="true" />
            <div className={styles.scrimVertical} aria-hidden="true" />

            {/* Quick Arrow Controls on Top-Right */}
            {total > 1 && (
              <div className={styles.arrowControls} aria-hidden="true">
                <button
                  type="button"
                  className={`${styles.arrowBtn} ${styles.prevArrow}`}
                  onClick={handlePrev}
                  aria-label="Oldingi tavsiya"
                  tabIndex={0}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.arrowBtn} ${styles.nextArrow}`}
                  onClick={handleNext}
                  aria-label="Keyingi tavsiya"
                  tabIndex={0}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Content & Artwork Stage Grid */}
            <div className={styles.stageGrid}>
              {/* Left Column: Editorial Info */}
              <div className={styles.contentCol}>
                {/* Badges Strip */}
                <div className={styles.badgeRow}>
                  <span className={styles.spotlightPill}>
                    <Sparkles size={12} className={styles.sparkleIcon} aria-hidden="true" />
                    TAVSIYA ETILGAN
                  </span>
                  <span className={styles.typePill}>
                    {currentManga.type ? currentManga.type.toUpperCase() : 'MANHWA'}
                  </span>
                  <span className={styles.statusPill}>
                    <span className={styles.pulsingDot} aria-hidden="true" />
                    DAVOM ETMOQDA
                  </span>
                </div>

                {/* Title & Subtitle */}
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

                {/* Metadata Row: Rating, Chapters, Author */}
                <div className={styles.metaRow}>
                  {extRating.hasRating ? (
                    <div
                      className={styles.ratingBadge}
                      title={`${extRating.source} ${extRating.score}/10 (${extRating.members})`}
                    >
                      <Star size={13} className={styles.starIcon} aria-hidden="true" />
                      <span className={styles.ratingScore}>{extRating.score}</span>
                    </div>
                  ) : (
                    <div className={styles.ratingBadge}>
                      <span className={styles.ratingMembers}>Baholanmagan</span>
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

                {/* Synopsis (Clamped for Compact Profile) */}
                <p className={styles.synopsisText}>
                  {currentManga.synopsis || "O'zbek tilidagi ajoyib sarguzasht va hayajonli jang sahnalari."}
                </p>

                {/* Genre Tags */}
                {Array.isArray(currentManga.genres) && currentManga.genres.length > 0 && (
                  <div className={styles.genresList}>
                    {currentManga.genres.slice(0, 4).map((genre) => (
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

                {/* Action CTA Buttons */}
                <div className={styles.ctaRow}>
                  <Link
                    to={`/manga/${mangaTarget}/chapter/${targetChapter}`}
                    className={`${styles.primaryCta} btn`}
                    onClick={(e) => {
                      if (isChapterLocked(targetChapter, user)) {
                        e.preventDefault();
                        openAuthModal('signup', {
                          intendedDestination: `/manga/${mangaTarget}/chapter/${targetChapter}`,
                          reason: 'chapter_locked',
                          chapterNumber: targetChapter,
                          mangaTitle: currentManga?.title,
                        });
                      }
                    }}
                  >
                    {lastRead ? (
                      <>
                        <RotateCcw size={16} aria-hidden="true" />
                        <span>O'qishni davom ettirish ({lastRead.chapterNumber}-bob)</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" aria-hidden="true" />
                        <span>Hozir o'qish ({targetChapter}-bob)</span>
                      </>
                    )}
                  </Link>

                  <Link
                    to={`/manga/${mangaTarget}`}
                    className={`${styles.secondaryCta} btn`}
                  >
                    <Bookmark size={15} aria-hidden="true" />
                    <span>Batafsil</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Prominent Artwork Frame */}
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
          </div>

          {/* ── Right Peeking Slide (Next Item Preview) ────────────── */}
          {total > 1 && nextManga && (
            <button
              type="button"
              className={`${styles.peekCard} ${styles.peekRight}`}
              onClick={handleNext}
              aria-label={`Keyingi asar: ${nextManga.title}`}
              title={`Keyingi: ${nextManga.title}`}
            >
              <div
                className={styles.peekCover}
                style={{ backgroundImage: `url("${nextManga.coverImage}")` }}
                aria-hidden="true"
              />
              <div className={styles.peekScrim} />
              <div className={styles.peekAction}>
                <div className={styles.peekArrowCircle}>
                  <ChevronRight size={18} />
                </div>
                <span className={styles.peekTitle}>{nextManga.title}</span>
              </div>
            </button>
          )}
        </div>

        {/* ── Compact Clickable Indicators & Progress Deck ────────── */}
        {total > 1 && (
          <div
            className={styles.indicatorBar}
            role="tablist"
            aria-label="Tavsiya etilgan asarlar ko'rsatkichlari"
          >
            {items.map((manga, idx) => {
              const isActive = idx === currentIndex;
              const mSlug = manga.slug || manga.id;
              return (
                <button
                  key={`${mSlug}-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${idx + 1}-tavsiya: ${manga.title}`}
                  className={`${styles.indicatorPill} ${isActive ? styles.indicatorPillActive : ''}`}
                  onClick={() => goToSlide(idx)}
                >
                  {isActive && (
                    <div
                      className={styles.pillProgressFill}
                      style={{ width: `${progress}%` }}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.pillText}>
                    <span className={styles.pillIndex}>{idx + 1}</span>
                    <span className={styles.pillTitle}>{manga.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
