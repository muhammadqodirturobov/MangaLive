import { Link } from 'react-router-dom';
import { Star, Flame } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import styles from './WeeklyRanking.module.css';

/**
 * WeeklyRanking — sidebar widget showing top-ranked manga by AniList community score.
 * Completely free of fabricated numbers.
 */
export default function WeeklyRanking({ rankings }) {
  if (!rankings || rankings.length === 0) return null;

  return (
    <section className={styles.widget} aria-label="Eng yuqori baholanganlar">
      <div className={styles.header}>
        <Flame size={14} className={styles.flameIcon} />
        <h2 className={styles.title}>Top Reyting</h2>
      </div>
      <ol className={styles.list}>
        {rankings.map(({ manga, rank, score, members, chapters }) => {
          if (!manga) return null;
          const target = manga.slug || manga.id;

          return (
            <li key={manga.id} className={styles.item}>
              <span
                className={`${styles.rank} ${rank <= 3 ? styles.rankTop : ''}`}
                aria-label={`${rank}-o'rin`}
              >
                {rank}
              </span>
              <Link to={`/manga/${target}`} className={styles.coverLink} tabIndex={-1} aria-hidden="true">
                <div className={styles.thumbWrapper}>
                  <CoverImage
                    src={manga.coverImage}
                    alt={`${manga.title} muqovasi`}
                    title={manga.title}
                    type={manga.type}
                    loading="lazy"
                    className={styles.thumb}
                  />
                </div>
              </Link>
              <div className={styles.info}>
                <Link to={`/manga/${target}`} className={styles.name} title={manga.title}>
                  {manga.title}
                </Link>
                <div className={styles.metaRow}>
                  <span className={styles.scoreBadge} title={`Reyting balli: ${score}/10`}>
                    <Star size={10} className={styles.starIcon} />
                    <strong>{score}</strong>
                  </span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.chaptersCount} title={`MangaLive-da o'qish uchun ${chapters} ta bob mavjud`}>
                    {chapters} bob mavjud
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
