import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Heart,
  History,
  BookOpen,
  Settings,
  LogOut,
  Sparkles,
  Play,
  Check,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getReadingHistory, getFavorites } from '../services/userService.js';
import { fetchMangaById } from '../services/mangaService.js';
import MangaCard from '../components/MangaCard/MangaCard.jsx';
import styles from './ProfilePage.module.css';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Phoenix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Hunter',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Ninja',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber',
];

export default function ProfilePage() {
  const { user, signOut, updateProfile, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('continue');
  const [historyItems, setHistoryItems] = useState([]);
  const [favoriteMangas, setFavoriteMangas] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  // Profile Edit State
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setDisplayName(user.user_metadata.full_name || '');
      setSelectedAvatar(user.user_metadata.avatar_url || AVATAR_PRESETS[0]);
    }
  }, [user]);

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
        console.error('[ProfilePage] Fav load error:', err);
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

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        fullName: displayName,
        avatarUrl: selectedAvatar,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

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
    <main className={styles.main}>
      <div className={`container ${styles.container}`}>
        {/* ── Top Header / User Summary ───────────────────────────────── */}
        <div className={styles.userCard}>
          <div className={styles.avatarWrap}>
            <img
              src={selectedAvatar || user?.user_metadata?.avatar_url || AVATAR_PRESETS[0]}
              alt="Avatar"
              className={styles.avatarImg}
            />
          </div>

          <div className={styles.userInfo}>
            <h1 className={styles.userName}>
              {user ? (user.user_metadata?.full_name || 'MangaLive foydalanuvchisi') : 'Mehmon Kitobxon'}
            </h1>
            <p className={styles.userEmail}>
              {user ? user.email : "Mehmon holatida o'qilmoqda"}
            </p>
            <div className={styles.statsBadges}>
              <span className={styles.badge}>
                <History size={13} /> {historyItems.length} ta o'qilgan manga
              </span>
              <span className={styles.badge}>
                <Heart size={13} /> {getFavorites().length} ta sevimli
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className={styles.signOutBtn}
                title="Hisobdan chiqish"
              >
                <LogOut size={16} />
                <span>Chiqish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className={`btn btn-primary ${styles.loginActionBtn}`}
              >
                <Sparkles size={16} />
                <span>Hisob yaratish</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────────────────── */}
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'continue' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('continue')}
          >
            <Play size={16} />
            <span>Davom ettirish</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={16} />
            <span>Sevimlilar ({getFavorites().length})</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>Tarix ({historyItems.length})</span>
          </button>
          {user && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.activeTabBtn : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} />
              <span>Profil sozlamalari</span>
            </button>
          )}
        </div>

        {/* ── Tab Content ────────────────────────────────────────────── */}
        <div className={styles.tabContent}>
          {/* 1. Continue Reading */}
          {activeTab === 'continue' && (
            <div className={styles.sectionWrap}>
              {historyItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpen size={48} className={styles.emptyIcon} />
                  <h3>O'qish tarixi bo'sh</h3>
                  <p>Siz hali hech qaysi mangani o'qishni boshlamadingiz.</p>
                  <Link to="/katalog" className="btn btn-primary" style={{ marginTop: 12 }}>
                    Katalogni ko'rish
                  </Link>
                </div>
              ) : (
                <div className={styles.historyGrid}>
                  {historyItems.map((item) => (
                    <div key={item.mangaId} className={styles.continueCard}>
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardTitle}>{item.mangaTitle}</h3>
                        <div className={styles.cardMeta}>
                          <span className={styles.chapterTag}>{item.chapterNumber}-bob</span>
                          <span className={styles.cardTime}>{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                      <Link
                        to={`/manga/${item.mangaSlug || item.mangaId}/chapter/${item.chapterNumber}`}
                        className={`btn btn-primary ${styles.continueBtn}`}
                      >
                        <Play size={14} />
                        <span>O'qish</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Favorites */}
          {activeTab === 'favorites' && (
            <div className={styles.sectionWrap}>
              {favLoading ? (
                <div className={styles.emptyState}>
                  <Loader2 size={36} className={styles.spinner} />
                  <p>Sevimlilar yuklanmoqda...</p>
                </div>
              ) : favoriteMangas.length === 0 ? (
                <div className={styles.emptyState}>
                  <Heart size={48} className={styles.emptyIcon} />
                  <h3>Sevimlilar ro'yxati bo'sh</h3>
                  <p>Manga sahifasidagi yurakcha tugmasini bosib saqlab qo'yishingiz mumkin.</p>
                  <Link to="/katalog" className="btn btn-primary" style={{ marginTop: 12 }}>
                    Manga tanlash
                  </Link>
                </div>
              ) : (
                <div className={styles.mangaGrid}>
                  {favoriteMangas.map((manga) => (
                    <MangaCard key={manga.id} manga={manga} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Detailed Reading History */}
          {activeTab === 'history' && (
            <div className={styles.sectionWrap}>
              {historyItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <History size={48} className={styles.emptyIcon} />
                  <h3>Tarix mavjud emas</h3>
                  <p>Barcha o'qigan boblaringiz shu yerda ro'yxatga olinadi.</p>
                </div>
              ) : (
                <div className={styles.historyList}>
                  {historyItems.map((item, idx) => (
                    <div key={`${item.mangaId}-${idx}`} className={styles.historyRow}>
                      <div className={styles.historyRowMain}>
                        <Link to={`/manga/${item.mangaSlug || item.mangaId}`} className={styles.historyTitleLink}>
                          {item.mangaTitle}
                        </Link>
                        <div className={styles.historySub}>
                          <span>Oxirgi o'qilgan: <strong>{item.chapterNumber}-bob</strong></span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                      <Link
                        to={`/manga/${item.mangaSlug || item.mangaId}/chapter/${item.chapterNumber}`}
                        className={styles.historyActionLink}
                      >
                        Davom etish →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Settings / Edit Profile */}
          {activeTab === 'settings' && user && (
            <div className={styles.settingsWrap}>
              <form onSubmit={handleSaveProfile} className={styles.settingsForm}>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Avatarni tanlang</h3>
                  <div className={styles.avatarGrid}>
                    {AVATAR_PRESETS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`${styles.avatarOption} ${selectedAvatar === av ? styles.selectedAvatar : ''}`}
                      >
                        <img src={av} alt="Avatar" />
                        {selectedAvatar === av && (
                          <div className={styles.avatarCheck}>
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formSection}>
                  <label htmlFor="display-name" className={styles.inputLabel}>
                    Ko'rinadigan ism / Taxallus
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={styles.settingsInput}
                    placeholder="Ismingizni kiriting"
                  />
                </div>

                <div className={styles.formSection}>
                  <label className={styles.inputLabel}>Email (O'zgartirib bo'lmaydi)</label>
                  <input
                    type="text"
                    disabled
                    value={user.email || ''}
                    className={`${styles.settingsInput} ${styles.disabledInput}`}
                  />
                </div>

                {saveSuccess && (
                  <div className={styles.successAlert}>
                    <Check size={16} />
                    <span>Profil ma'lumotlari muvaffaqiyatli saqlandi!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className={`btn btn-primary ${styles.saveBtn}`}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <span>O'zgarishlarni saqlash</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
