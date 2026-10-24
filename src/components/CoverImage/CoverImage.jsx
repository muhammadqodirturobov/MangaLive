import { useState } from 'react';
import styles from './CoverImage.module.css';

/**
 * CoverImage — Reusable, robust manga portrait cover component.
 * Supports:
 * - Real authorized cover image
 * - Graceful loading shimmer state
 * - Clean intentional fallback when missing or failed
 * - Consistent 1 : 1.4 portrait ratio and smooth object-fit behavior
 */
export default function CoverImage({
  src,
  alt = 'Manga muqovasi',
  title = '',
  type = 'Manga',
  className = '',
  loading = 'lazy',
  priority = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If no source provided or failed to load, show intentional placeholder
  const showFallback = !src || error;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {!loaded && !showFallback && (
        <div className={styles.shimmer} aria-hidden="true" />
      )}

      {showFallback ? (
        <div className={styles.fallback} aria-label={alt}>
          <div className={styles.fallbackPattern} aria-hidden="true" />
          <div className={styles.fallbackContent}>
            <span className={styles.fallbackBadge}>{type.toUpperCase()}</span>
            <span className={styles.fallbackTitle}>{title || 'MangaLive'}</span>
            <span className={styles.fallbackLabel}>MUQOVA KUTILMOQDA</span>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${styles.image} ${loaded ? styles.loaded : ''}`}
          loading={priority ? 'eager' : loading}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
