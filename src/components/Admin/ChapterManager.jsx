import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, RefreshCw, CheckCircle,
  AlertCircle, X, BookOpen, Layers
} from 'lucide-react';
import {
  fetchAdminMangas,
  fetchMangaChapters,
  createChapter,
  updateChapter,
  deleteChapter,
} from '../../services/adminService.js';
import styles from './ChapterManager.module.css';

export default function ChapterManager({ initialManga, onNavigateToBulkPages }) {
  const [mangas, setMangas] = useState([]);
  const [selectedManga, setSelectedManga] = useState(initialManga || null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({
    chapterNumber: 1,
    title: '',
    pagesCount: 0,
    publishedAt: new Date().toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);

  // Load mangas list for selector
  useEffect(() => {
    async function loadMangaOptions() {
      try {
        const list = await fetchAdminMangas();
        setMangas(list);
        if (!selectedManga && list.length > 0) {
          setSelectedManga(list[0]);
        }
      } catch (err) {
        setError(err.message);
      }
    }
    loadMangaOptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChapters = useCallback(async (mangaId) => {
    if (!mangaId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMangaChapters(mangaId);
      setChapters(data);
    } catch (err) {
      setError(err.message || 'Boblar yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedManga?.id) {
      loadChapters(selectedManga.id);
    }
  }, [selectedManga, loadChapters]);

  const openCreateModal = () => {
    const nextNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;
    setEditingChapter(null);
    setFormData({
      chapterNumber: nextNum,
      title: `${nextNum}-bob`,
      pagesCount: 0,
      publishedAt: new Date().toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ch) => {
    setEditingChapter(ch);
    setFormData({
      chapterNumber: ch.number,
      title: ch.title,
      pagesCount: ch.pageCount || 0,
      publishedAt: ch.publishedAt ? new Date(ch.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedManga) return;

    if (formData.chapterNumber === '' || Number.isNaN(Number(formData.chapterNumber)) || Number(formData.chapterNumber) < 0) {
      setError("Bob raqami 0 yoki undan katta bo'lishi shart");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        mangaId: selectedManga.id,
        chapterNumber: Number(formData.chapterNumber),
        title: formData.title.trim(),
        pagesCount: Number(formData.pagesCount || 0),
        publishedAt: new Date(formData.publishedAt).toISOString(),
      };

      if (editingChapter) {
        await updateChapter(editingChapter.id, payload);
        setSuccessMsg(`${payload.chapterNumber}-bob muvaffaqiyatli yangilandi!`);
      } else {
        await createChapter(payload);
        setSuccessMsg(`${payload.chapterNumber}-bob muvaffaqiyatli yaratildi!`);
      }

      setIsModalOpen(false);
      loadChapters(selectedManga.id);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Bobni saqlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ch) => {
    if (!window.confirm(`Haqiqatan ham ${ch.number}-bobni o'chirmoqchimisiz?`)) {
      return;
    }

    try {
      await deleteChapter(ch.id);
      setSuccessMsg(`${ch.number}-bob o'chirildi.`);
      loadChapters(selectedManga.id);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'O\'chirishda xatolik');
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Manga Selector Bar ───────────────────────────────────── */}
      <div className={styles.mangaSelectorCard}>
        <div className={styles.selectorLeft}>
          <BookOpen size={18} className={styles.mangaIcon} />
          <div className={styles.selectorText}>
            <label htmlFor="manga-select">Tanlangan manga:</label>
            <select
              id="manga-select"
              value={selectedManga?.id || ''}
              onChange={(e) => {
                const found = mangas.find((m) => m.id === e.target.value);
                if (found) setSelectedManga(found);
              }}
              className={styles.mangaSelectDropdown}
            >
              {mangas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.slug}) — {m.chapters} ta bob
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => selectedManga && loadChapters(selectedManga.id)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            <span>Yangilash</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={!selectedManga}
          >
            <Plus size={15} />
            <span>Yangi bob qo'shish</span>
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

      {/* ── Chapters Table ────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderInfo}>
          <span>
            {selectedManga?.title} boblari ro'yxati (Jami: <strong>{chapters.length}</strong> ta)
          </span>
        </div>

        {loading ? (
          <div className={styles.loadingArea}>
            <RefreshCw size={24} className={styles.spinning} />
            <p>Boblar yuklanmoqda...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className={styles.emptyArea}>
            <p>Ushbu mangada hozircha birorta bob yo'q.</p>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={14} />
              Birinchi bobni kiritish
            </button>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bob №</th>
                  <th>Sarlavha</th>
                  <th>Sahifalar</th>
                  <th>Chiqarilgan sana</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <span className={styles.chapterNumBadge}>
                        {ch.number}-bob
                      </span>
                    </td>
                    <td>
                      <strong className={styles.chapterTitle}>{ch.title}</strong>
                    </td>
                    <td>
                      <span className={styles.pagesBadge}>
                        {ch.pageCount || 0} ta sahifa
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {ch.publishedAt ? new Date(ch.publishedAt).toLocaleDateString('uz-UZ') : '—'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.pagesUploadBtn}
                          onClick={() => onNavigateToBulkPages?.(selectedManga, ch)}
                          title="Sahifa rasmlarini yuklash (ZIP / Bulk)"
                        >
                          <Layers size={13} />
                          <span>Sahifalar / ZIP</span>
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openEditModal(ch)}
                          title="Tahrirlash"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(ch)}
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

      {/* ── Create / Edit Chapter Modal ───────────────────────────── */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingChapter ? 'Bobni Tahrirlash' : 'Yangi Bob Qo\'shish'}</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Bob raqami *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.chapterNumber}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10);
                    const num = Number.isNaN(raw) ? 0 : raw;
                    setFormData({
                      ...formData,
                      chapterNumber: num,
                      title: !editingChapter ? `${num}-bob` : formData.title,
                    });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Bob nomi *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masalan: 1-bob: Boshlanish"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sahifalar soni</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pagesCount}
                  onChange={(e) => setFormData({ ...formData, pagesCount: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Chiqarilgan vaqti (Published At)</label>
                <input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                />
              </div>

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
                  {submitting ? 'Saqlanmoqda...' : editingChapter ? 'O\'zgarishlarni saqlash' : 'Bob yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
