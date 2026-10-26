import { Link } from 'react-router-dom';
import { Sparkles, Star, BookOpen, ArrowRight, Play } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { formatExternalRating } from '../../services/ratingService.js';
import { getMangaThematicProfile } from '../../assets/coverHelper.js';
import styles from './SpotlightRecommendations.module.css';

export default function SpotlightRecommendations({ mangas = [] }) {
  if (!Array.isArray(mangas) || mangas.length === 0) return null;

  // Filter 4 top-rated distinct titles for the curated spotlight
  const spotlightItems = mangas.slice(0, 4);

  return (
    <section className={styles.section} aria-label="Sizga tavsiya etiladi">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.badgeWrap}>
            <Sparkles size={14} className={styles.sparkleIcon} aria-hidden="true" />
            <span className={styles.badgeText}>TAHRIRIYAT TANLOVI</span>
          </div>
          <h2 className={styles.title}>Sizga Tavsiya Etiladi</h2>
          <p className={styles.subtitle}>
            Eng yuqori baholangan va o'quvchilar mehrini qozongan durdona asarlar
          </p>
        </div>

        <Link to="/katalog" className={styles.viewAllLink}>
          <span>Barcha asarlar</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.grid}>
        {spotlightItems.map((manga) => {
          const mSlug = manga.slug || manga.id;
          const extRating = formatExternalRating(mSlug);
          const theme = getMangaThematicProfile(mSlug);
          const availableChapters = manga.availableChapters ?? manga.chapters ?? manga.lastChapter ?? 0;

          return (
            <article
              key={mSlug}
              className={styles.card}
              style={{
                '--card-accent': theme.accent,
                '--card-glow': theme.glow,
              }}
            >
              <Link to={`/manga/${mSlug}`} className={styles.coverLink} tabIndex={-1} aria-hidden="true">
                <div className={styles.coverWrap}>
                  <CoverImage
                    src={manga.coverImage}
                    alt={manga.title}
                    title={manga.title}
                    type={manga.type}
                    loading="lazy"
                  />
                  <div className={styles.coverGlow} />
                  <span className={styles.typeTag}>
                    {manga.type ? manga.type.toUpperCase() : 'MANHWA'}
                  </span>
                </div>
              </Link>

              <div className={styles.cardBody}>
                <div className={styles.metaTop}>
                  {extRating.hasRating ? (
                    <div className={styles.ratingBadge}>
                      <Star size={12} className={styles.starIcon} aria-hidden="true" />
                      <span className={styles.ratingScore}>{extRating.score}</span>
                      <span className={styles.ratingScale}>/10</span>
                    </div>
                  ) : (
                    <span className={styles.unratedBadge}>Yangi</span>
                  )}

                  <span className={styles.chapterBadge}>
                    <BookOpen size={11} aria-hidden="true" />
                    <span>{availableChapters} bob</span>
                  </span>
                </div>

                <Link to={`/manga/${mSlug}`} className={styles.titleLink}>
                  <h3 className={styles.cardTitle}>{manga.title}</h3>
                  {manga.titleEn && (
                    <span className={styles.cardTitleEn}>{manga.titleEn}</span>
                  )}
                </Link>

                <p className={styles.synopsis}>
                  {manga.synopsis || "West Road akademiyasi va qahramonlik sarguzashtlari haqidagi ajoyib asar."}
                </p>

                <div className={styles.cardFooter}>
                  {Array.isArray(manga.genres) && manga.genres.length > 0 && (
                    <div className={styles.genresList}>
                      {manga.genres.slice(0, 2).map((g) => (
                        <span key={g} className={styles.genreTag}>#{g}</span>
                      ))}
                    </div>
                  )}

                  <Link
                    to={`/manga/${mSlug}/chapter/1`}
                    className={styles.readBtn}
                    aria-label={`${manga.title} 1-bobini o'qish`}
                  >
                    <Play size={12} fill="currentColor" aria-hidden="true" />
                    <span>1-bobni o'qish</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
