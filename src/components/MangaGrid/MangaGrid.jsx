import MangaCard from '../MangaCard/MangaCard.jsx';
import styles from './MangaGrid.module.css';

/**
 * MangaGrid — renders a responsive grid of MangaCard tiles.
 * Accepts a pre-filtered list from the parent; no data imports here.
 */
export default function MangaGrid({ mangas, columns = 'auto' }) {
  return (
    <div
      className={`${styles.grid} ${columns === 'fixed6' ? styles.grid6 : ''}`}
      role="list"
      aria-label="Manga ro'yxati"
    >
      {mangas.map((manga) => (
        <div key={manga.id} role="listitem">
          <MangaCard manga={manga} />
        </div>
      ))}
    </div>
  );
}
