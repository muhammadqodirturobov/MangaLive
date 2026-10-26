import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { formatExternalRating } from '../../services/ratingService.js';
import styles from './MangaCarousel.module.css';

export default function MangaCarousel({
  title,
  mangas = [],
  rightAction,
  subtitle,
  showRank = false,
}) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const distance = direction === 'left' ? -380 : 380;
    scrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section className={styles.section} aria-label={title}>
      {/* ── Section Header ───────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>

        <div className={styles.controlsWrap}>
          {rightAction}

          {/* Carousel arrow buttons (Desktop) */}
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => handleScroll('left')}
              aria-label="Oldingi mangalar"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => handleScroll('right')}
              aria-label="Keyingi mangalar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Scrollable Track ─────────────────────────── */}
      <div className={styles.track} ref={scrollRef}>
        {mangas.map((manga, idx) => {
          const rankNumber = showRank ? idx + 1 : null;
          const extRating = formatExternalRating(manga);
          const availableCh = manga.availableChapters ?? manga.chapters ?? manga.lastChapter ?? 0;

          return (
            <Link
              key={`${manga.id || manga.slug || idx}-${idx}`}
              to={`/manga/${manga.slug || manga.id}`}
              className={styles.card}
            >
              <div className={styles.coverWrap}>
                <CoverImage
                  src={manga.coverImage}
                  alt={manga.title}
                  title={manga.title}
                  type={manga.type}
                  loading="lazy"
                />

                {/* MangaBox Style Rank Number (1, 2, 3...) */}
                {rankNumber && (
                  <span
                    className={`${styles.rankBadge} ${
                      rankNumber === 1
                        ? styles.rankBadge1
                        : rankNumber === 2
                        ? styles.rankBadge2
                        : rankNumber === 3
                        ? styles.rankBadge3
                        : ''
                    }`}
                  >
                    {rankNumber}
                  </span>
                )}
              </div>

              <div className={styles.meta}>
                <h3 className={styles.cardTitle} title={manga.title}>
                  {manga.title}
                </h3>
                <div className={styles.subRow}>
                  {extRating.hasRating ? (
                    <span className={styles.rating} title={`${extRating.source} ${extRating.score}/10 (${extRating.members})`}>
                      <Star size={11} className={styles.starIcon} />
                      <span>{extRating.score}</span>
                    </span>
                  ) : (
                    <span className={styles.ratingUnrated} title="Baholanmagan">
                      <Star size={11} style={{ color: '#64748b' }} />
                      <span>—</span>
                    </span>
                  )}
                  <span className={styles.dot}>•</span>
                  <span className={styles.chapters} title={`MangaLive-da o'qish uchun ${availableCh} ta bob mavjud`}>
                    {availableCh} bob mavjud
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
