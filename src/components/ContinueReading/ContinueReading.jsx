import { Link } from 'react-router-dom';
import { BookOpen, Play, ChevronRight, Clock, Sparkles, Lock } from 'lucide-react';
import CoverImage from '../CoverImage/CoverImage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isChapterLocked } from '../../utils/chapterAccess.js';
import styles from './ContinueReading.module.css';

/**
 * Filter and normalize reading history to return up to 4 most recently read, unfinished manga.
 */
export function filterUnfinishedManga(historyList = [], allMangas = []) {
  if (!Array.isArray(historyList) || historyList.length === 0) return [];

  // Build catalog lookup map for cover and chapter counts
  const catalogMap = new Map();
  if (Array.isArray(allMangas)) {
    for (const m of allMangas) {
      if (!m) continue;
      const total = Number(m.availableChapters ?? m.chapters ?? m.chapters_count ?? m.lastChapter ?? 0);
      const entry = {
        total,
        cover: m.coverImage || m.cover_url || '',
        title: m.title || '',
        type: m.type || 'MANGA',
      };
      if (m.slug) catalogMap.set(String(m.slug).toLowerCase(), entry);
      if (m.id) catalogMap.set(String(m.id).toLowerCase(), entry);
    }
  }

  const seen = new Set();
  const unfinished = [];

  for (const item of historyList) {
    if (!item) continue;
    const chNum = Number(item.chapterNumber || item.last_chapter_number || 1);
    if (chNum <= 0) continue;

    const targetSlug = item.mangaSlug || item.mangaId;
    if (!targetSlug) continue;

    const key = String(targetSlug).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const catalogEntry = catalogMap.get(key) || catalogMap.get(String(item.mangaId || '').toLowerCase());
    const totalChs = Number(
      item.availableChapters ||
      catalogEntry?.total ||
      item.chaptersCount ||
      item.chapters ||
      0
    );

    // If total chapters is known: series is finished if last-read >= total
    const isFinished = totalChs > 0 && chNum >= totalChs;
    if (isFinished) continue;

    const cover = item.coverImage || catalogEntry?.cover || '';
    const title = item.mangaTitle || catalogEntry?.title || targetSlug;
    const targetChapter = totalChs > 0 ? Math.min(chNum, totalChs) : chNum;

    // Reliable progress calculation
    let progressPercent = null;
    let progressLabel = null;
    if (totalChs > 0) {
      progressPercent = Math.min(100, Math.max(1, Math.round((chNum / totalChs) * 100)));
      progressLabel = `${chNum} / ${totalChs} bob`;
    } else if (item.scrollProgress && Number(item.scrollProgress) > 0) {
      progressPercent = Math.min(100, Math.round(Number(item.scrollProgress)));
      progressLabel = `${progressPercent}%`;
    }

    unfinished.push({
      ...item,
      chapterNumber: chNum,
      targetChapter,
      availableChapters: totalChs,
      coverImage: cover,
      mangaTitle: title,
      targetSlug,
      progressPercent,
      progressLabel,
      type: catalogEntry?.type || item.type || 'MANGA',
    });

    if (unfinished.length >= 4) break;
  }

  return unfinished;
}

/**
 * Format relative time (e.g., "5 daqiqa oldin", "Bugun", "Kecha")
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Hozirgina';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} daq oldin`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} soat oldin`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} kun oldin`;
}

export default function ContinueReading({ items = [], historyItem = null, allMangas = [] }) {
  const { user, openAuthModal } = useAuth();
  // Support both array of items and single legacy historyItem
  let sourceList = Array.isArray(items) && items.length > 0
    ? items
    : historyItem ? [historyItem] : [];

  const displayItems = filterUnfinishedManga(sourceList, allMangas);

  // Tasteful, compact empty state if user has no unfinished reading history
  if (displayItems.length === 0) {
    return (
      <section className={styles.section} aria-label="O'qishni davom ettirish">
        <div className={styles.emptyRow}>
          <div className={styles.emptyLeft}>
            <div className={styles.emptyIconBox}>
              <BookOpen size={16} className={styles.emptyIcon} />
            </div>
            <div className={styles.emptyTextGroup}>
              <span className={styles.emptyTitle}>O'qishni davom ettirish</span>
              <span className={styles.emptySubtitle}>Hozircha o'qilayotgan tugallanmagan asarlar yo'q</span>
            </div>
          </div>
          <Link to="/katalog" className={styles.emptyActionLink}>
            <span>Katalogdan tanlang</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="O'qishni davom ettirish">
      {/* ── Section Header ───────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <Clock size={16} className={styles.headerIcon} aria-hidden="true" />
          </div>
          <div className={styles.titleText}>
            <h2 className={styles.title}>O'qishni davom ettirish</h2>
            <span className={styles.subtitle}>Oxirgi mutolaa qilingan asarlaringiz</span>
          </div>
        </div>

        <Link to="/kutubxona" className={styles.allHistoryLink}>
          <span>Barcha tarix</span>
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {/* ── Multi-Series Responsive Row ──────────────────────────── */}
      <div className={styles.rowGrid}>
        {displayItems.map((item, idx) => {
          const key = `${item.targetSlug || item.mangaId}-${idx}`;
          const resumeUrl = `/manga/${item.targetSlug}/chapter/${item.targetChapter}`;

          return (
            <div key={key} className={styles.card}>
              {/* Cover Thumbnail */}
              <Link to={`/manga/${item.targetSlug}`} className={styles.thumbLink}>
                <div className={styles.thumbWrap}>
                  <CoverImage
                    src={item.coverImage}
                    alt=""
                    title={item.mangaTitle}
                    type={item.type}
                    width={52}
                    height={72}
                  />
                </div>
              </Link>

              {/* Main Info */}
              <div className={styles.cardContent}>
                <Link to={`/manga/${item.targetSlug}`} className={styles.titleLink}>
                  <h3 className={styles.mangaTitle} title={item.mangaTitle}>
                    {item.mangaTitle}
                  </h3>
                </Link>

                <div className={styles.metaRow}>
                  <span className={styles.chapterBadge}>
                    {item.chapterNumber}-bob
                  </span>
                  {item.timestamp && (
                    <span className={styles.timeText}>
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  )}
                </div>

                {/* Reliable Progress Indicator */}
                {item.progressPercent !== null && (
                  <div className={styles.progressBlock}>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <div
                        className={styles.progressBar}
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    {item.progressLabel && (
                      <span className={styles.progressText}>
                        {item.progressLabel} ({item.progressPercent}%)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Fast Resume Action Button */}
              {(() => {
                const locked = isChapterLocked(item.targetChapter, user);
                return (
                  <Link
                    to={resumeUrl}
                    className={styles.resumeActionBtn}
                    title={locked ? `${item.chapterNumber}-bob (Hisob talab etiladi)` : `Davom ettirish: ${item.chapterNumber}-bob`}
                    aria-label={`${item.mangaTitle} ${item.chapterNumber}-bobni o'qish`}
                    onClick={(e) => {
                      if (locked) {
                        e.preventDefault();
                        openAuthModal('signup', {
                          intendedDestination: resumeUrl,
                          reason: 'chapter_locked',
                          chapterNumber: item.targetChapter,
                          mangaTitle: item.mangaTitle,
                        });
                      }
                    }}
                  >
                    {locked ? <Lock size={13} /> : <Play size={14} fill="currentColor" />}
                    <span className={styles.resumeBtnText}>{locked ? 'Kirish' : "O'qish"}</span>
                  </Link>
                );
              })()}
            </div>
          );
        })}
      </div>
    </section>
  );
}
