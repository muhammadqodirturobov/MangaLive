import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Heart, Play, Lock } from 'lucide-react';
import { getReadingHistory, getFavorites } from '../services/userService.js';
import { fetchMangaById } from '../services/mangaService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isChapterLocked } from '../utils/chapterAccess.js';
import MangaCard from '../components/MangaCard/MangaCard.jsx';
import styles from './LibraryPage.module.css';

const TABS = [
  { id: 'history',   label: "O'qish tarixi" },
  { id: 'favorites', label: 'Sevimlilar' },
  { id: 'notices',   label: "E'lonlar" },
];

export default function LibraryPage() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [historyItems, setHistoryItems] = useState(() => getReadingHistory());
  const [favoriteMangas, setFavoriteMangas] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    setHistoryItems(getReadingHistory());
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'favorites') return;

    let cancelled = false;
    async function loadFavs() {
      const favIds = getFavorites();
      if (favIds.length === 0) {
        setFavoriteMangas([]);
        return;
      }

      setFavLoading(true);
      try {
        const loaded = await Promise.all(
          favIds.map(async (fId) => {
            try {
              return await fetchMangaById(fId);
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          setFavoriteMangas(loaded.filter(Boolean));
        }
      } catch (err) {
        console.error('[LibraryPage] Fav load error:', err);
      } finally {
        if (!cancelled) {
          setFavLoading(false);
        }
      }
    }

    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Hozirgina';
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    return `${days} kun oldin`;
  }

  return (
    <main className={styles.libraryMain}>
      <div className={`container ${styles.container}`}>
        {/* ── Top Tabs ──────────────────────────────────────────────── */}
        <div className={styles.tabBar} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTabBtn : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'history' && historyItems.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#c084fc' }}>
                  ({historyItems.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 1. Reading History Tab ─────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            {historyItems.length === 0 ? (
              <div className={styles.emptyBox}>
                <Clock size={40} style={{ color: '#94a3b8' }} />
                <h3 className={styles.emptyTitle}>O'qish tarixi bo'sh</h3>
                <p className={styles.emptyDesc}>
                  Siz hali birorta bobni o'qimadingiz. Katalogdan qiziqarli asar topib, mutolaani boshlang!
                </p>
                <Link to="/katalog" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Katalogga o'tish
                </Link>
              </div>
            ) : (
              <div className={styles.historyList}>
                {historyItems.map((item, idx) => {
                  const targetSlug = item.mangaSlug || item.mangaId;
                  return (
                    <div key={`${item.mangaId}-${idx}`} className={styles.historyCard}>
                      <div className={styles.historyCardLeft}>
                        <BookOpen size={20} style={{ color: '#a855f7', flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Link to={`/manga/${targetSlug}`} style={{ textDecoration: 'none' }}>
                            <h4 className={styles.historyMangaTitle}>{item.mangaTitle || targetSlug}</h4>
                          </Link>
                          <div className={styles.historySub}>
                            <span>Oxirgi o'qilgan: <strong>{item.chapterNumber}-bob</strong></span>
                            {item.timestamp && (
                              <>
                                <span>•</span>
                                <span>{formatTimeAgo(item.timestamp)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const locked = isChapterLocked(item.chapterNumber, user);
                        const resumeUrl = `/manga/${targetSlug}/chapter/${item.chapterNumber}`;
                        return (
                          <Link
                            to={resumeUrl}
                            className={`btn btn-primary ${styles.historyResumeBtn}`}
                            onClick={(e) => {
                              if (locked) {
                                e.preventDefault();
                                openAuthModal('signup', {
                                  intendedDestination: resumeUrl,
                                  reason: 'chapter_locked',
                                  chapterNumber: item.chapterNumber,
                                  mangaTitle: item.mangaTitle,
                                });
                              }
                            }}
                          >
                            {locked ? <Lock size={13} /> : <Play size={13} fill="currentColor" />}
                            <span>{locked ? 'Kirish' : 'Davom ettirish'}</span>
                          </Link>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 2. Favorites Tab ───────────────────────────────────────── */}
        {activeTab === 'favorites' && (
          <div>
            {favLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <p>Sevimlilar ro'yxati yuklanmoqda...</p>
              </div>
            ) : favoriteMangas.length === 0 ? (
              <div className={styles.emptyBox}>
                <Heart size={40} style={{ color: '#f43f5e' }} />
                <h3 className={styles.emptyTitle}>Sevimli mangalar yo'q</h3>
                <p className={styles.emptyDesc}>
                  Manga sahifasidagi "Saqlash" tugmasini bosib, sevimli asarlaringizni ushbu ro'yxatga qo'shishingiz mumkin.
                </p>
                <Link to="/katalog" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Katalogga o'tish
                </Link>
              </div>
            ) : (
              <div className={styles.favoritesGrid}>
                {favoriteMangas.map((m) => (
                  <MangaCard key={m.id} manga={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. Notices Tab ─────────────────────────────────────────── */}
        {activeTab === 'notices' && (
          <div className={styles.emptyBox}>
            <BookOpen size={40} style={{ color: '#a855f7' }} />
            <h3 className={styles.emptyTitle}>E'lonlar</h3>
            <p className={styles.emptyDesc}>
              MangaLive platformasi bo'yicha muhim yangiliklar, yangi tarjimalar va e'lonlar bu yerda aks ettiriladi.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
