import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Layers, UploadCloud, HardDrive,
  LogOut, Globe, Shield, RefreshCw
} from 'lucide-react';
import { getAdminUser, checkIsAdminUser, adminSignOut } from '../services/adminService.js';
import AdminLogin from '../components/Admin/AdminLogin.jsx';
import MangaManager from '../components/Admin/MangaManager.jsx';
import ChapterManager from '../components/Admin/ChapterManager.jsx';
import BulkImportManager from '../components/Admin/BulkImportManager.jsx';
import StorageDiagnostics from '../components/Admin/StorageDiagnostics.jsx';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Active top tab: 'mangas' | 'chapters' | 'bulk-import' | 'diagnostics'
  const [activeTab, setActiveTab] = useState('mangas');

  // Contextual transitions between tabs
  const [selectedMangaContext, setSelectedMangaContext] = useState(null);
  const [selectedChapterContext, setSelectedChapterContext] = useState(null);

  const checkAuth = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const user = await getAdminUser();
      if (!user) {
        setAdminUser(null);
        setIsAdmin(false);
        return;
      }
      const adminVerified = await checkIsAdminUser(user.id);
      setAdminUser(user);
      setIsAdmin(adminVerified);
    } catch (err) {
      console.warn('[AdminPage] Auth check failed:', err);
      setAdminUser(null);
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await adminSignOut();
    setAdminUser(null);
    setIsAdmin(false);
  };

  const handleSelectMangaForChapters = (manga) => {
    setSelectedMangaContext(manga);
    setActiveTab('chapters');
  };

  const handleNavigateToBulkPages = (manga, chapter) => {
    setSelectedMangaContext(manga);
    setSelectedChapterContext(chapter);
    setActiveTab('bulk-import');
  };

  if (checkingAuth) {
    return (
      <div className={styles.loadingScreen}>
        <RefreshCw size={28} className={styles.spinning} />
        <p>Admin huquqlari tekshirilmoqda...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin onLoginSuccess={checkAuth} />;
  }

  return (
    <div className={styles.adminLayout}>
      {/* ── Admin Top Navigation Bar ─────────────────────────────── */}
      <header className={styles.adminHeader}>
        <div className={`container ${styles.adminHeaderInner}`}>
          <div className={styles.brandGroup}>
            <Link to="/admin" className={styles.logo}>
              <Shield size={20} className={styles.shieldIcon} />
              <span className={styles.logoText}>
                Manga<span className={styles.logoAccent}>Live</span>
              </span>
              <span className={styles.adminBadge}>ADMIN</span>
            </Link>
          </div>

          <nav className={styles.mainTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mangas'}
              className={`${styles.navTabBtn} ${activeTab === 'mangas' ? styles.activeNavTab : ''}`}
              onClick={() => setActiveTab('mangas')}
            >
              <BookOpen size={16} />
              <span>Mangalar</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chapters'}
              className={`${styles.navTabBtn} ${activeTab === 'chapters' ? styles.activeNavTab : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              <Layers size={16} />
              <span>Boblar</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'bulk-import'}
              className={`${styles.navTabBtn} ${activeTab === 'bulk-import' ? styles.activeNavTab : ''}`}
              onClick={() => setActiveTab('bulk-import')}
            >
              <UploadCloud size={16} />
              <span>Ommaviy Import</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'diagnostics'}
              className={`${styles.navTabBtn} ${activeTab === 'diagnostics' ? styles.activeNavTab : ''}`}
              onClick={() => setActiveTab('diagnostics')}
            >
              <HardDrive size={16} />
              <span>Tizim & Storage</span>
            </button>
          </nav>

          <div className={styles.userActions}>
            <span className={styles.userEmail} title={adminUser?.email}>
              {adminUser?.email}
            </span>

            <Link to="/" className={styles.siteLink} title="Asosiy saytga o'tish">
              <Globe size={15} />
              <span>Sayt</span>
            </Link>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Tizimdan chiqish"
            >
              <LogOut size={15} />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ─────────────────────────────── */}
      <main className={`container ${styles.dashboardBody}`}>
        {activeTab === 'mangas' && (
          <MangaManager
            onSelectMangaForChapters={handleSelectMangaForChapters}
          />
        )}

        {activeTab === 'chapters' && (
          <ChapterManager
            initialManga={selectedMangaContext}
            onNavigateToBulkPages={handleNavigateToBulkPages}
          />
        )}

        {activeTab === 'bulk-import' && (
          <BulkImportManager
            initialManga={selectedMangaContext}
            initialChapter={selectedChapterContext}
          />
        )}

        {activeTab === 'diagnostics' && (
          <StorageDiagnostics adminUser={adminUser} />
        )}
      </main>
    </div>
  );
}
