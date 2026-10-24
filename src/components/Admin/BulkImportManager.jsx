import { useState, useEffect, useRef } from 'react';
import {
  FileText, Archive, Upload, Download, CheckCircle,
  AlertTriangle, RefreshCw, FileCheck, Layers, Info, Trash2,
  ExternalLink, CheckCircle2, XCircle, AlertCircle, Folder
} from 'lucide-react';
import {
  parseCSV,
  getMangaCsvTemplate,
  getChaptersCsvTemplate,
  validateMangaRows,
  validateChapterRows,
  unpackChapterZip,
  uploadChapterPagesBatch,
  executeMangaBulkImport,
  executeChaptersBulkImport,
  getExistingChapterNumbers,
  inspectAndExpandChapterFiles,
  ingestSingleChapterCandidate,
  IMPORT_LIMITS,
} from '../../services/bulkImportService.js';
import { fetchAdminMangas, fetchAllGenres } from '../../services/adminService.js';
import styles from './BulkImportManager.module.css';

export default function BulkImportManager({ initialManga, initialChapter }) {
  const [activeTab, setActiveTab] = useState('multi-archive'); // 'multi-archive' | 'manga-csv' | 'chapters-csv' | 'single-zip'

  // Common state
  const [mangas, setMangas] = useState([]);
  const [genres, setGenres] = useState([]);

  // Manga CSV state
  const [mangaParsedRows, setMangaParsedRows] = useState([]);
  const [mangaSkipDuplicates, setMangaSkipDuplicates] = useState(true);
  const [mangaImporting, setMangaImporting] = useState(false);
  const [mangaProgress, setMangaProgress] = useState(0);
  const [mangaResult, setMangaResult] = useState(null);

  // Chapters CSV state
  const [chapterParsedRows, setChapterParsedRows] = useState([]);
  const [chapterSkipDuplicates, setChapterSkipDuplicates] = useState(true);
  const [chapterImporting, setChapterImporting] = useState(false);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [chapterResult, setChapterResult] = useState(null);

  // Multi-Archive & PDF Chapter Ingestor state
  const [archiveQueue, setArchiveQueue] = useState([]);
  const [archiveOverwrite, setArchiveOverwrite] = useState(false);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [isScanningArchives, setIsScanningArchives] = useState(false);
  const [scanningProgress, setScanningProgress] = useState('');
  const [currentArchiveIdx, setCurrentArchiveIdx] = useState(0);
  const [currentArchiveStage, setCurrentArchiveStage] = useState('extracting'); // 'extracting' | 'converting' | 'uploading'
  const [currentArchivePageProgress, setCurrentArchivePageProgress] = useState(0);
  const [currentStageDetail, setCurrentStageDetail] = useState('');
  const [cancelRequested, setCancelRequested] = useState(false);
  const [multiArchiveReport, setMultiArchiveReport] = useState(null);
  const [bulkAssignMangaId, setBulkAssignMangaId] = useState('');

  // Fallback Single ZIP / Pages state
  const [targetManga, setTargetManga] = useState(initialManga || null);
  const [targetChapterNumber, setTargetChapterNumber] = useState(initialChapter?.number || 1);
  const [zipFilesList, setZipFilesList] = useState([]);
  const [zipUnpacking, setZipUnpacking] = useState(false);
  const [zipUnpackProgress, setZipUnpackProgress] = useState(0);
  const [zipUploading, setZipUploading] = useState(false);
  const [zipUploadProgress, setZipUploadProgress] = useState(0);
  const [zipResult, setZipResult] = useState(null);
  const [zipError, setZipError] = useState(null);

  const mangaFileRef = useRef(null);
  const chaptersFileRef = useRef(null);
  const multiArchiveFileRef = useRef(null);
  const multiArchiveFolderRef = useRef(null);
  const singleZipFileRef = useRef(null);

  useEffect(() => {
    async function initData() {
      try {
        const [mangaList, genreList] = await Promise.all([
          fetchAdminMangas(),
          fetchAllGenres(),
        ]);
        setMangas(mangaList);
        setGenres(genreList);
        if (!targetManga && mangaList.length > 0) {
          setTargetManga(mangaList[0]);
        }
      } catch (err) {
        console.error('[BulkImport] Init error:', err);
      }
    }
    initData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Download templates
  const downloadMangaTemplate = () => {
    const csv = getMangaCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'manga_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadChaptersTemplate = () => {
    const csv = getChaptersCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chapters_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 1. Manga CSV File Change
  const handleMangaFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMPORT_LIMITS.MAX_CSV_FILE_SIZE_BYTES) {
      alert(`Fayl hajmi juda katta (${(file.size / 1024 / 1024).toFixed(1)} MB). Cheklov: 5 MB.`);
      return;
    }

    setMangaResult(null);
    const text = await file.text();
    const rawRows = parseCSV(text);
    const existingSlugs = mangas.map((m) => m.slug || m.id);
    const validated = validateMangaRows(rawRows, existingSlugs);
    setMangaParsedRows(validated);
  };

  // Run Manga CSV Import
  const runMangaImport = async () => {
    if (mangaParsedRows.length === 0) return;
    setMangaImporting(true);
    setMangaProgress(0);
    setMangaResult(null);

    const genreMap = new Map();
    genres.forEach((g) => {
      genreMap.set(g.slug.toLowerCase(), g.id);
      genreMap.set(g.name.toLowerCase(), g.id);
    });

    try {
      const res = await executeMangaBulkImport(mangaParsedRows, {
        skipDuplicates: mangaSkipDuplicates,
        genreNameToIdMap: genreMap,
        onProgress: setMangaProgress,
      });
      setMangaResult(res);
      const refreshed = await fetchAdminMangas();
      setMangas(refreshed);
    } catch (err) {
      setMangaResult({
        inserted: 0,
        updated: 0,
        failed: mangaParsedRows.length,
        errors: [err.message],
      });
    } finally {
      setMangaImporting(false);
    }
  };

  // 2. Chapters CSV File Change
  const handleChaptersFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMPORT_LIMITS.MAX_CSV_FILE_SIZE_BYTES) {
      alert(`Fayl hajmi juda katta (${(file.size / 1024 / 1024).toFixed(1)} MB). Cheklov: 5 MB.`);
      return;
    }

    setChapterResult(null);
    const text = await file.text();
    const rawRows = parseCSV(text);

    const mangaSlugToIdMap = new Map();
    mangas.forEach((m) => {
      if (m.slug) {
        mangaSlugToIdMap.set(m.slug.toLowerCase(), m.id);
      }
    });

    const validated = validateChapterRows(rawRows, mangaSlugToIdMap);
    setChapterParsedRows(validated);
  };

  // Run Chapters CSV Import
  const runChaptersImport = async () => {
    if (chapterParsedRows.length === 0) return;
    setChapterImporting(true);
    setChapterProgress(0);
    setChapterResult(null);

    try {
      const res = await executeChaptersBulkImport(chapterParsedRows, {
        skipDuplicates: chapterSkipDuplicates,
        onProgress: setChapterProgress,
      });
      setChapterResult(res);
    } catch (err) {
      setChapterResult({
        inserted: 0,
        updated: 0,
        failed: chapterParsedRows.length,
        errors: [err.message],
      });
    } finally {
      setChapterImporting(false);
    }
  };

  // =========================================================================
  // PHASE 1: Multi-Archive Chapter Ingestor (CBZ / ZIP)
  // =========================================================================

  const handleMultiArchiveFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setMultiArchiveReport(null);
    setIsScanningArchives(true);
    setScanningProgress(`Fayllar tahlil qilinmoqda (1 / ${files.length})...`);

    try {
      const candidates = await inspectAndExpandChapterFiles(
        files,
        mangas,
        (cur, tot, filename) => {
          setScanningProgress(`Fayllar tahlil qilinmoqda (${cur} / ${tot}): ${filename}`);
        }
      );

      // Cache existing chapters for each manga to check duplicates
      const existingChaptersCache = new Map();

      for (const item of candidates) {
        const hasValidCh = item.chapterNumber !== '' && item.chapterNumber !== null && item.chapterNumber !== undefined && !isNaN(Number(item.chapterNumber));
        if (item.mangaId && hasValidCh && item.status !== 'failed') {
          if (!existingChaptersCache.has(item.mangaId)) {
            const chSet = await getExistingChapterNumbers(item.mangaId, mangas);
            existingChaptersCache.set(item.mangaId, chSet);
          }
          const existingSet = existingChaptersCache.get(item.mangaId);
          if (existingSet && existingSet.has(Number(item.chapterNumber))) {
            item.isDuplicate = true;
          }
        }
      }

      setArchiveQueue((prev) => [...prev, ...candidates]);
    } catch (err) {
      alert(`Arxivlarni tahlil qilishda xatolik: ${err.message}`);
    } finally {
      setIsScanningArchives(false);
      setScanningProgress('');
      if (multiArchiveFileRef.current) {
        multiArchiveFileRef.current.value = '';
      }
      if (multiArchiveFolderRef.current) {
        multiArchiveFolderRef.current.value = '';
      }
    }
  };

  const applyBulkMangaAssignment = async (onlyUnassigned = false) => {
    if (!bulkAssignMangaId) return;
    const targetManga = mangas.find((m) => m.id === bulkAssignMangaId);
    if (!targetManga) return;

    try {
      const existingSet = await getExistingChapterNumbers(targetManga.id, mangas);

      setArchiveQueue((prev) =>
        prev.map((item) => {
          if (onlyUnassigned && item.mangaId) return item;

          const hasValidCh = item.chapterNumber !== '' && item.chapterNumber !== null && item.chapterNumber !== undefined && !isNaN(Number(item.chapterNumber));
          const isDup = hasValidCh ? existingSet.has(Number(item.chapterNumber)) : false;

          return {
            ...item,
            mangaId: targetManga.id,
            mangaSlug: targetManga.slug || targetManga.id,
            isDuplicate: isDup,
          };
        })
      );
    } catch (e) {
      console.warn('[applyBulkMangaAssignment] Error:', e);
    }
  };

  const updateQueueItem = async (id, field, value) => {
    let targetMangaId = null;
    let targetChNum = null;

    setArchiveQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        if (field === 'mangaId') {
          const selected = mangas.find((m) => m.id === value);
          if (selected) {
            updated.mangaSlug = selected.slug;
          }
        }
        if (field === 'chapterNumber' && (value !== '' && value !== null && value !== undefined) && !updated.chapterTitle) {
          updated.chapterTitle = `${value}-bob`;
        }
        targetMangaId = updated.mangaId;
        targetChNum = updated.chapterNumber;
        return updated;
      })
    );

    // Re-check duplicate status asynchronously if manga or chapter number changed
    const hasValidCh = targetChNum !== '' && targetChNum !== null && targetChNum !== undefined && !isNaN(Number(targetChNum));
    if ((field === 'mangaId' || field === 'chapterNumber') && targetMangaId && hasValidCh) {
      try {
        const existingSet = await getExistingChapterNumbers(targetMangaId, mangas);
        const isDup = existingSet.has(Number(targetChNum));
        setArchiveQueue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isDuplicate: isDup } : item))
        );
      } catch (e) {
        console.warn('[updateQueueItem] Duplicate re-check warning:', e);
      }
    }
  };

  const removeQueueItem = (id) => {
    setArchiveQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearQueue = () => {
    setArchiveQueue([]);
    setMultiArchiveReport(null);
  };

  // Run Sequential Multi-Archive & PDF Chapter Ingestion
  const runMultiArchiveIngestion = async ({ retryFailedOnly = false } = {}) => {
    if (archiveQueue.length === 0) return;

    setQueueProcessing(true);
    setCancelRequested(false);
    if (!retryFailedOnly) {
      setMultiArchiveReport(null);
    }

    let succeeded = 0;
    let skipped = 0;
    let failed = 0;
    const itemReports = retryFailedOnly && multiArchiveReport?.items
      ? [...multiArchiveReport.items.filter((it) => it.status !== 'failed')]
      : [];

    for (let i = 0; i < archiveQueue.length; i++) {
      if (cancelRequested) {
        itemReports.push({
          filename: archiveQueue[i].filename,
          status: 'cancelled',
          message: 'Foydalanuvchi tomonidan to\'xtatildi',
        });
        continue;
      }

      const item = archiveQueue[i];

      // If retrying failed only, skip completed or skipped ones
      if (retryFailedOnly && (item.status === 'done' || item.status === 'skipped')) {
        continue;
      }

      setCurrentArchiveIdx(i);
      setCurrentArchivePageProgress(0);
      setCurrentArchiveStage('extracting');
      setCurrentStageDetail('Tayyorlanmoqda...');

      // If item was already flagged as failed during inspection
      if (item.status === 'failed' && !retryFailedOnly) {
        failed++;
        itemReports.push({
          filename: item.filename,
          status: 'failed',
          message: item.error || 'Noto\'g\'ri fayl',
        });
        continue;
      }

      // Validation check before starting upload
      if (!item.mangaId) {
        failed++;
        setArchiveQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'failed', error: 'Manga tanlanmagan' } : q))
        );
        itemReports.push({
          filename: item.filename,
          status: 'failed',
          message: 'Manga tanlanmagan',
        });
        continue;
      }

      const hasValidCh = item.chapterNumber !== '' && item.chapterNumber !== null && item.chapterNumber !== undefined && !isNaN(Number(item.chapterNumber)) && Number(item.chapterNumber) >= 0;
      if (!hasValidCh) {
        failed++;
        setArchiveQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'failed', error: 'Bob raqami noto\'g\'ri (0 yoki undan katta bo\'lishi kerak)' } : q))
        );
        itemReports.push({
          filename: item.filename,
          status: 'failed',
          message: 'Bob raqami noto\'g\'ri (0 yoki undan katta bo\'lishi kerak)',
        });
        continue;
      }

      if (item.isDuplicate && !archiveOverwrite) {
        skipped++;
        setArchiveQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'skipped', error: 'Takroriy bob o\'tkazib yuborildi' } : q))
        );
        itemReports.push({
          filename: item.filename,
          status: 'skipped',
          message: `Bob #${item.chapterNumber} bazada mavjud (o'tkazib yuborildi)`,
        });
        continue;
      }

      // Mark processing
      setArchiveQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, status: 'processing', error: null } : q))
      );

      try {
        const result = await ingestSingleChapterCandidate({
          candidate: item,
          mangaId: item.mangaId,
          mangaSlug: item.mangaSlug,
          chapterNumber: Number(item.chapterNumber),
          chapterTitle: item.chapterTitle,
          overwrite: archiveOverwrite,
          availableMangas: mangas,
          onProgress: (stage, pct, cur, tot) => {
            setCurrentArchiveStage(stage);
            setCurrentArchivePageProgress(pct);
            if (stage === 'converting') {
              setCurrentStageDetail(`PDF WebP ga aylantirilmoqda: ${pct}% (${cur}/${tot} sahifa)`);
            } else if (stage === 'uploading') {
              setCurrentStageDetail(`Sahifalar yuklanmoqda: ${pct}% (${cur}/${tot} sahifa)`);
            } else {
              setCurrentStageDetail('Arxiv ochilmoqda...');
            }
          },
        });

        succeeded++;
        setArchiveQueue((prev) =>
          prev.map((q, idx) =>
            idx === i ? { ...q, status: 'done', uploadedPages: result.pagesCount, error: null } : q
          )
        );
        itemReports.push({
          filename: item.filename,
          mangaSlug: item.mangaSlug,
          chapterNumber: item.chapterNumber,
          pagesCount: result.pagesCount,
          status: 'success',
          message: `${result.pagesCount} ta sahifa yuklandi`,
        });
      } catch (err) {
        failed++;
        setArchiveQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'failed', error: err.message } : q))
        );
        itemReports.push({
          filename: item.filename,
          mangaSlug: item.mangaSlug,
          chapterNumber: item.chapterNumber,
          status: 'failed',
          message: err.message,
        });
      }
    }

    setQueueProcessing(false);
    setMultiArchiveReport((prev) => ({
      total: archiveQueue.length,
      succeeded: retryFailedOnly ? (prev?.succeeded || 0) + succeeded : succeeded,
      skipped: retryFailedOnly ? (prev?.skipped || 0) + skipped : skipped,
      failed: retryFailedOnly ? Math.max(0, (prev?.failed || 0) - succeeded) : failed,
      items: itemReports,
    }));

    // Refresh mangas count
    const refreshed = await fetchAdminMangas();
    setMangas(refreshed);
  };

  // =========================================================================
  // Fallback: Single ZIP File Handler
  // =========================================================================
  const handleSingleZipFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipError(null);
    setZipResult(null);
    setZipFilesList([]);
    setZipUnpacking(true);
    setZipUnpackProgress(0);

    try {
      const extracted = await unpackChapterZip(file, setZipUnpackProgress);
      setZipFilesList(extracted);
    } catch (err) {
      setZipError(err.message);
    } finally {
      setZipUnpacking(false);
    }
  };

  const runSingleZipUpload = async () => {
    if (!targetManga || zipFilesList.length === 0) return;

    setZipUploading(true);
    setZipUploadProgress(0);
    setZipError(null);
    setZipResult(null);

    try {
      const res = await uploadChapterPagesBatch({
        mangaSlug: targetManga.slug || targetManga.id,
        chapterNumber: targetChapterNumber,
        chapterId: null,
        images: zipFilesList,
        onProgress: setZipUploadProgress,
      });
      setZipResult(res);
    } catch (err) {
      setZipError(err.message);
    } finally {
      setZipUploading(false);
    }
  };

  const overallProgress =
    archiveQueue.length > 0
      ? Math.round(((currentArchiveIdx + (currentArchivePageProgress / 100)) / archiveQueue.length) * 100)
      : 0;

  return (
    <div className={styles.container}>
      {/* ── Sub Navigation Tabs ─────────────────────────────────── */}
      <div className={styles.tabNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'multi-archive' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('multi-archive')}
        >
          <Archive size={15} />
          <span>Ommaviy Boblar (ZIP / CBZ / PDF)</span>
          <span className={styles.pillBadge}>Yangi</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'manga-csv' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('manga-csv')}
        >
          <FileText size={15} />
          <span>Manga CSV</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'chapters-csv' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('chapters-csv')}
        >
          <Layers size={15} />
          <span>Boblar CSV</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'single-zip' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('single-zip')}
        >
          <Upload size={15} />
          <span>Yagona Bob (Qo'lda)</span>
        </button>
      </div>

      {/* ── TAB 1: Multi-Archive & PDF Chapter Ingestor ────────── */}
      {activeTab === 'multi-archive' && (
        <div className={styles.tabContent}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <Archive size={16} />
              <span>Ommaviy boblarni (ZIP ichidagi PDF, CBZ, to'g'ridan-to'g'ri PDF) avtomatik xaritaga solish va yuklash</span>
            </div>
            <p>
              Bir vaqtning o'zida bir nechta <code>.zip</code>, <code>.cbz</code> yoki <code>.pdf</code> fayllarni tanlang.
              ZIP ichidagi bitta yoki bir nechta PDF boblar avtomatik aniqlanadi, alohida boblarga ajratiladi va brauzerda WebP formatiga o'giriladi.
              Yuklashdan oldin xaritani tekshirishingiz yoki qo'lda to'g'rilashingiz mumkin.
            </p>
          </div>

          {/* Multi-file & Folder Upload Box with Drag & Drop */}
          <div
            className={styles.uploadBox}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files?.length) {
                handleMultiArchiveFilesChange({ target: { files: e.dataTransfer.files } });
              }
            }}
          >
            <input
              ref={multiArchiveFileRef}
              type="file"
              multiple
              accept=".zip,.cbz,.pdf"
              onChange={handleMultiArchiveFilesChange}
              style={{ display: 'none' }}
              disabled={queueProcessing || isScanningArchives}
            />
            <input
              ref={multiArchiveFolderRef}
              type="file"
              webkitdirectory=""
              /* eslint-disable-next-line react/no-unknown-property */
              directory=""
              multiple
              onChange={handleMultiArchiveFilesChange}
              style={{ display: 'none' }}
              disabled={queueProcessing || isScanningArchives}
            />
            <Archive size={36} className={styles.uploadIcon} />
            <p className={styles.uploadPrompt}>
              Bir nechta .ZIP, .CBZ, .PDF fayllari yoki butun boshli papkani tanlang yoki bu yerga tashlang
            </p>
            <span className={styles.uploadLimit}>
              Qo'llab-quvvatlanadi: .ZIP (bitta yoki ko'p PDF boblar bilan), .CBZ, .PDF | Maksimal 100 MB va 200 sahifa
            </span>

            <div className={styles.uploadButtonsRow}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => multiArchiveFileRef.current?.click()}
                disabled={queueProcessing || isScanningArchives}
              >
                {isScanningArchives ? (
                  <>
                    <RefreshCw size={14} className={styles.spinning} />
                    <span>{scanningProgress || 'Fayllar tahlil qilinmoqda...'}</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Fayllarni tanlash (.ZIP, .CBZ, .PDF)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => multiArchiveFolderRef.current?.click()}
                disabled={queueProcessing || isScanningArchives}
                title="Butun boshli papkani tanlash (ichidagi barcha fayllar)"
              >
                <Folder size={14} />
                <span>Papkani tanlash (Folder)</span>
              </button>
            </div>
          </div>

          {/* Queue & Mapping Review Table */}
          {archiveQueue.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <div>
                  <h3 className={styles.previewTitle}>
                    Arxivlar navbati va xaritasi ({archiveQueue.length} ta bob)
                  </h3>
                  <span className={styles.previewSub}>
                    Tayyor: {archiveQueue.filter((q) => q.mangaId && q.chapterNumber !== '' && q.chapterNumber !== null && q.chapterNumber !== undefined && Number(q.chapterNumber) >= 0 && q.status !== 'failed').length} ta |
                    Takroriy: {archiveQueue.filter((q) => q.isDuplicate).length} ta
                    {archiveQueue.some((q) => q.status === 'failed') && (
                      <strong style={{ color: '#f87171', marginLeft: 8 }}>
                        | Xatolik: {archiveQueue.filter((q) => q.status === 'failed').length} ta
                      </strong>
                    )}
                  </span>
                </div>

                <div className={styles.previewControls}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={archiveOverwrite}
                      onChange={(e) => setArchiveOverwrite(e.target.checked)}
                      disabled={queueProcessing}
                    />
                    <span>Mavjud boblarni yangilash (Overwrite)</span>
                  </label>

                  {archiveQueue.some((q) => q.status === 'failed') && !queueProcessing && (
                    <button
                      type="button"
                      className={styles.retryBtn}
                      onClick={() => runMultiArchiveIngestion({ retryFailedOnly: true })}
                      title="Faqat xato bergan boblarni qayta yuklash"
                    >
                      <RefreshCw size={12} />
                      <span>Xatoliklarni qayta yuklash ({archiveQueue.filter((q) => q.status === 'failed').length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={clearQueue}
                    disabled={queueProcessing}
                  >
                    Tozalash
                  </button>

                  {queueProcessing ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setCancelRequested(true)}
                    >
                      <span>To'xtatish (Bekor qilish)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => runMultiArchiveIngestion({ retryFailedOnly: false })}
                      disabled={archiveQueue.filter((q) => q.mangaId && q.chapterNumber !== '' && q.chapterNumber !== null && q.chapterNumber !== undefined && Number(q.chapterNumber) >= 0 && q.status !== 'failed').length === 0}
                    >
                      <FileCheck size={14} />
                      <span>Yuklashni boshlash ({archiveQueue.length} ta)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Manga Assignment Control */}
              <div className={styles.bulkAssignBar}>
                <div className={styles.bulkAssignLeft}>
                  <span>Barcha boblarni mangaga biriktirish:</span>
                  <select
                    value={bulkAssignMangaId}
                    onChange={(e) => setBulkAssignMangaId(e.target.value)}
                    className={styles.bulkAssignSelect}
                    disabled={queueProcessing}
                  >
                    <option value="">-- Mangani tanlang --</option>
                    {mangas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.bulkAssignBtns}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => applyBulkMangaAssignment(false)}
                    disabled={!bulkAssignMangaId || queueProcessing}
                    title="Navbatdagi barcha boblarni ushbu mangaga biriktiradi"
                  >
                    Barchasiga qo'llash
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => applyBulkMangaAssignment(true)}
                    disabled={!bulkAssignMangaId || queueProcessing}
                    title="Faqat hali biriktirilmagan boblarga qo'llaydi"
                  >
                    Faqat biriktirilmaganlarga
                  </button>
                </div>
              </div>

              {/* Progress bars during processing */}
              {queueProcessing && (
                <div className={styles.activeProcessingCard}>
                  <div className={styles.processingHeaderRow}>
                    <div className={styles.processingTitleRow}>
                      <RefreshCw size={15} className={styles.spinning} />
                      <span>
                        Jarayonda: <strong>{archiveQueue[currentArchiveIdx]?.filename}</strong>
                        {' '}(Bob {currentArchiveIdx + 1} / {archiveQueue.length})
                      </span>
                    </div>
                    <span className={styles.pctBadge}>{overallProgress}%</span>
                  </div>

                  <div className={styles.progressBarWrapper}>
                    <div className={styles.progressBar} style={{ width: `${overallProgress}%` }} />
                  </div>
                  <span className={styles.currentFileStatusText}>
                    {currentStageDetail || (currentArchiveStage === 'converting' ? `PDF WebP ga aylantirilmoqda: ${currentArchivePageProgress}%` : `Ushbu bob sahifalari yuklanmoqda: ${currentArchivePageProgress}%`)}
                  </span>
                </div>
              )}

              {/* Final Ingestion Report Banner */}
              {multiArchiveReport && (
                <div
                  className={`${styles.resultBanner} ${
                    multiArchiveReport.failed > 0 ? styles.resultWarning : styles.resultSuccess
                  }`}
                >
                  <div className={styles.resultSummaryRow}>
                    <CheckCircle size={18} />
                    <div>
                      <strong>Ingestion yakunlandi:</strong> {multiArchiveReport.succeeded} ta muvaffaqiyatli, {multiArchiveReport.skipped} ta o'tkazib yuborildi, {multiArchiveReport.failed} ta xatolik.
                    </div>
                  </div>
                  {multiArchiveReport.items?.length > 0 && (
                    <div className={styles.reportItemsList}>
                      {multiArchiveReport.items.map((it, idx) => (
                        <div key={idx} className={styles.reportItemRow}>
                          <span className={it.status === 'success' ? styles.reportOk : it.status === 'skipped' ? styles.reportSkip : styles.reportFail}>
                            {it.status === 'success' ? '✓' : it.status === 'skipped' ? '↷' : '✕'}
                          </span>
                          <span className={styles.reportFilename}>{it.filename}</span>
                          <span className={styles.reportMsg}>{it.message}</span>
                          {it.status === 'success' && it.mangaSlug && (
                            <a
                              href={`/manga/${it.mangaSlug}/chapter/${it.chapterNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.reportLink}
                            >
                              <span>O'qish</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mapping Table */}
              <div className={styles.tableScroll}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Holat</th>
                      <th>Arxiv fayli</th>
                      <th>Format</th>
                      <th>Hajm</th>
                      <th>Tegishli Manga</th>
                      <th>Bob №</th>
                      <th>Bob sarlavhasi</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveQueue.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          item.status === 'failed'
                            ? styles.invalidRow
                            : item.status === 'done'
                            ? styles.successRow
                            : item.isDuplicate
                            ? styles.duplicateRow
                            : ''
                        }
                      >
                        <td>
                          {item.status === 'processing' ? (
                            <span className={styles.processingBadge}>
                              <RefreshCw size={11} className={styles.spinning} />
                              {currentArchiveStage === 'converting' ? 'Konvertatsiya' : 'Yuklanmoqda'}
                            </span>
                          ) : item.status === 'done' ? (
                            <span className={styles.validBadge}>
                              <CheckCircle2 size={11} />
                              Yuklandi ({item.uploadedPages} p)
                            </span>
                          ) : item.status === 'skipped' ? (
                            <span className={styles.duplicateBadge}>O'tkazildi</span>
                          ) : item.status === 'failed' ? (
                            <span className={styles.errorBadge} title={item.error}>
                              <XCircle size={11} />
                              Xatolik
                            </span>
                          ) : !item.mangaId ? (
                            <span className={styles.errorBadge}>
                              <AlertCircle size={11} />
                              Manga yo'q
                            </span>
                          ) : item.isDuplicate ? (
                            <span className={styles.duplicateBadge}>Bazada bor</span>
                          ) : (
                            <span className={styles.validBadge}>Tayyor</span>
                          )}
                        </td>

                        <td>
                          <span className={styles.filenameText} title={item.filename}>
                            {item.filename}
                          </span>
                        </td>

                        <td>
                          <span className={styles.formatTag}>{item.format}</span>
                        </td>

                        <td>
                          <span className={styles.fileSizeText}>
                            {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </td>

                        <td>
                          <select
                            value={item.mangaId}
                            onChange={(e) => updateQueueItem(item.id, 'mangaId', e.target.value)}
                            className={styles.mangaSelectMini}
                            disabled={queueProcessing}
                          >
                            <option value="">-- Mangani tanlang --</option>
                            {mangas.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title} ({m.slug})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.chapterNumber ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const parsed = v === '' ? '' : parseInt(v, 10);
                              updateQueueItem(item.id, 'chapterNumber', isNaN(parsed) ? '' : parsed);
                            }}
                            className={styles.chNumInput}
                            disabled={queueProcessing}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            value={item.chapterTitle}
                            onChange={(e) => updateQueueItem(item.id, 'chapterTitle', e.target.value)}
                            className={styles.chTitleInput}
                            placeholder="Bob nomi"
                            disabled={queueProcessing}
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className={styles.removeRowBtn}
                            onClick={() => removeQueueItem(item.id)}
                            disabled={queueProcessing}
                            title="Navbatdan o'chirish"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Manga CSV Import ──────────────────────────────── */}
      {activeTab === 'manga-csv' && (
        <div className={styles.tabContent}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <Info size={16} />
              <span>Manga metama'lumotlarini CSV orqali ommaviy import qilish</span>
            </div>
            <p>
              Bir vaqtning o'zida o'nlab yoki yuzlab mangalarni tizimga kiritishingiz mumkin.
              Jarayon xavfsiz holda har 20 ta yozuvlik to'plamlar (batch) bilan yuboriladi.
            </p>
            <div className={styles.templateActions}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={downloadMangaTemplate}
              >
                <Download size={14} />
                <span>Manga CSV namunasini yuklab olish (.csv)</span>
              </button>
            </div>
          </div>

          <div className={styles.uploadBox}>
            <input
              ref={mangaFileRef}
              type="file"
              accept=".csv"
              onChange={handleMangaFileChange}
              style={{ display: 'none' }}
            />
            <FileText size={32} className={styles.uploadIcon} />
            <p className={styles.uploadPrompt}>
              CSV faylni yuklash uchun shu yerga bosing
            </p>
            <span className={styles.uploadLimit}>Maksimal hajm: 5 MB</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => mangaFileRef.current?.click()}
            >
              <Upload size={14} />
              <span>CSV Fayl tanlash</span>
            </button>
          </div>

          {mangaParsedRows.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <div>
                  <h3 className={styles.previewTitle}>Fayl mazmuni ko'rib chiqish (Preview)</h3>
                  <span className={styles.previewSub}>
                    Jami: {mangaParsedRows.length} ta | Yaroqli: {mangaParsedRows.filter((r) => r.isValid).length} ta | Takrorlangan: {mangaParsedRows.filter((r) => r.isDuplicate).length} ta
                  </span>
                </div>

                <div className={styles.previewControls}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={mangaSkipDuplicates}
                      onChange={(e) => setMangaSkipDuplicates(e.target.checked)}
                    />
                    <span>Takrorlanganlarni o'tkazib yuborish (Skip Duplicates)</span>
                  </label>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={runMangaImport}
                    disabled={mangaImporting || mangaParsedRows.filter((r) => r.isValid).length === 0}
                  >
                    {mangaImporting ? (
                      <>
                        <RefreshCw size={14} className={styles.spinning} />
                        <span>Import qilinmoqda ({mangaProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck size={14} />
                        <span>Barchasini Import Qilish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {mangaImporting && (
                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBar} style={{ width: `${mangaProgress}%` }} />
                </div>
              )}

              {mangaResult && (
                <div className={`${styles.resultBanner} ${mangaResult.failed > 0 ? styles.resultWarning : styles.resultSuccess}`}>
                  <div className={styles.resultSummary}>
                    <strong>Natija:</strong> {mangaResult.inserted} ta yangi qo'shildi, {mangaResult.updated} ta yangilandi, {mangaResult.failed} ta xatolik.
                  </div>
                  {mangaResult.errors?.length > 0 && (
                    <ul className={styles.errorList}>
                      {mangaResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className={styles.tableScroll}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Holat</th>
                      <th>№</th>
                      <th>Nomi</th>
                      <th>Slug</th>
                      <th>Muallif</th>
                      <th>Tur / Holat</th>
                      <th>Reyting</th>
                      <th>Janrlar</th>
                      <th>Xatoliklar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mangaParsedRows.map((item, idx) => (
                      <tr key={idx} className={!item.isValid ? styles.invalidRow : item.isDuplicate ? styles.duplicateRow : ''}>
                        <td>
                          {item.isValid ? (
                            item.isDuplicate ? (
                              <span className={styles.duplicateBadge}>Takror</span>
                            ) : (
                              <span className={styles.validBadge}>Tayyor</span>
                            )
                          ) : (
                            <span className={styles.errorBadge}>Xato</span>
                          )}
                        </td>
                        <td>{item.row.index}</td>
                        <td><strong>{item.row.title}</strong></td>
                        <td><code>{item.row.slug}</code></td>
                        <td>{item.row.author}</td>
                        <td>{item.row.type} / {item.row.status}</td>
                        <td>{item.row.rating}</td>
                        <td>{item.row.genres?.join(', ') || '—'}</td>
                        <td className={styles.errorCell}>
                          {item.errors.join('; ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Chapters CSV Import ──────────────────────────── */}
      {activeTab === 'chapters-csv' && (
        <div className={styles.tabContent}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <Info size={16} />
              <span>Boblar metama'lumotlarini CSV orqali ommaviy import qilish</span>
            </div>
            <p>
              Har bir bob tegishli mangaga <code>manga_slug</code> orqali bog'lanadi.
              Oldindan bazada mavjud mangalarni ko'rsatish zarur.
            </p>
            <div className={styles.templateActions}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={downloadChaptersTemplate}
              >
                <Download size={14} />
                <span>Boblar CSV namunasini yuklab olish (.csv)</span>
              </button>
            </div>
          </div>

          <div className={styles.uploadBox}>
            <input
              ref={chaptersFileRef}
              type="file"
              accept=".csv"
              onChange={handleChaptersFileChange}
              style={{ display: 'none' }}
            />
            <Layers size={32} className={styles.uploadIcon} />
            <p className={styles.uploadPrompt}>
              Boblar CSV faylini yuklash uchun shu yerga bosing
            </p>
            <span className={styles.uploadLimit}>Maksimal hajm: 5 MB</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => chaptersFileRef.current?.click()}
            >
              <Upload size={14} />
              <span>CSV Fayl tanlash</span>
            </button>
          </div>

          {chapterParsedRows.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <div>
                  <h3 className={styles.previewTitle}>Boblar faylini ko'rib chiqish</h3>
                  <span className={styles.previewSub}>
                    Jami: {chapterParsedRows.length} ta | Yaroqli: {chapterParsedRows.filter((r) => r.isValid).length} ta
                  </span>
                </div>

                <div className={styles.previewControls}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={chapterSkipDuplicates}
                      onChange={(e) => setChapterSkipDuplicates(e.target.checked)}
                    />
                    <span>Mavjud boblarni o'tkazib yuborish</span>
                  </label>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={runChaptersImport}
                    disabled={chapterImporting || chapterParsedRows.filter((r) => r.isValid).length === 0}
                  >
                    {chapterImporting ? (
                      <>
                        <RefreshCw size={14} className={styles.spinning} />
                        <span>Import qilinmoqda ({chapterProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck size={14} />
                        <span>Boblar Importini Boshlash</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {chapterImporting && (
                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBar} style={{ width: `${chapterProgress}%` }} />
                </div>
              )}

              {chapterResult && (
                <div className={`${styles.resultBanner} ${chapterResult.failed > 0 ? styles.resultWarning : styles.resultSuccess}`}>
                  <div>
                    <strong>Natija:</strong> {chapterResult.inserted} ta bob qo'shildi, {chapterResult.updated} ta yangilandi, {chapterResult.failed} ta xatolik.
                  </div>
                  {chapterResult.errors?.length > 0 && (
                    <ul className={styles.errorList}>
                      {chapterResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className={styles.tableScroll}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Holat</th>
                      <th>Manga Slug</th>
                      <th>Bob №</th>
                      <th>Sarlavha</th>
                      <th>Sahifalar</th>
                      <th>Sana</th>
                      <th>Xatoliklar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterParsedRows.map((item, idx) => (
                      <tr key={idx} className={!item.isValid ? styles.invalidRow : ''}>
                        <td>
                          {item.isValid ? (
                            <span className={styles.validBadge}>Tayyor</span>
                          ) : (
                            <span className={styles.errorBadge}>Xato</span>
                          )}
                        </td>
                        <td><code>{item.row.mangaSlug}</code></td>
                        <td><strong>{item.row.chapterNumber}-bob</strong></td>
                        <td>{item.row.title}</td>
                        <td>{item.row.pagesCount} ta</td>
                        <td>{item.row.publishedAt.slice(0, 10)}</td>
                        <td className={styles.errorCell}>{item.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Fallback Single ZIP / Pages Import ────────────── */}
      {activeTab === 'single-zip' && (
        <div className={styles.tabContent}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <Upload size={16} />
              <span>Yagona bobni qo'lda yuklash (Zaxira rejimi)</span>
            </div>
            <p>
              Agar fayl nomlari maxsus formatda bo'lmasa, quyida manga va bob raqamini qo'lda tanlab, bitta ZIP arxivini yuklashingiz mumkin.
            </p>
          </div>

          <div className={styles.zipConfigCard}>
            <div className={styles.zipConfigGrid}>
              <div className={styles.configField}>
                <label>Qaysi mangaga tegishli?</label>
                <select
                  value={targetManga?.id || ''}
                  onChange={(e) => {
                    const found = mangas.find((m) => m.id === e.target.value);
                    if (found) setTargetManga(found);
                  }}
                  className={styles.select}
                >
                  {mangas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.configField}>
                <label>Bob raqami</label>
                <input
                  type="number"
                  min="1"
                  value={targetChapterNumber}
                  onChange={(e) => setTargetChapterNumber(parseInt(e.target.value, 10) || 1)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.uploadBox}>
            <input
              ref={singleZipFileRef}
              type="file"
              accept=".zip,.cbz"
              onChange={handleSingleZipFileChange}
              style={{ display: 'none' }}
            />
            <Archive size={32} className={styles.uploadIcon} />
            <p className={styles.uploadPrompt}>
              Bitta .ZIP yoki .CBZ faylni tanlang
            </p>
            <span className={styles.uploadLimit}>Maksimal hajm: 100 MB | Maksimal sahifa: 200 ta</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => singleZipFileRef.current?.click()}
              disabled={zipUnpacking || zipUploading}
            >
              <Upload size={14} />
              <span>Faylni tanlash</span>
            </button>
          </div>

          {zipUnpacking && (
            <div className={styles.unpackingCard}>
              <RefreshCw size={20} className={styles.spinning} />
              <span>Fayl tekshirilmoqda ({zipUnpackProgress}%)...</span>
            </div>
          )}

          {zipError && (
            <div className={styles.errorBanner} role="alert">
              <AlertTriangle size={16} />
              <span>{zipError}</span>
            </div>
          )}

          {zipFilesList.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <div>
                  <h3 className={styles.previewTitle}>
                    Arxivdan chiqarilgan sahifalar: {zipFilesList.length} ta
                  </h3>
                  <span className={styles.previewSub}>
                    Saqlash manzili: <code>manga-chapters/{targetManga?.slug || 'manga'}/ch-{targetChapterNumber}/</code>
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runSingleZipUpload}
                  disabled={zipUploading}
                >
                  {zipUploading ? (
                    <>
                      <RefreshCw size={14} className={styles.spinning} />
                      <span>Yuklanmoqda ({zipUploadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Storage'ga Yuklashni Boshlash</span>
                    </>
                  )}
                </button>
              </div>

              {zipUploading && (
                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBar} style={{ width: `${zipUploadProgress}%` }} />
                </div>
              )}

              {zipResult && (
                <div className={styles.resultBanner}>
                  <CheckCircle size={18} />
                  <div>
                    <strong>Muvaffaqiyatli yakunlandi!</strong> {zipResult.uploaded} ta sahifa Storage'ga yuklandi ({zipResult.failed} ta xatolik).
                  </div>
                </div>
              )}

              <div className={styles.zipFilesGrid}>
                {zipFilesList.map((item, idx) => (
                  <div key={idx} className={styles.zipFileCard}>
                    <span className={styles.pageNumberBadge}>{idx + 1}-bet</span>
                    <span className={styles.originalFileName}>{item.filename}</span>
                    <span className={styles.fileSizeText}>{(item.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
