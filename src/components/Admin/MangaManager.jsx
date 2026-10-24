import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit3, Trash2, ExternalLink, Image,
  CheckCircle, AlertCircle, RefreshCw, X, Upload
} from 'lucide-react';
import {
  fetchAdminMangas,
  createManga,
  updateManga,
  deleteManga,
  fetchAllGenres,
  uploadMangaCover
} from '../../services/adminService.js';
import styles from './MangaManager.module.css';

const DEFAULT_MANGA_FORM = {
  title: '',
  titleEn: '',
  slug: '',
  author: 'Noma\'lum',
  artist: '',
  type: 'manga',
  status: 'davom etmoqda',
  rating: 0.0,
  synopsis: '',
  featuredTagline: '',
  isFeatured: false,
  isPopular: false,
  isNew: false,
  coverUrl: '',
  bannerUrl: '',
  genreIds: [],
};

export default function MangaManager({ onSelectMangaForChapters }) {
  const [mangas, setMangas] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManga, setEditingManga] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_MANGA_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Source connector preview state
  const [syncPreview, setSyncPreview] = useState(null);
  const [fetchingSync, setFetchingSync] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Deletion modal state
  const [deletingManga, setDeletingManga] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mangaList, genreList] = await Promise.all([
        fetchAdminMangas(),
        fetchAllGenres(),
      ]);
      setMangas(mangaList);
      setGenres(genreList);
    } catch (err) {
      setError(err.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingManga(null);
    setFormData(DEFAULT_MANGA_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (manga) => {
    setEditingManga(manga);
    // Find matching genre IDs
    const currentGenreIds = genres
      .filter((g) => manga.genres?.includes(g.slug) || manga.genres?.includes(g.name))
      .map((g) => g.id);

    let authorVal = manga.author || '';
    let artistVal = '';
    if (authorVal.includes(' / ')) {
      const parts = authorVal.split(' / ');
      authorVal = parts[0];
      artistVal = parts.slice(1).join(' / ');
    } else if (authorVal.includes(' & ')) {
      const parts = authorVal.split(' & ');
      authorVal = parts[0];
      artistVal = parts.slice(1).join(' & ');
    }

    setFormData({
      title: manga.title || '',
      titleEn: manga.titleEn || '',
      slug: manga.slug || manga.id || '',
      author: authorVal || 'Noma\'lum',
      artist: artistVal,
      type: manga.type || 'manga',
      status: manga.status || 'davom etmoqda',
      rating: manga.rating || 0.0,
      synopsis: manga.synopsis || '',
      featuredTagline: manga.featuredTagline || '',
      isFeatured: Boolean(manga.isFeatured),
      isPopular: Boolean(manga.isPopular),
      isNew: Boolean(manga.isNew),
      coverUrl: manga.coverImage || '',
      bannerUrl: manga.bannerImage || '',
      genreIds: currentGenreIds,
    });
    setIsModalOpen(true);
  };

  const handleTitleChange = (val) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !editingManga ? autoSlug : prev.slug,
    }));
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`Muqova rasmi 5 MB dan oshmasligi kerak (tanlangan fayl: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      if (e.target) e.target.value = '';
      return;
    }

    // Validate format (JPG, PNG, WebP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const isAllowedExt = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setError("Faqat JPG, PNG yoki WebP formatidagi muqova rasmlari qabul qilinadi.");
      if (e.target) e.target.value = '';
      return;
    }

    const slug = formData.slug || 'temp-manga';
    setUploadingCover(true);
    setError(null);

    try {
      const publicUrl = await uploadMangaCover(file, slug);
      setFormData((prev) => ({ ...prev, coverUrl: publicUrl }));
      setSuccessMsg('Muqova muvaffaqiyatli yuklandi!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Muqova yuklashda xatolik yuz berdi');
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, coverUrl: '' }));
  };

  const toggleGenre = (genreId) => {
    setFormData((prev) => {
      const exists = prev.genreIds.includes(genreId);
      return {
        ...prev,
        genreIds: exists
          ? prev.genreIds.filter((id) => id !== genreId)
          : [...prev.genreIds, genreId],
      };
    });
  };

  const handleFetchPreview = async () => {
    const slug = (formData.slug || editingManga?.slug || '').trim();
    if (!slug) {
      setSyncError('Oldin URL Slug maydonini to\'ldiring');
      return;
    }
    setFetchingSync(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/connector/preview?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Manbadan ma\'lumot olib bo\'lmadi');
      }
      setSyncPreview(data.preview);
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setFetchingSync(false);
    }
  };

  const handleApplyPreview = async () => {
    if (!syncPreview) return;
    const { incoming, coverAsset } = syncPreview;

    // Upload cover to R2 if available and high quality
    let newCoverUrl = formData.coverUrl;
    if (coverAsset && coverAsset.width >= 300) {
      try {
        const syncRes = await fetch('/api/connector/sync-manga', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: syncPreview.slug, uploadCover: true }),
        });
        const syncData = await syncRes.json();
        if (syncData.coverUpload?.publicUrl) {
          newCoverUrl = syncData.coverUpload.publicUrl;
        }
      } catch (e) {
        console.warn('Cover sync warning:', e);
      }
    }

    // Match genre IDs from incoming tags
    const matchedGenreIds = genres
      .filter((g) => incoming.genres?.includes(g.slug) || incoming.genres?.includes(g.name))
      .map((g) => g.id);

    setFormData((prev) => ({
      ...prev,
      title: (incoming.title && incoming.title.trim()) ? incoming.title.trim() : prev.title,
      titleEn: (incoming.titleEn && incoming.titleEn.trim().length > 1) ? incoming.titleEn.trim() : prev.titleEn,
      author: incoming.author || prev.author,
      artist: incoming.artist || prev.artist,
      type: incoming.type || prev.type,
      status: incoming.status || prev.status,
      synopsis: incoming.synopsis || prev.synopsis,
      coverUrl: newCoverUrl || prev.coverUrl,
      genreIds: matchedGenreIds.length > 0 ? matchedGenreIds : prev.genreIds,
    }));

    setSyncPreview(null);
    setSuccessMsg('Manba metama\'lumotlari va R2 muqovasi muvaffaqiyatli qo\'llandi!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Manga sarlavhasi kiritilishi shart');
      return;
    }

    setSubmitting(true);
    setError(null);

    const fullAuthor = formData.artist?.trim()
      ? `${formData.author.trim()} / ${formData.artist.trim()}`
      : (formData.author.trim() || 'Noma\'lum');

    const payload = {
      ...formData,
      author: fullAuthor,
    };

    try {
      if (editingManga) {
        await updateManga(editingManga.id, payload);
        setSuccessMsg(`"${formData.title}" muvaffaqiyatli yangilandi!`);
      } else {
        await createManga(payload);
        setSuccessMsg(`"${formData.title}" muvaffaqiyatli yaratildi!`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Manga saqlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (manga) => {
    setDeletingManga(manga);
  };

  const handleConfirmDelete = async () => {
    if (!deletingManga) return;
    setDeletingLoading(true);
    setError(null);
    try {
      await deleteManga(deletingManga.id);
      setSuccessMsg(`"${deletingManga.title}" muvaffaqiyatli o'chirildi.`);
      setDeletingManga(null);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'O\'chirishda xatolik');
    } finally {
      setDeletingLoading(false);
    }
  };

  const filteredMangas = mangas.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
      m.author.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.container}>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Manga qidirish (nomi, muallif, slug)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadData}
            disabled={loading}
            title="Qayta yuklash"
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            <span>Yangilash</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={15} />
            <span>Yangi Manga</span>
          </button>
        </div>
      </div>

      {/* ── Alerts ────────────────────────────────────────────────── */}
      {successMsg && (
        <div className={styles.successBanner} role="status">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className={styles.closeAlertBtn}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Manga Table ───────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderInfo}>
          <span className={styles.countText}>
            Jami: <strong>{filteredMangas.length}</strong> ta manga
          </span>
        </div>

        {loading ? (
          <div className={styles.loadingArea}>
            <RefreshCw size={24} className={styles.spinning} />
            <p>Ma'lumotlar yuklanmoqda...</p>
          </div>
        ) : filteredMangas.length === 0 ? (
          <div className={styles.emptyArea}>
            <p>Hech qanday manga topilmadi.</p>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={14} />
              Birinchi mangani qo'shish
            </button>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Muqova</th>
                  <th>Asar nomi & Slug</th>
                  <th>Tur / Holat</th>
                  <th>Boblar</th>
                  <th>Ko'rishlar</th>
                  <th>Holatlar</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredMangas.map((m) => (
                  <tr key={m.id}>
                    <td className={styles.coverCell}>
                      {m.coverImage ? (
                        <img src={m.coverImage} alt={m.title} className={styles.coverThumb} />
                      ) : (
                        <div className={styles.noCoverPlaceholder}>
                          <Image size={16} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.titleCol}>
                        <strong className={styles.mangaTitle}>{m.title}</strong>
                        {m.titleEn && <span className={styles.titleEn}>{m.titleEn}</span>}
                        <code className={styles.slugCode}>{m.slug || m.id}</code>
                        <span className={styles.authorName}>{m.author}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.badgeCol}>
                        <span className={styles.typeBadge}>{m.type.toUpperCase()}</span>
                        <span className={`${styles.statusBadge} ${m.status === 'davom etmoqda' ? styles.ongoing : styles.completed}`}>
                          {m.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.chapterCountLink}
                        onClick={() => onSelectMangaForChapters?.(m)}
                        title="Boblar ro'yxatini boshqarish"
                      >
                        <strong>{m.chapters}</strong> ta bob
                      </button>
                    </td>
                    <td>{m.views.toLocaleString()}</td>
                    <td>
                      <div className={styles.flagCol}>
                        {m.isFeatured && <span className={styles.flagFeatured}>Tavsiya</span>}
                        {m.isPopular && <span className={styles.flagPopular}>Mashhur</span>}
                        {m.isNew && <span className={styles.flagNew}>Yangi</span>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => onSelectMangaForChapters?.(m)}
                          title="Boblar boshqaruvi"
                        >
                          Boblar
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openEditModal(m)}
                          title="Tahrirlash"
                        >
                          <Edit3 size={14} />
                        </button>
                        <a
                          href={`/manga/${m.slug || m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionBtn}
                          title="Saytda ko'rish"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteClick(m)}
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────────── */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingManga ? 'Mangani Tahrirlash' : 'Yangi Manga Qo\'shish'}</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {/* Mangabox Public Connector Auto-Sync & Preview Bar */}
              <div className={styles.syncBar}>
                <span>Manbadan (Mangabox) avto-to'ldirish va sifatli muqovani olish:</span>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleFetchPreview}
                  disabled={fetchingSync}
                >
                  <RefreshCw size={13} className={fetchingSync ? styles.spinning : ''} />
                  <span>{fetchingSync ? 'Yuklanmoqda...' : 'Ko\'rib chiqish (Preview)'}</span>
                </button>
              </div>

              {syncError && (
                <div className={styles.errorBanner} role="alert">
                  <AlertCircle size={14} />
                  <span>{syncError}</span>
                  <button type="button" onClick={() => setSyncError(null)} className={styles.closeAlertBtn}>
                    <X size={12} />
                  </button>
                </div>
              )}

              {syncPreview && (
                <div className={styles.syncPreviewModal}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '0.9rem' }}>
                    Manbadan topilgan ma'lumotlar (Preview):
                  </h4>
                  <div className={styles.syncPreviewGrid}>
                    {syncPreview.incoming.coverUrl && (
                      <img
                        src={syncPreview.incoming.coverUrl}
                        alt="Preview cover"
                        className={styles.syncCoverThumb}
                      />
                    )}
                    <div className={styles.syncDetails}>
                      <div><strong>Nomi:</strong> {syncPreview.incoming.title}</div>
                      <div><strong>Inglizcha:</strong> {syncPreview.incoming.titleEn || '(Mavjud emas)'}</div>
                      <div><strong>Muallif:</strong> {syncPreview.incoming.author}</div>
                      <div><strong>Turi / Holati:</strong> {syncPreview.incoming.type} / {syncPreview.incoming.status}</div>
                      <div><strong>Janrlar:</strong> {syncPreview.incoming.genres.join(', ')}</div>
                      <div><strong>Muqova sifati:</strong> {syncPreview.diff.cover.incomingDimensions} ({syncPreview.diff.cover.incomingSizeKb} KB, {syncPreview.diff.cover.incomingFormat})</div>
                      <div><strong>Mavjud boblar:</strong> {syncPreview.incoming.totalChaptersAvailable} ta bob</div>
                    </div>
                  </div>
                  <div className={styles.syncActions}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setSyncPreview(null)}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApplyPreview}
                    >
                      <CheckCircle size={14} />
                      <span>Qo'llash va R2 ga saqlash</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.formGrid}>
                {/* Asosiy ma'lumotlar */}
                <div className={styles.formGroup}>
                  <label>Asar nomi (O'zbekcha) *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Masalan: Tun va Tong"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="nano-mashina"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Xalqaro nomi (English)</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="Night and Dawn"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Muallif (Yozuvchi)</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Muallif ismi"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Rassom (Artist)</label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    placeholder="Rassom / illyustrator ismi"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Asar turi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="manga">Manga</option>
                    <option value="manhwa">Manhwa</option>
                    <option value="manhua">Manhua</option>
                    <option value="komiks">Komiks</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Holati</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="davom etmoqda">Davom etmoqda</option>
                    <option value="tugallangan">Tugallangan</option>
                    <option value="pauza">Pauza</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Reyting (0.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tavsiya taglayni (Hero Banner)</label>
                  <input
                    type="text"
                    value={formData.featuredTagline}
                    onChange={(e) => setFormData({ ...formData, featuredTagline: e.target.value })}
                    placeholder="Masalan: Endi davomi mavjud — 87-bob!"
                  />
                </div>
              </div>

              {/* Muqova Yuklash / URL */}
              <div className={styles.coverUploadSection}>
                <label>Muqova rasmi (JPG, PNG, WebP — maks. 5 MB)</label>
                <div className={styles.coverUploadRow}>
                  <input
                    type="text"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://... yoki fayl tanlang"
                    className={styles.coverUrlInput}
                  />
                  <label className={`btn btn-outline ${styles.fileUploadBtn}`}>
                    <Upload size={14} />
                    <span>{uploadingCover ? 'Yuklanmoqda...' : formData.coverUrl ? 'Almashtirish' : 'Fayl tanlash'}</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {formData.coverUrl && (
                  <div className={styles.coverPreviewArea}>
                    <img src={formData.coverUrl} alt="Cover preview" className={styles.previewThumb} />
                    <div className={styles.previewMeta}>
                      <span className={styles.previewUrl}>{formData.coverUrl}</span>
                      <div className={styles.coverActionBtns}>
                        <button
                          type="button"
                          className={styles.clearCoverBtn}
                          onClick={handleRemoveCover}
                          title="Muqovani olib tashlash"
                        >
                          <Trash2 size={12} />
                          <span>Olib tashlash</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tavsif (Synopsis) */}
              <div className={styles.formGroupFull}>
                <label>Asar tavsifi (Synopsis)</label>
                <textarea
                  rows={4}
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  placeholder="Manga haqida qisqacha ma'lumot..."
                />
              </div>

              {/* Janrlar tanlovi */}
              <div className={styles.genrePickerSection}>
                <label>Janrlar ({formData.genreIds.length} ta tanlandi)</label>
                <div className={styles.genreChips}>
                  {genres.map((g) => {
                    const isSelected = formData.genreIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`${styles.genreChip} ${isSelected ? styles.genreChipSelected : ''}`}
                        onClick={() => toggleGenre(g.id)}
                      >
                        {g.icon && <span>{g.icon}</span>}
                        <span>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bayroqlar (Flags) */}
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Asosiy bannerda tavsiya etilsin (is_featured)</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                  <span>Mashhurlar ro'yxatida ko'rinsin (is_popular)</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  />
                  <span>Yangi asar deb belgilansin (is_new)</span>
                </label>
              </div>

              {/* Modal harakatlar */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saqlanmoqda...' : editingManga ? 'O\'zgarishlarni saqlash' : 'Manga yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deletion Confirmation Modal ── */}
      {deletingManga && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                Mangani o'chirish
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => !deletingLoading && setDeletingManga(null)}
                disabled={deletingLoading}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {deletingManga.coverImage && (
                  <img
                    src={deletingManga.coverImage}
                    alt={deletingManga.title}
                    style={{ width: '56px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>{deletingManga.title}</h3>
                  {deletingManga.titleEn && (
                    <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#94a3b8' }}>{deletingManga.titleEn}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#c084fc' }}>
                    {deletingManga.chapters || 0} ta bob mavjud
                  </p>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.875rem', color: '#fca5a5', lineHeight: 1.5 }}>
                ⚠️ <strong>Diqqat:</strong> Ushbu amal qaytarilmas bo'lib, bazadagi ushbu mangaga tegishli barcha boblar va sahifa yozuvlari butunlay o'chiriladi.
              </p>

              <div className={styles.modalActions} style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDeletingManga(null)}
                  disabled={deletingLoading}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleConfirmDelete}
                  disabled={deletingLoading}
                >
                  {deletingLoading ? (
                    <>
                      <RefreshCw size={14} className={styles.spinning} />
                      O'chirilmoqda...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      O'chirishni tasdiqlash
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
