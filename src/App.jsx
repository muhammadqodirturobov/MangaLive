import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header          from './components/Header/Header.jsx';
import Footer          from './components/Footer/Footer.jsx';
import HomePage        from './pages/HomePage.jsx';
import CataloguePage   from './pages/CataloguePage.jsx';
import MangaDetailPage from './pages/MangaDetailPage.jsx';
import ReaderPage      from './pages/ReaderPage.jsx';
import RatingPage      from './pages/RatingPage.jsx';
import LibraryPage     from './pages/LibraryPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import ConnectionTestPage from './pages/ConnectionTestPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

import BottomNav      from './components/BottomNav/BottomNav.jsx';

import { recordNavigation } from './utils/navigationTracker.js';

/**
 * ScrollToTop — resets scroll position on route change.
 * Must be inside BrowserRouter.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * NavigationTracker — tracks in-app route origins for reliable Back button behavior.
 */
function NavigationTracker() {
  const location = useLocation();
  useEffect(() => {
    recordNavigation(location);
  }, [location]);
  return null;
}

/**
 * AppShell — layout wrapper. The reader page uses its own fullscreen
 * layout, so we skip the normal Header/Footer for that route.
 */
function AppShell({ theme, onThemeToggle, children }) {
  const { pathname } = useLocation();
  const isReader = pathname.includes('/chapter/');
  const isAdmin = pathname.startsWith('/admin');

  if (isReader || isAdmin) return <>{children}</>;

  return (
    <>
      <Header theme={theme} onThemeToggle={onThemeToggle} />
      <div style={{ minHeight: 'calc(100vh - var(--header-height))', paddingBottom: 'var(--mobile-bottom-space, 0px)' }}>
        {children}
      </div>
      <Footer />
      <BottomNav />
    </>
  );
}

export default function App() {
  // Theme state — default to dark, persist in localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ml-theme') ?? 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ml-theme', theme);
    } catch {
      /* localStorage unavailable — graceful degradation */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <BrowserRouter>
      <ScrollToTop />
      <NavigationTracker />
      <AppShell theme={theme} onThemeToggle={toggleTheme}>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/katalog"    element={<CataloguePage />} />
          <Route path="/kutubxona"  element={<LibraryPage />} />
          <Route path="/reyting"    element={<RatingPage />} />
          <Route path="/test-connection" element={<ConnectionTestPage />} />
          <Route path="/admin"      element={<AdminPage />} />
          <Route path="/admin/*"    element={<AdminPage />} />
          <Route path="/hamjamiyat" element={<PlaceholderPage title="Hamjamiyat" description="Forum va jamiyat xususiyatlari ishlab chiqilmoqda." />} />
          <Route path="/haqimizda"  element={<PlaceholderPage title="Biz haqimizda" />} />
          <Route path="/muallif"    element={<PlaceholderPage title="Muallif bo'lib qo'shiling" />} />
          <Route path="/hisobot"    element={<PlaceholderPage title="Hisobot berish" />} />
          <Route path="/faq"        element={<PlaceholderPage title="Tez-tez so'raladigan savollar" />} />
          <Route path="/shartlar"   element={<PlaceholderPage title="Foydalanish shartlari" />} />
          <Route path="/maxfiylik"  element={<PlaceholderPage title="Maxfiylik siyosati" />} />
          <Route path="/dmca"       element={<PlaceholderPage title="Mualliflik huquqi" />} />
          <Route path="/manga/:id"  element={<MangaDetailPage />} />
          <Route
            path="/manga/:id/chapter/:chapterNumber"
            element={<ReaderPage />}
          />
          {/* 404 */}
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Sahifa topilmadi"
                description="Siz qidirgan sahifa mavjud emas. Ehtimol, havola noto'g'ri."
              />
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
