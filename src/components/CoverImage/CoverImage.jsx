import { useState, useEffect, useRef } from 'react';
import styles from './CoverImage.module.css';

/**
 * CoverImage — Reusable, robust manga portrait cover component.
 * Features:
 * - Real authorized cover image
 * - Immediate display if cached or fast-loading
 * - Graceful loading shimmer state
 * - Clean intentional fallback when missing or failed
 * - Consistent 1 : 1.42 portrait ratio and smooth object-fit behavior
 */
export default function CoverImage({
  src,
  alt = 'Manga muqovasi',
  title = '',
  type = 'Manga',
  className = '',
  loading = 'lazy',
  priority = false,
  fetchpriority,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // If no source provided or failed to load, show intentional placeholder
  const showFallback = !src || error;

  // Modern web guidance compliance:
  // - High fetchpriority for LCP / priority hero image
  // - Eager loading for priority image, lazy for off-screen
  const computedFetchPriority = priority ? 'high' : (fetchpriority || undefined);
  const computedLoading = priority ? 'eager' : loading;

  // Handle cached or already-complete images where onLoad might not fire
  useEffect(() => {
    setLoaded(false);
    setError(false);
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setLoaded(true);
      } else {
        setError(true);
      }
    }
  }, [src]);

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
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${styles.image} ${loaded ? styles.loaded : ''}`}
          loading={computedLoading}
          fetchpriority={computedFetchPriority}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
