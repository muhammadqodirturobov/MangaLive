import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Star, Eye, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchRankings } from '../services/mangaService.js';
import CoverImage from '../components/CoverImage/CoverImage.jsx';
import styles from './RatingPage.module.css';

// Tabs for rating periods
const TABS = [
  { id: 'weekly', label: 'Haftalik' },
  { id: 'monthly', label: 'Oylik' },
  { id: 'alltime', label: 'Barcha davr' },
];

export default function RatingPage() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [rankedManga, setRankedManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRankings() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRankings(activeTab);
        if (!cancelled) {
          setRankedManga(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[RatingPage] Load error:', err);
          setError(err.message || 'Reyting ma\'lumotlarini yuklashda xatolik');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRankings();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <main className={styles.ratingMain}>
      <div className={`container ${styles.container}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <Trophy size={24} className={styles.trophyIcon} aria-hidden="true" />
            </div>
            <div>
              <h1 className={styles.pageTitle}>Manga Reytingi</h1>
              <p className={styles.pageSubtitle}>
                O'quvchilar tomonidan eng ko'p o'qilgan va yuqori baholangan asarlar ro'yxati
              </p>
            </div>
          </div>

          {/* Time period filter pills */}
          <div className={styles.tabGroup} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
            <RefreshCw size={24} className={styles.spinning} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px' }}>Reyting ma'lumotlari yuklanmoqda...</p>
          </div>
        ) : rankedManga.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <p>Ushbu davr uchun hozircha reyting ma'lumotlari mavjud emas.</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            <section className={styles.podiumSection} aria-label="Eng sara uchlik">
              {rankedManga.slice(0, 3).map((item, index) => {
                const manga = item.manga;
                if (!manga) return null;
                const podiumClass = index === 0 ? styles.goldPodium : index === 1 ? styles.silverPodium : styles.bronzePodium;
                const targetUrl = `/manga/${manga.slug || manga.id}`;

                return (
                  <Link
                    key={manga.id}
                    to={targetUrl}
                    className={`${styles.podiumCard} ${podiumClass}`}
                  >
                    <div className={styles.podiumRankBadge}>
                      #{item.rank}
                    </div>
                    <div className={styles.podiumCoverWrap}>
                      <CoverImage
                        src={manga.coverImage}
                        alt={manga.title}
                        title={manga.title}
                        type={manga.type}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.podiumInfo}>
                      <div className={styles.podiumType}>{manga.type}</div>
                      <h3 className={styles.podiumTitle}>{manga.title}</h3>
                      <div className={styles.podiumMeta}>
                        <span className={styles.podiumScore}>
                          {activeTab === 'alltime' ? (
                            <>
                              <Star size={13} fill="#f59e0b" color="#f59e0b" />
                              {item.score}
                            </>
                          ) : (
                            <>
                              <Eye size={13} />
                              {item.score}
                            </>
                          )}
                        </span>
                        <span className={styles.podiumMetric}>{item.metricLabel}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>

            {/* Full Rankings List Table */}
            <div className={styles.rankingsListCard}>
              <div className={styles.listHeader}>
                <span className={styles.colRank}># O'rin</span>
                <span className={styles.colManga}>Sarlavha va Janr</span>
                <span className={styles.colMetric}>Ko'rsatkich</span>
                <span className={styles.colAction}>Batafsil</span>
              </div>

              <div className={styles.listBody}>
                {rankedManga.map((item) => {
                  const manga = item.manga;
                  if (!manga) return null;
                  const targetUrl = `/manga/${manga.slug || manga.id}`;

                  return (
                    <Link
                      key={manga.id}
                      to={targetUrl}
                      className={styles.rankingRow}
                    >
                      <div className={styles.colRank}>
                        <span
                          className={`${styles.rankNumber} ${
                            item.rank === 1
                              ? styles.rankFirst
                              : item.rank === 2
                              ? styles.rankSecond
                              : item.rank === 3
                              ? styles.rankThird
                              : ''
                          }`}
                        >
                          {item.rank}
                        </span>
                      </div>

                      <div className={styles.colManga}>
                        <div style={{ width: '40px', height: '56px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden' }}>
                          <CoverImage
                            src={manga.coverImage}
                            alt={manga.title}
                            title={manga.title}
                            type={manga.type}
                            loading="lazy"
                          />
                        </div>
                        <div className={styles.rowDetails}>
                          <div className={styles.rowTitleWrap}>
                            <h4 className={styles.rowTitle}>{manga.title}</h4>
                            <span className={styles.rowType}>{manga.type}</span>
                          </div>
                          <div className={styles.rowSub}>
                            <span className={styles.genreList}>
                              {(manga.genres || []).slice(0, 2).join(' · ')}
                            </span>
                            <span className={styles.dot}>•</span>
                            <span className={styles.chapterCount}>{manga.chapters ?? manga.chaptersCount ?? 0} bob</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.colMetric}>
                        <div className={styles.metricVal}>
                          {activeTab === 'alltime' ? (
                            <>
                              <Star size={13} fill="#f59e0b" color="#f59e0b" />
                              <span>{item.score}</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp size={13} className={styles.trendIcon} />
                              <span>{item.score}</span>
                            </>
                          )}
                        </div>
                        <span className={styles.metricSub}>{item.metricLabel}</span>
                      </div>

                      <div className={styles.colAction}>
                        <span className={styles.detailsBtn}>
                          <ChevronRight size={18} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
