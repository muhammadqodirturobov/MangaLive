import { Link } from 'react-router-dom';
import { Clock, BookOpen } from 'lucide-react';
import { buildCoverDataUri } from '../../assets/coverHelper.js';
import styles from './LatestChapters.module.css';

/**
 * LatestChapters — horizontal list of recently-updated manga.
 * @param {object[]} mangas — sorted by lastUpdated descending
 */
export default function LatestChapters({ mangas }) {
  return (
    <section aria-label="So'nggi yangilanishlar">
      <div className={styles.list} role="list">
        {mangas.map((manga) => {
          const coverSrc = buildCoverDataUri(
            manga.coverColor,
            manga.coverAccent,
            manga.title,
            manga.type,
            manga.id
          );
          const daysAgo = getDaysAgo(manga.lastUpdated);

          return (
            <article
              key={manga.id}
              className={styles.item}
              role="listitem"
              aria-label={`${manga.title}, ${manga.lastChapter}-bob`}
            >
              <Link to={`/manga/${manga.id}`} className={styles.coverLink} tabIndex={-1}>
                <img
                  src={coverSrc}
                  alt={`${manga.title} muqovasi`}
                  className={styles.cover}
                  loading="lazy"
                />
              </Link>
              <div className={styles.info}>
                <Link to={`/manga/${manga.id}`} className={styles.titleLink}>
                  {manga.title}
                </Link>
                <Link
                  to={`/manga/${manga.id}/chapter/${manga.lastChapter}`}
                  className={styles.chapterLink}
                >
                  <BookOpen size={12} aria-hidden="true" />
                  {manga.lastChapter}-bob
                </Link>
                <span className={styles.time}>
                  <Clock size={11} aria-hidden="true" />
                  {daysAgo}
                </span>
              </div>
              {manga.isNew && (
                <span className={styles.newBadge} aria-label="Yangi bob">YANGI</span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getDaysAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Kecha';
  if (diff < 7)  return `${diff} kun oldin`;
  if (diff < 30) return `${Math.floor(diff / 7)} hafta oldin`;
  return `${Math.floor(diff / 30)} oy oldin`;
}
