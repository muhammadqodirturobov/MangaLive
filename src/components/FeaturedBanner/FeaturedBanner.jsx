import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, Sparkles, BookOpen, Star, ChevronLeft, ChevronRight, Bookmark, ArrowUpRight } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { getMangaThematicProfile } from '../../assets/coverHelper.js';
import { getLastReadChapter } from '../../services/userService.js';
import { formatExternalRating } from '../../services/ratingService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isChapterLocked } from '../../utils/chapterAccess.js';
import styles from './FeaturedBanner.module.css';

// 6 seconds per rotation (meets requirement)
const SLIDE_DURATION_MS = 6000;
// Pool of 6-7 popular manga
const MAX_POOL_SIZE = 7;

/**
 * SecondaryMangaCard — 1-unit secondary preview card.
 * Sized identically to the main cover artwork, visually quieter with essential info.
 * Clicking promotes this manga to the main 3-unit featured position.
 */
function SecondaryMangaCard({ manga, index, onSelect, position = 'right', className = '' }) {
  if (!manga) return null;
  const slug = manga.slug || manga.id;
  const rating = formatExternalRating(slug);
  const chapters = Number(manga.availableChapters ?? manga.chapters ?? manga.lastChapter ?? 0);
  const isLeft = position === 'left';

  return (
    <button
      type="button"
      className={`${styles.secondaryCard} ${isLeft ? styles.leftPreviewCard : styles.rightPreviewCard} ${className}`}
      onClick={() => onSelect(index)}
      aria-label={`${manga.title} asarini asosiy ko'rinishga o'tkazish`}
      title={`${manga.title} — asosiy ko'rinishga o'tkazish uchun bosing`}
    >
      <div className={styles.secondaryCoverBg}>
        <CoverImage
          src={manga.coverImage}
          alt={`${manga.title} muqovasi`}
          title={manga.title}
          type={manga.type}
          loading="lazy"
          className={styles.coverImageFill}
        />
      </div>
      <div className={`${styles.secondaryScrim} ${isLeft ? styles.leftScrim : ''}`} aria-hidden="true" />

      {/* Left peek indicator */}
      {isLeft && (
        <div className={styles.leftPeekIndicator} aria-hidden="true">
          <ChevronLeft size={14} />
          <span>Oldingi</span>
        </div>
      )}

      {/* Top badges */}
      <div className={styles.secondaryTopRow}>
        <div className={styles.secondaryChaptersBadge}>
          <BookOpen size={11} aria-hidden="true" />
          <span>{chapters} bob</span>
        </div>
        {rating.hasRating && (
          <div
            className={styles.secondaryRatingBadge}
            title={`${rating.source} ${rating.score}/10`}
          >
            <Star size={11} className={styles.secondaryStarIcon} aria-hidden="true" />
            <span>{rating.score}</span>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className={styles.secondaryBottom}>
        <span className={styles.secondaryType}>
          {manga.type ? manga.type.toUpperCase() : 'MANHWA'}
        </span>
        <h3 className={styles.secondaryTitle}>{manga.title}</h3>
        <div className={styles.secondaryCue} aria-hidden="true">
          <ArrowUpRight size={13} />
          <span>Tanlash</span>
        </div>
      </div>
    </button>
  );
}

export default function FeaturedBanner({ mangas = [] }) {
  const { user, openAuthModal } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Normalize and maintain pool of 6-7 popular manga
  const rawItems = Array.isArray(mangas) && mangas.length > 0
    ? mangas
    : mangas ? [mangas] : [];

  const pool = rawItems.slice(0, Math.min(rawItems.length, MAX_POOL_SIZE));
  const total = pool.length;

  const currentManga = pool[currentIndex] || null;
  const currentSlug = currentManga?.slug || currentManga?.id || '';
  const theme = getMangaThematicProfile(currentSlug);

  // 1 : 3 : 1 : 1 layout positions
  // Left preview: 1 item before active
  const leftIndex = total > 1 ? (currentIndex - 1 + total) % total : 0;
  // Right previews: next 2 items in clockwise rotation
  const right1Index = total > 1 ? (currentIndex + 1) % total : 0;
  const right2Index = total > 2 ? (currentIndex + 2) % total : 0;

  const leftManga = total > 1 ? pool[leftIndex] : null;
  const right1Manga = total > 1 ? pool[right1Index] : null;
  const right2Manga = total > 2 ? pool[right2Index] : null;

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
        {/* ── 1 : 3 : 1 : 1 Composition Carousel Track ────────────── */}
        <div className={styles.carouselTrack}>
          {/* 1. Left Preview — 1 unit (Partially visible at left edge) ─ */}
          {leftManga && (
            <SecondaryMangaCard
              manga={leftManga}
              index={leftIndex}
              onSelect={goToSlide}
              position="left"
              className={styles.leftPreviewColumn}
            />
          )}

          {/* 2. Main Featured Area — 3 units (2 units Info + 1 unit Cover) */}
          <div className={styles.mainFeaturedCard}>
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
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.arrowBtn} ${styles.nextArrow}`}
                  onClick={handleNext}
                  aria-label="Keyingi tavsiya"
                  tabIndex={0}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Main Feature Internal Grid: 2 units Info + 1 unit Cover */}
            <div className={styles.mainCardGrid}>
              {/* Left Info Panel (2 units) */}
              <div className={styles.infoPanel}>
                {/* Badges Strip */}
                <div className={styles.badgeRow}>
                  <span className={styles.spotlightPill}>
                    <Sparkles size={11} className={styles.sparkleIcon} aria-hidden="true" />
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
                  <h1 className={styles.heroTitle}>{currentManga.title}</h1>
                  {currentManga.titleEn && currentManga.titleEn.trim() && (
                    <span className={styles.heroSubtitle}>{currentManga.titleEn.trim()}</span>
                  )}
                </div>

                {/* Metadata Row: Rating, Chapters, Author */}
                <div className={styles.metaRow}>
                  {extRating.hasRating ? (
                    <div
                      className={styles.ratingBadge}
                      title={`${extRating.source} ${extRating.score}/10 (${extRating.members})`}
                    >
                      <Star size={12} className={styles.starIcon} aria-hidden="true" />
                      <span className={styles.ratingScore}>{extRating.score}</span>
                    </div>
                  ) : (
                    <div className={styles.ratingBadge}>
                      <span className={styles.ratingMembers}>Baholanmagan</span>
                    </div>
                  )}

                  <div className={styles.chaptersBadge}>
                    <BookOpen size={12} aria-hidden="true" />
                    <span>{availableChapters} ta bob mavjud</span>
                  </div>

                  {currentManga.author && (
                    <span className={styles.authorBadge}>
                      <span>{currentManga.author}</span>
                    </span>
                  )}
                </div>

                {/* Synopsis */}
                <p className={styles.synopsisText}>
                  {currentManga.synopsis || "O'zbek tilidagi ajoyib sarguzasht va hayajonli voqealar rivoji."}
                </p>

                {/* Genres */}
                {Array.isArray(currentManga.genres) && currentManga.genres.length > 0 && (
                  <div className={styles.genresList}>
                    {currentManga.genres.slice(0, 3).map((genre) => (
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
                        <RotateCcw size={15} aria-hidden="true" />
                        <span>O'qish ({lastRead.chapterNumber}-bob)</span>
                      </>
                    ) : (
                      <>
                        <Play size={15} fill="currentColor" aria-hidden="true" />
                        <span>Hozir o'qish ({targetChapter}-bob)</span>
                      </>
                    )}
                  </Link>

                  <Link to={`/manga/${mangaTarget}`} className={`${styles.secondaryCta} btn`}>
                    <Bookmark size={14} aria-hidden="true" />
                    <span>Batafsil</span>
                  </Link>
                </div>
              </div>

              {/* Right Cover Panel (1 unit — Sized identically to secondary covers!) */}
              <div className={styles.coverPanel} aria-hidden="true">
                <div className={styles.coverFrame}>
                  <CoverImage
                    src={coverUrl}
                    alt={`${currentManga.title} muqovasi`}
                    title={currentManga.title}
                    type={currentManga.type}
                    priority={true}
                    fetchpriority="high"
                    className={styles.coverImageFill}
                  />
                  <div className={styles.artworkGlassSheen} />
                  <div className={styles.coverFloatingBadge}>
                    <span className={styles.badgePulse} />
                    <span>{availableChapters} bob</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Right Preview 1 — 1 unit ──────────────────────────── */}
          {right1Manga && (
            <SecondaryMangaCard
              manga={right1Manga}
              index={right1Index}
              onSelect={goToSlide}
              position="right"
              className={styles.rightPreview1Column}
            />
          )}

          {/* 4. Right Preview 2 — 1 unit ──────────────────────────── */}
          {right2Manga && (
            <SecondaryMangaCard
              manga={right2Manga}
              index={right2Index}
              onSelect={goToSlide}
              position="right"
              className={styles.rightPreview2Column}
            />
          )}
        </div>

        {/* ── Mobile Touch-Scrollable Previews Row (Only on Mobile) ── */}
        <div className={styles.mobilePreviewsRow} aria-label="Boshqa tavsiyalar">
          {pool.map((manga, idx) => {
            if (idx === currentIndex) return null;
            const slug = manga.slug || manga.id;
            const rating = formatExternalRating(slug);
            const chapters = Number(manga.availableChapters ?? manga.chapters ?? manga.lastChapter ?? 0);
            return (
              <button
                key={`mobile-preview-${slug}-${idx}`}
                type="button"
                className={styles.mobilePreviewItem}
                onClick={() => goToSlide(idx)}
                aria-label={`${manga.title} asarini tanlash`}
              >
                <div className={styles.mobilePreviewCover}>
                  <CoverImage
                    src={manga.coverImage}
                    alt={manga.title}
                    title={manga.title}
                    type={manga.type}
                    loading="lazy"
                    className={styles.coverImageFill}
                  />
                  <div className={styles.mobilePreviewScrim} />
                  {rating.hasRating && (
                    <span className={styles.mobilePreviewRating}>
                      ⭐ {rating.score}
                    </span>
                  )}
                  <span className={styles.mobilePreviewChapters}>
                    {chapters} bob
                  </span>
                </div>
                <span className={styles.mobilePreviewTitle}>{manga.title}</span>
              </button>
            );
          })}
        </div>

        {/* ── Clickable Indicators & Progress Deck ────────────────── */}
        {total > 1 && (
          <div
            className={styles.indicatorBar}
            role="tablist"
            aria-label="Tavsiya etilgan asarlar ko'rsatkichlari"
          >
            {pool.map((manga, idx) => {
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
