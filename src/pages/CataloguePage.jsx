import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, Flame, Eye, Clock, X, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import MangaCard from '../components/MangaCard/MangaCard.jsx';
import CoverImage from '../components/CoverImage/CoverImage.jsx';
import EmptyState from '../components/EmptyState/EmptyState.jsx';
import { getMangaList } from '../services/mangaService.js';
import { GENRES } from '../services/genreService.js';
import styles from './CataloguePage.module.css';

const SORTS = [
  { id: 'reyting',    label: 'Reyting',    icon: Star },
  { id: 'mashhur',    label: 'Mashhur',    icon: Flame },
  { id: 'yangilangan',label: 'Yangilangan',icon: Clock },
  { id: 'korishlar',  label: "Ko'rishlar", icon: Eye },
];

const FORMAT_TYPES = [
  { id: 'barchasi', label: 'Barchasi' },
  { id: 'manhwa',   label: 'Manhwa' },
  { id: 'manga',    label: 'Manga' },
  { id: 'manhua',   label: 'Manhua' },
  { id: 'komiks',   label: 'Komiks' },
];

const STATUSES = [
  { id: 'barchasi',       label: 'Barchasi' },
  { id: 'davom etmoqda',  label: 'Davom etmoqda' },
  { id: 'tugallangan',    label: 'Tugallangan' },
  { id: 'pauza',          label: 'Pauza' },
];

const RATING_FILTERS = [
  { id: '0',   label: 'Barchasi' },
  { id: '4.0', label: '4.0+ ★ (AniList 8.0+)' },
  { id: '3.5', label: '3.5+ ★ (AniList 7.0+)' },
  { id: '3.0', label: '3.0+ ★ (AniList 6.0+)' },
];

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery]           = useState(searchParams.get('q') ?? '');
  const [genre, setGenre]           = useState(searchParams.get('janr') ?? 'barchasi');
  const [type, setType]             = useState(searchParams.get('tur') ?? 'barchasi');
  const [status, setStatus]         = useState('barchasi');
  const [minRating, setMinRating]   = useState('0');
  const [sort, setSort]             = useState('reyting');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Live real data state (no fake fallback lists)
  const [mangaList, setMangaList]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dbError, setDbError]       = useState(null);

  // Sync URL params
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const j = searchParams.get('janr') ?? 'barchasi';
    const t = searchParams.get('tur') ?? 'barchasi';
    setQuery(q);
    setGenre(j);
    setType(t);
  }, [searchParams]);

  // Fetch data whenever filters change
  const fetchData = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const data = await getMangaList({ query, genre, type, status, minRating, sort });
      setMangaList(data || []);
    } catch (err) {
      console.error('[CataloguePage] Fetch failed:', err);
      setDbError(err.message || 'Ma\'lumotlar bazasidan yuklashda xatolik yuz berdi.');
      setMangaList([]);
    } finally {
      setLoading(false);
    }
  }, [query, genre, type, status, minRating, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const results = mangaList;
  const displayedResults = results.slice(0, visibleCount);

  // Top Mangas for Desktop Sidebar Ranking (computed from real data)
  const topMangas = [...mangaList]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setVisibleCount(12);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (genre && genre !== 'barchasi') params.janr = genre;
    if (type && type !== 'barchasi') params.tur = type;
    setSearchParams(params);
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    setVisibleCount(12);
  };

  const clearFilters = () => {
    setQuery('');
    setGenre('barchasi');
    setType('barchasi');
    setStatus('barchasi');
    setMinRating('0');
    setSort('reyting');
    setVisibleCount(12);
    setSearchParams({});
  };

  const hasActiveFilters =
    query || genre !== 'barchasi' || type !== 'barchasi' || status !== 'barchasi' || minRating !== '0';

  return (
    <main className={styles.cataloguePage}>
      <div className="container">
        {/* ── Database error banner ──────────────────────────────────── */}
        {dbError && (
          <div className={styles.dbErrorBanner} role="alert">
            <AlertTriangle size={16} />
            <span>Ma'lumotlar bazasi xatoligi: {dbError}</span>
            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchData}
              style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px', marginLeft: 'auto' }}
            >
              <RefreshCw size={12} />
              <span>Qayta urinish</span>
            </button>
          </div>
        )}

        {/* ── Top Toolbar ────────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <div className={styles.titleArea}>
            <h1 className={styles.catalogueTitle}>Barcha Mangalar</h1>
            <span className={styles.totalBadge}>{loading ? '…' : results.length}</span>
          </div>

          <div className={styles.toolbarActions}>
            {/* Search Input Field */}
            <form className={styles.searchBox} onSubmit={handleSearchSubmit} role="search">
              <Search size={14} className={styles.searchBoxIcon} />
              <input
                type="search"
                className={styles.searchBoxInput}
                placeholder="Nom, muallif, janr..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                aria-label="Katalogdan qidirish"
              />
              {query && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => handleQueryChange('')}
                  aria-label="Qidiruvni tozalash"
                >
                  <X size={12} />
                </button>
              )}
            </form>

            {/* Sort Tabs */}
            <div className={styles.sortGroup}>
              {SORTS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.sortBtn} ${sort === s.id ? styles.activeSortBtn : ''}`}
                    onClick={() => handleSortChange(s.id)}
                  >
                    <Icon size={13} className={styles.sortIcon} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              className={`${styles.filterTrigger} ${filtersOpen || hasActiveFilters ? styles.filterActive : ''}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={14} />
              <span>Filtrlar</span>
              {hasActiveFilters && <span className={styles.filterDot} />}
            </button>
          </div>
        </div>

        {/* ── Collapsible Filter Panel ───────────────────────────────── */}
        {filtersOpen && (
          <div className={styles.filterDrawer}>
            <div className={styles.filterDrawerHeader}>
              <span className={styles.filterDrawerTitle}>Qidiruv va saralash parametrlari</span>
              {hasActiveFilters && (
                <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                  <X size={13} />
                  <span>Filtrlarni tozalash</span>
                </button>
              )}
            </div>

            <div className={styles.filterSectionsGrid}>
              {/* Type / Format */}
              <div className={styles.filterSection}>
                <label className={styles.filterSectionLabel}>Turi</label>
                <div className={styles.pillRow}>
                  {FORMAT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.pillBtn} ${type === t.id ? styles.activePillBtn : ''}`}
                      onClick={() => { setType(t.id); setVisibleCount(12); }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className={styles.filterSection}>
                <label className={styles.filterSectionLabel}>Holati</label>
                <div className={styles.pillRow}>
                  {STATUSES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`${styles.pillBtn} ${status === st.id ? styles.activePillBtn : ''}`}
                      onClick={() => { setStatus(st.id); setVisibleCount(12); }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Rating */}
              <div className={styles.filterSection}>
                <label className={styles.filterSectionLabel}>Minimal Reyting</label>
                <div className={styles.pillRow}>
                  {RATING_FILTERS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`${styles.pillBtn} ${minRating === r.id ? styles.activePillBtn : ''}`}
                      onClick={() => { setMinRating(r.id); setVisibleCount(12); }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Pills */}
              <div className={styles.filterSection}>
                <label className={styles.filterSectionLabel}>Janr</label>
                <div className={styles.pillRow}>
                  {GENRES.map((g) => (
                    <button
                      key={g.slug}
                      type="button"
                      className={`${styles.pillBtn} ${genre === g.slug ? styles.activePillBtn : ''}`}
                      onClick={() => { setGenre(g.slug); setVisibleCount(12); }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile / Drawer Apply and Reset Actions */}
            <div className={styles.filterDrawerActions}>
              <button
                type="button"
                className={`btn btn-primary ${styles.applyFiltersBtn}`}
                onClick={() => setFiltersOpen(false)}
              >
                Qo'llash ({loading ? '…' : results.length} ta natija)
              </button>
              <button
                type="button"
                className={`btn btn-outline ${styles.resetFiltersBtn}`}
                onClick={clearFilters}
              >
                Tozalash
              </button>
            </div>
          </div>
        )}

        {/* ── Main Layout: Catalog Grid + Desktop Ranking Sidebar ───── */}
        <div className={styles.contentLayout}>
          {/* Main Column */}
          <div className={styles.cardsColumn}>
            {loading ? (
              <div className={styles.loadingGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} aria-hidden="true" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className={styles.mangaGrid}>
                  {displayedResults.map((manga) => (
                    <MangaCard key={manga.id} manga={manga} />
                  ))}
                </div>

                {visibleCount < results.length && (
                  <div className={styles.loadMoreContainer}>
                    <button
                      type="button"
                      className={styles.loadMoreBtn}
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                    >
                      Ko'proq yuklash ({results.length - visibleCount} ta qoldi)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="Hech qanday manga topilmadi"
                description="Tanlangan qidiruv yoki filtrlar bo'yicha asarlar mavjud emas. Filtrlarni tozalab ko'ring."
                actionLabel="Filtrlarni tozalash"
                onAction={clearFilters}
              />
            )}
          </div>

          {/* Right Sidebar: Top Mangalar (Desktop Only) */}
          <aside className={styles.rankingSidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarHeader}>
                <Flame size={16} className={styles.flameIcon} />
                <h2 className={styles.sidebarTitle}>Top mangalar</h2>
              </div>
              <p className={styles.sidebarSubtitle}>Eng yuqori baholangan asarlar</p>

              <div className={styles.topList}>
                {topMangas.map((item, idx) => (
                  <Link
                    key={item.id}
                    to={`/manga/${item.slug || item.id}`}
                    className={styles.topItem}
                  >
                    <span className={`${styles.rankNumber} ${idx === 0 ? styles.rankFirst : ''}`}>
                      {idx + 1}
                    </span>
                    <div className={styles.topThumbWrapper}>
                      <CoverImage
                        src={item.coverImage}
                        alt={item.title}
                        title={item.title}
                        type={item.type}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.topInfo}>
                      <h3 className={styles.topMangaTitle}>{item.title}</h3>
                      <div className={styles.topMeta}>
                        <span className={styles.topType}>{item.type.toUpperCase()}</span>
                        <div className={styles.topRating}>
                          <Star size={11} fill="#fbbf24" color="#fbbf24" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <Link to="/katalog?sort=reyting" className={styles.sidebarFooterLink}>
                <span>To'liq reytingni ko'rish</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
