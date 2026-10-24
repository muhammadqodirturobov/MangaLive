import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { buildCoverDataUri } from '../../assets/coverHelper.js';
import styles from './WeeklyRanking.module.css';

const CHANGE_ICONS = {
  up:   <TrendingUp   size={12} className={styles.up}   aria-label="Ko'tarildi" />,
  down: <TrendingDown size={12} className={styles.down} aria-label="Tushdi"     />,
  same: <Minus        size={12} className={styles.same} aria-label="O'zgarmadi" />,
  new:  <Flame        size={12} className={styles.new}  aria-label="Yangi"      />,
};

/**
 * WeeklyRanking — sidebar widget showing top-10 ranked manga for the week.
 * @param {object[]} rankings — from data/rankings.js (joined with manga data)
 */
export default function WeeklyRanking({ rankings }) {
  return (
    <section className={styles.widget} aria-label="Haftalik reyting">
      <h2 className={`section-title ${styles.title}`}>Haftalik Reyting</h2>
      <ol className={styles.list}>
        {rankings.map(({ manga, rank, weeklyViews, change }) => {
          if (!manga) return null;
          const coverSrc = buildCoverDataUri(
            manga.coverColor,
            manga.coverAccent,
            manga.title,
            manga.type,
            manga.id
          );
          return (
            <li key={manga.id} className={styles.item}>
              <span
                className={`${styles.rank} ${rank <= 3 ? styles.rankTop : ''}`}
                aria-label={`${rank}-o'rin`}
              >
                {rank}
              </span>
              <Link to={`/manga/${manga.id}`} className={styles.coverLink}>
                <img
                  src={coverSrc}
                  alt={`${manga.title} muqovasi`}
                  className={styles.thumb}
                  loading="lazy"
                />
              </Link>
              <div className={styles.info}>
                <Link to={`/manga/${manga.id}`} className={styles.name}>
                  {manga.title}
                </Link>
                <span className={styles.views}>
                  {weeklyViews.toLocaleString('uz-UZ')} ko'rishlar
                </span>
              </div>
              <span className={styles.change} aria-live="polite">
                {CHANGE_ICONS[change]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
