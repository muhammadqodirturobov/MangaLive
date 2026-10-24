import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, BookOpen, Scroll, Book } from 'lucide-react';
import styles from './GenresDropdown.module.css';

const TYPES = [
  { id: 'manhwa', label: 'Manhwa', origin: 'Koreya', icon: Smartphone },
  { id: 'manga',  label: 'Manga',  origin: 'Yaponiya', icon: BookOpen },
  { id: 'manhua', label: 'Manhua', origin: 'Xitoy',   icon: Scroll },
  { id: 'komiks', label: 'Komiks', origin: "G'arb",   icon: Book },
];

const MAIN_GENRES = [
  { slug: 'jangovar',         label: 'Jangari' },
  { slug: 'sarguzasht',       label: 'Sarguzasht' },
  { slug: 'fantaziya',        label: 'Fantastika' },
  { slug: 'fojiaviy',         label: 'Drama' },
  { slug: 'komediya',         label: 'Komediya' },
  { slug: 'isekai',           label: 'Reinkarnatsiya' },
  { slug: 'romantik',         label: 'Romantika' },
  { slug: 'sirli',            label: 'Sehr' },
  { slug: 'harakatli',        label: 'Harakatli' },
];

const OTHER_GENRES = [
  { slug: 'jangovar',         label: "Jang San'ati" },
  { slug: 'fantaziya',        label: 'Kultivatsiya' },
  { slug: 'sirli',            label: 'Magiya' },
  { slug: 'ilmiy-fantastika', label: 'Tizim' },
  { slug: 'fantaziya',        label: 'Fantaziya' },
  { slug: 'maktab',           label: 'Maktab' },
  { slug: 'harakatli',        label: 'Monstrlar' },
  { slug: 'tarixiy',          label: 'Murim' },
  { slug: 'jangovar',         label: "Zo'ravonlik" },
  { slug: 'harakatli',        label: 'Qilichbozlik' },
  { slug: 'psixologik',       label: 'Psixologik' },
  { slug: 'sirli',            label: 'Demonlar' },
];

export default function GenresDropdown({ onClose }) {
  const navigate = useNavigate();

  const handleSelectType = (typeId) => {
    navigate(`/katalog?tur=${typeId}`);
    onClose?.();
  };

  const handleSelectGenre = (genreSlug) => {
    navigate(`/katalog?janr=${genreSlug}`);
    onClose?.();
  };

  return (
    <div className={styles.dropdown} role="dialog" aria-label="Janrlar menyusi">
      {/* ── 1. Format Types (Manhwa, Manga, Manhua, Komiks) ───────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Turlar</span>
        </div>
        <div className={styles.typesGrid}>
          {TYPES.map(({ id, label, origin, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={styles.typeCard}
              onClick={() => handleSelectType(id)}
            >
              <div className={styles.typeIconWrap}>
                <Icon size={18} />
              </div>
              <div className={styles.typeText}>
                <span className={styles.typeLabel}>{label}</span>
                <span className={styles.typeOrigin}>{origin}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Popular Genres with counts ──────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Janrlar</span>
          <Link
            to="/katalog"
            className={styles.viewAllLink}
            onClick={onClose}
          >
            Barchasi &gt;
          </Link>
        </div>
        <div className={styles.genresGrid}>
          {MAIN_GENRES.map(({ slug, label }) => (
            <button
              key={slug + label}
              type="button"
              className={styles.genreItem}
              onClick={() => handleSelectGenre(slug)}
            >
              <span className={styles.genreLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Other Genres tag list ────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.subSectionTitle}>Boshqa janrlar</span>
        </div>
        <div className={styles.otherGrid}>
          {OTHER_GENRES.map(({ slug, label }) => (
            <button
              key={slug + label}
              type="button"
              className={styles.otherItem}
              onClick={() => handleSelectGenre(slug)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
