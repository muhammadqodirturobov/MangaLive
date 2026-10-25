import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import styles from './LatestUpdatesGrid.module.css';

export default function LatestUpdatesGrid({ title, mangas = [], rightAction, subtitle }) {
  if (!mangas || mangas.length === 0) return null;

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
          const target = manga.slug || manga.id;
          const totalChapters = manga.chapters || manga.lastChapter || 0;
          const lastCh = manga.lastChapter || manga.chapters || 1;

          // Generate up to 3 recent available chapters
          const recentChapters = [];
          for (let c = lastCh; c >= Math.max(1, lastCh - 2); c--) {
            recentChapters.push(c);
          }

          return (
            <div key={`${target}-${idx}`} className={styles.entry}>
              <Link to={`/manga/${target}`} className={styles.coverLink} tabIndex={-1} aria-hidden="true">
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
                <Link to={`/manga/${target}`} className={styles.entryTitle} title={manga.title}>
                  {manga.title}
                </Link>

                <div className={styles.totalBadge}>
                  <BookOpen size={10} aria-hidden="true" />
                  <span>Jami: {totalChapters} ta bob</span>
                </div>

                <div className={styles.chaptersList}>
                  {recentChapters.map((chNum) => (
                    <div key={`${target}-ch-${chNum}`} className={styles.chapterRow}>
                      <Link
                        to={`/manga/${target}/chapter/${chNum}`}
                        className={styles.chapterLink}
                        title={`${manga.title} ${chNum}-bobni o'qish`}
                      >
                        {chNum}-bob
                      </Link>
                      <span className={styles.timeTag}>
                        <span>{chNum === lastCh ? 'So\'nggi' : 'Mavjud'}</span>
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
