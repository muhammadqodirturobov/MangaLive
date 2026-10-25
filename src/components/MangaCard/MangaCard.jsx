import { Link } from 'react-router-dom';
import { Star, Eye, BookOpen, RotateCcw } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { getLastReadChapter } from '../../services/userService.js';
import { formatExternalRating } from '../../services/ratingService.js';
import { formatViewCount } from '../../services/analyticsService.js';
import styles from './MangaCard.module.css';

const TYPE_LABELS = {
  manga: 'Manga',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
  komiks: 'Komiks',
};

const STATUS_LABELS = {
  'davom etmoqda': { label: 'Davom etmoqda', shortLabel: 'Faol', cls: styles.statusOngoing },
  'tugallangan':   { label: 'Tugallangan',   shortLabel: 'Tugagan', cls: styles.statusCompleted },
  'pauza':         { label: 'Pauza',         shortLabel: 'Pauza', cls: styles.statusHiatus },
};

/**
 * MangaCard — high-density, professional manga card.
 * Uses real authorized CoverImage with fallback, readable title,
 * and completely unclipped metadata.
 */
export default function MangaCard({ manga, size = 'normal', showRank = null }) {
  if (!manga) return null;

  const statusInfo = STATUS_LABELS[manga.status] ?? {
    label: manga.status,
    shortLabel: manga.status,
    cls: '',
  };

  const isSmall = size === 'small';
  const mangaTarget = manga.slug || manga.id;
  const lastRead = getLastReadChapter(manga.id) || (manga.slug ? getLastReadChapter(manga.slug) : null);
  const extRating = formatExternalRating(manga.slug || manga.id);
  const formattedViews = formatViewCount(manga.views);

  return (
    <article
      className={`${styles.card} ${isSmall ? styles.cardSmall : ''} fade-in`}
      aria-label={`${manga.title} — ${TYPE_LABELS[manga.type] ?? manga.type}`}
    >
      <Link to={`/manga/${mangaTarget}`} className={styles.coverLink} tabIndex={-1} aria-hidden="true">
        <div className={styles.coverWrapper}>
          <CoverImage
            src={manga.coverImage}
            alt={`${manga.title} muqovasi`}
            title={manga.title}
            type={manga.type}
            loading="lazy"
          />
          <div className={styles.coverOverlay} />

          {/* Ranking Badge if provided (like MangaBox #1, #2, #3) */}
          {showRank && (
            <div className={`${styles.rankBadge} ${showRank <= 3 ? styles[`rankBadge${showRank}`] : ''}`}>
              {showRank}
            </div>
          )}

          {/* Badges on Cover */}
          <div className={styles.topBadges}>
            {manga.isNew && <span className={`${styles.badge} ${styles.badgeNew}`}>YANGI</span>}
            <span className={`${styles.badge} ${styles.badgeType}`}>
              {TYPE_LABELS[manga.type] ?? manga.type}
            </span>
          </div>

          {/* Chapter / Resume pill at bottom right */}
          <div className={styles.chapterPill} title={lastRead ? `O'qilgan: ${lastRead.chapterNumber}-bob` : `${manga.chapters} ta bob`}>
            {lastRead ? (
              <>
                <RotateCcw size={10} style={{ color: '#c084fc' }} aria-hidden="true" />
                <span style={{ color: '#c084fc', fontWeight: 600 }}>{lastRead.chapterNumber}-bob</span>
              </>
            ) : (
              <>
                <BookOpen size={10} aria-hidden="true" />
                <span>{manga.chapters || manga.lastChapter || 0} ta bob</span>
              </>
            )}
          </div>
        </div>
      </Link>

      <div className={styles.body}>
        <Link to={`/manga/${mangaTarget}`} className={styles.titleLink}>
          <h3 className={styles.title} title={manga.title}>
            {manga.title}
          </h3>
          {manga.titleEn && manga.titleEn.trim() && (
            <span className={styles.titleEn} title={manga.titleEn.trim()}>
              {manga.titleEn.trim()}
            </span>
          )}
        </Link>

        {manga.author && <p className={styles.author}>{manga.author}</p>}

        {/* Stats Row: Honest External Rating, Real Views, Status */}
        <div className={styles.stats}>
          {extRating.hasRating ? (
            <span
              className={styles.stat}
              title={`${extRating.badge} · ${extRating.members}`}
              aria-label={extRating.badge}
            >
              <Star size={11} aria-hidden="true" className={styles.starIcon} />
              <span className={styles.ratingText}>{extRating.score}</span>
            </span>
          ) : (
            <span className={styles.stat} title="Baholanmagan" aria-label="Baholanmagan">
              <Star size={11} aria-hidden="true" style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b' }}>—</span>
            </span>
          )}

          {formattedViews && (
            <span className={styles.stat} aria-label={`Ko'rishlar: ${formattedViews}`}>
              <Eye size={11} aria-hidden="true" />
              <span>{formattedViews}</span>
            </span>
          )}

          <span
            className={`${styles.statusBadge} ${statusInfo.cls}`}
            title={statusInfo.label}
          >
            <span className={styles.statusFullText}>{statusInfo.label}</span>
            <span className={styles.statusShortText}>{statusInfo.shortLabel}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
