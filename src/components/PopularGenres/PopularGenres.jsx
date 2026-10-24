import styles from './PopularGenres.module.css';

/**
 * PopularGenres — sidebar widget listing popular genre filters with badges.
 * Shows top 8 genres with an expandable "Barchasi" toggle for dense, clean sidebar space.
 * @param {object[]} genres      — full genres list from data file
 * @param {string}   activeGenre — currently selected slug
 * @param {function} onSelect    — callback(slug)
 */
export default function PopularGenres({ genres, activeGenre, onSelect }) {
  // Show top popular genres first
  const displayGenres = genres.slice(0, 9);

  return (
    <section className={styles.widget} aria-label="Janrlar bo'yicha filtr">
      <div className={styles.widgetHeader}>
        <h2 className={`section-title ${styles.title}`}>Ommabop Janrlar</h2>
      </div>

      <div className={styles.genrePillGrid} role="list">
        {displayGenres.map((genre) => {
          const isActive = activeGenre === genre.slug;
          return (
            <button
              key={genre.slug}
              className={`${styles.genrePillBtn} ${isActive ? styles.active : ''}`}
              onClick={() => onSelect(genre.slug)}
              aria-pressed={isActive}
              aria-label={`${genre.label} janri (${genre.count} ta manga)`}
              role="listitem"
            >
              <span className={styles.icon} aria-hidden="true">{genre.icon}</span>
              <span className={styles.label}>{genre.label}</span>
              <span className={styles.count}>{genre.count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
