import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Sparkles, TrendingUp, ChevronLeft, ChevronRight, RotateCcw, Star } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { buildFeaturedBannerArtwork } from '../../assets/coverHelper.js';
import { getLastReadChapter } from '../../services/userService.js';
import { formatExternalRating } from '../../services/ratingService.js';
import styles from './FeaturedBanner.module.css';

export default function FeaturedBanner({ mangas = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Normalize input: can be array or single manga object
  const items = Array.isArray(mangas) && mangas.length > 0
    ? mangas
    : mangas ? [mangas] : [];

  const total = items.length;
  const currentManga = items[currentIndex] || null;

  // Auto-rotation every 6 seconds, paused when hovering or controls focused
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  if (!currentManga) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const artworkSrc = currentManga.bannerImage || currentManga.coverImage || buildFeaturedBannerArtwork(currentManga);
  const stars = Math.round(currentManga.rating);

  return (
    <section
      className={styles.bannerSection}
      aria-label="Tavsiya etilgan bosh asarlar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className={`container ${styles.bannerContainer}`}>
        <div className={styles.bannerCard}>
          {/* Wide Landscape Artwork Background filling right side */}
          <div
            className={styles.bannerArtwork}
            style={{ backgroundImage: `url("${artworkSrc}")` }}
            aria-hidden="true"
          />

          {/* Deep dark gradient overlay towards the left */}
          <div className={styles.bannerScrim} aria-hidden="true" />

          {/* Manual Previous/Next Controls (visible on desktop) */}
          {total > 1 && (
            <>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.prevBtn}`}
                onClick={handlePrev}
                aria-label="Oldingi tavsiya"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.nextBtn}`}
                onClick={handleNext}
                aria-label="Keyingi tavsiya"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Content Layer */}
          <div className={styles.bannerContent}>
            {/* Badges row */}
            <div className={styles.topBadges}>
              <span className={styles.spotlightBadge}>
                <Sparkles size={13} aria-hidden="true" />
                HAFTANING TANLANGANI
              </span>
              <span className={styles.typeBadge}>
                {currentManga.type?.toUpperCase()}
              </span>
              {currentManga.featuredTagline && (
                <span className={styles.taglineBadge}>
                  <TrendingUp size={13} aria-hidden="true" />
                  {currentManga.featuredTagline}
                </span>
              )}
            </div>

            {/* Title & Headline */}
            <h1 className={styles.bannerTitle}>
              {currentManga.title}
            </h1>
            {currentManga.titleEn && currentManga.titleEn.trim() && (
              <span className={styles.bannerTitleEn}>
                {currentManga.titleEn.trim()}
              </span>
            )}

            {/* Author & Rating row */}
            <div className={styles.metaRow}>
              <span className={styles.authorTag}>
                <BookOpen size={14} aria-hidden="true" />
                {currentManga.author}
              </span>

              {(() => {
                const extRating = formatExternalRating(currentManga.slug || currentManga.id);
                return extRating.hasRating ? (
                  <div className={styles.ratingBadge} title={`${extRating.badge} · ${extRating.members}`}>
                    <Star size={13} style={{ color: '#fbbf24', fill: '#fbbf24' }} aria-hidden="true" />
                    <span className={styles.ratingScore}>{extRating.score}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>/10</span>
                    <span className={styles.ratingVoters}>({extRating.members})</span>
                  </div>
                ) : (
                  <div className={styles.ratingBadge}>
                    <span className={styles.ratingVoters}>Baholanmagan</span>
                  </div>
                );
              })()}
            </div>

            {/* Synopsis */}
            <p className={styles.synopsis}>
              {currentManga.synopsis}
            </p>

            {/* Genre tags */}
            <div className={styles.genresList}>
              {currentManga.genres?.map((g) => (
                <Link
                  key={g}
                  to={`/katalog?janr=${g}`}
                  className={styles.genrePill}
                >
                  #{g}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className={styles.ctaRow}>
              {(() => {
                const mangaTarget = currentManga.slug || currentManga.id;
                const lastRead = getLastReadChapter(currentManga.id) || (currentManga.slug ? getLastReadChapter(currentManga.slug) : null);
                const maxAvailable = Number(currentManga.availableChapters ?? currentManga.chapters ?? currentManga.lastChapter ?? 1);
                const targetChapter = lastRead
                  ? Math.min(Math.max(1, Number(lastRead.chapterNumber) || 1), maxAvailable)
                  : 1;

                return (
                  <>
                    <Link
                      to={`/manga/${mangaTarget}/chapter/${targetChapter}`}
                      className={`btn btn-primary ${styles.primaryCta}`}
                    >
                      {lastRead ? (
                        <>
                          <RotateCcw size={16} aria-hidden="true" />
                          O'qishni davom ettirish ({lastRead.chapterNumber}-bob)
                        </>
                      ) : (
                        <>
                          <Play size={16} fill="currentColor" aria-hidden="true" />
                          O'qishni boshlash ({targetChapter}-bob)
                        </>
                      )}
                    </Link>
                    <Link
                      to={`/manga/${mangaTarget}`}
                      className={`btn btn-outline ${styles.secondaryCta}`}
                    >
                      Batafsil ma'lumot
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right Floating Manga Book Cover */}
          <div className={styles.coverSide} aria-hidden="true">
            <div className={styles.coverGlow} />
            <div className={styles.coverWrapper}>
              <div className={styles.coverBook}>
                <CoverImage
                  src={currentManga.coverImage}
                  alt={`${currentManga.title} muqovasi`}
                  title={currentManga.title}
                  type={currentManga.type}
                  priority={true}
                />
              </div>
            </div>
            <div className={styles.coverFloatingPill}>
              <span className={styles.pillNum}>{currentManga.lastChapter}</span>
              <span className={styles.pillText}>-bob yangilandi</span>
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          {total > 1 && (
            <div className={styles.dotsBar} role="tablist" aria-label="Tavsiyalar varaqlari">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`${idx + 1}-tavsiya`}
                  className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
