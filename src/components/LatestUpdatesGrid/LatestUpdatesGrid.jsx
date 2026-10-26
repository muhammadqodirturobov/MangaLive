import { Link } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isChapterLocked } from '../../utils/chapterAccess.js';
import styles from './LatestUpdatesGrid.module.css';

export default function LatestUpdatesGrid({ title, mangas = [], rightAction, subtitle }) {
  const { user, openAuthModal } = useAuth();
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
          const totalChapters = Number(manga.availableChapters ?? manga.chapters ?? manga.lastChapter ?? 0);
          const lastCh = Math.min(
            Number(manga.lastChapter || manga.chapters || 0),
            totalChapters
          );

          // Generate up to 3 recent genuinely available chapters
          const recentChapters = [];
          if (lastCh > 0) {
            for (let c = lastCh; c >= Math.max(1, lastCh - 2); c--) {
              recentChapters.push(c);
            }
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

                <div className={styles.totalBadge} title={`MangaLive-da o'qish uchun ${totalChapters} ta bob mavjud`}>
                  <BookOpen size={10} aria-hidden="true" />
                  <span>Mavjud: {totalChapters} ta bob</span>
                </div>

                <div className={styles.chaptersList}>
                  {recentChapters.map((chNum) => {
                    const locked = isChapterLocked(chNum, user);
                    return (
                      <div key={`${target}-ch-${chNum}`} className={styles.chapterRow}>
                        <Link
                          to={`/manga/${target}/chapter/${chNum}`}
                          className={styles.chapterLink}
                          title={locked ? `${manga.title} ${chNum}-bob (Hisob talab etiladi)` : `${manga.title} ${chNum}-bobni o'qish`}
                          onClick={(e) => {
                            if (locked) {
                              e.preventDefault();
                              openAuthModal('signup', {
                                intendedDestination: `/manga/${target}/chapter/${chNum}`,
                                reason: 'chapter_locked',
                                chapterNumber: chNum,
                                mangaTitle: manga.title,
                              });
                            }
                          }}
                        >
                          <span>{chNum}-bob</span>
                          {locked && <Lock size={10} style={{ color: '#c084fc', marginLeft: 4 }} />}
                        </Link>
                        <span className={styles.timeTag}>
                          <span>{chNum === lastCh ? 'So\'nggi' : 'Mavjud'}</span>
                        </span>
                      </div>
                    );
                  })}
                  {recentChapters.length === 0 && (
                    <span className={styles.timeTag}>Boblar tayyorlanmoqda</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
