import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import styles from './LatestUpdatesGrid.module.css';

export default function LatestUpdatesGrid({ title, mangas = [], rightAction, subtitle }) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {rightAction}
      </div>

      <div className={styles.grid}>
        {mangas.map((manga, idx) => {
          // Latest 3 chapters with human-readable times
          const lastCh = manga.lastChapter || 10;
          const chapters = [
            { num: lastCh, time: '12 daq oldin' },
            { num: Math.max(1, lastCh - 1), time: '2 soat oldin' },
            { num: Math.max(1, lastCh - 2), time: 'Kecha' },
          ];

          return (
            <div key={`${manga.id || manga.slug || idx}-${idx}`} className={styles.entry}>
              <Link to={`/manga/${manga.id}`} className={styles.coverLink}>
                <div className={styles.coverContainer}>
                  <CoverImage
                    src={manga.coverImage}
                    alt={manga.title}
                    title={manga.title}
                    type={manga.type}
                    loading="lazy"
                  />
                </div>
              </Link>

              <div className={styles.content}>
                <Link to={`/manga/${manga.id}`} className={styles.entryTitle} title={manga.title}>
                  {manga.title}
                </Link>

                <div className={styles.chaptersList}>
                  {chapters.map((ch, idx) => (
                    <div key={`${manga.id}-${ch.num}-${idx}`} className={styles.chapterRow}>
                      <Link
                        to={`/manga/${manga.id}/chapter/${ch.num}`}
                        className={styles.chapterLink}
                      >
                        Bob {ch.num}
                      </Link>
                      <span className={styles.timeTag}>
                        <Clock size={10} />
                        <span>{ch.time}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
