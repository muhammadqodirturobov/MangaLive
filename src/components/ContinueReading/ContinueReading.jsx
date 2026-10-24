import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';
import styles from './ContinueReading.module.css';

/**
 * Format relative time (e.g., "5 daqiqa oldin", "Bugun", "Kecha")
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Hozirgina';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} soat oldin`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} kun oldin`;
}

export default function ContinueReading({ historyItem }) {
  if (!historyItem) return null;

  const { mangaId, mangaTitle, chapterNumber, timestamp } = historyItem;

  return (
    <div className={styles.continueCard}>
      <div className={styles.iconWrapper}>
        <BookOpen size={20} className={styles.icon} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.badge}>Davom ettirish</span>
          {timestamp && (
            <span className={styles.timeAgo}>
              <Clock size={12} aria-hidden="true" />
              {formatTimeAgo(timestamp)}
            </span>
          )}
        </div>
        <p className={styles.mangaInfo}>
          <strong className={styles.mangaTitle}>{mangaTitle || mangaId}</strong>
          <span className={styles.separator}>—</span>
          <span className={styles.chapterNum}>{chapterNumber}-bob</span>
        </p>
      </div>

      <Link
        to={`/manga/${mangaId}/chapter/${chapterNumber}`}
        className={`btn btn-primary ${styles.resumeBtn}`}
      >
        <span>Mutolaani davom ettirish</span>
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
