/**
 * MangaLive.uz — Navigation History & Origin Tracker
 *
 * Tracks in-app user navigation across views so the "Orqaga" (Back) button:
 * 1. Returns from Reader to Manga Overview without creating duplicate history entries.
 * 2. Returns from Manga Overview to the true previous in-app page (e.g. Home, Catalogue, Search results, Library).
 * 3. Falls back gracefully to the Main page if opened directly or refreshed.
 * 4. Prevents circular ping-pong loops between Overview and Reader.
 */

const STORAGE_KEY = 'mangalive_nav_state_v1';

// In-memory fallback
let memoryState = {
  history: [],
  mangaOrigins: {},
};

export function clearNavState() {
  memoryState = { history: [], mangaOrigins: {} };
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function getNavState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    if (raw === null && typeof sessionStorage !== 'undefined') {
      memoryState = { history: [], mangaOrigins: {} };
      return memoryState;
    }
  } catch {
    // sessionStorage disabled or unavailable
  }
  return memoryState;
}

function saveNavState(state) {
  memoryState = state;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private browsing restrictions
  }
}

/**
 * Normalize paths to ignore trailing slashes and normalize casing
 */
function normalizePath(path) {
  if (!path) return '/';
  const clean = path.trim().replace(/\/+$/, '') || '/';
  return clean;
}

/**
 * Check if path is a chapter reader route
 */
export function isReaderPath(path) {
  return typeof path === 'string' && path.includes('/chapter/');
}

/**
 * Check if path is a manga overview/detail route
 */
export function isMangaOverviewPath(path) {
  if (!path) return false;
  const norm = normalizePath(path.split('?')[0]);
  return norm.startsWith('/manga/') && !norm.includes('/chapter/');
}

/**
 * Extract manga slug from overview path e.g. "/manga/nano-mashina" -> "nano-mashina"
 */
export function extractMangaSlug(path) {
  if (!path) return '';
  const clean = path.split('?')[0].replace(/\/+$/, '');
  const match = clean.match(/^\/manga\/([^/]+)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Record route changes. Called by NavigationTracker inside BrowserRouter in App.jsx.
 * @param {{ pathname: string, search: string }} location
 */
export function recordNavigation(location) {
  if (!location || !location.pathname) return;

  const currentPath = location.pathname + (location.search || '');
  const state = getNavState();
  const history = state.history || [];
  const mangaOrigins = state.mangaOrigins || {};

  const cleanCurrent = normalizePath(location.pathname);
  const isReader = isReaderPath(cleanCurrent);
  const isOverview = isMangaOverviewPath(cleanCurrent);

  // If navigating to a manga overview, record the origin if coming from outside this manga
  if (isOverview) {
    const slug = extractMangaSlug(cleanCurrent);
    if (slug) {
      // Find the last route in history that is NOT this manga or any of its chapters
      const lastExternal = [...history].reverse().find((p) => {
        const normP = normalizePath(p.split('?')[0]);
        return !normP.startsWith(`/manga/${slug}`);
      });

      if (lastExternal) {
        mangaOrigins[slug] = lastExternal;
      } else if (!mangaOrigins[slug]) {
        mangaOrigins[slug] = '/';
      }
    }
  }

  // Deduplicate consecutive identical routes in session history
  if (history[history.length - 1] !== currentPath) {
    history.push(currentPath);
    // Keep max 30 recent routes
    if (history.length > 30) {
      history.shift();
    }
  }

  saveNavState({ history, mangaOrigins });
}

/**
 * Get the recorded origin for a manga (e.g. "/", "/katalog?q=solo", "/kutubxona")
 * @param {string} slugOrId
 * @returns {string}
 */
export function getMangaOrigin(slugOrId) {
  if (!slugOrId) return '/';
  const clean = String(slugOrId).toLowerCase().trim();
  const state = getNavState();
  const origin = state.mangaOrigins?.[clean];

  // Safety: never return a chapter route as an overview origin
  if (origin && !isReaderPath(origin)) {
    return origin;
  }
  return '/';
}

/**
 * Check whether we can use browser history back from reader to overview
 * @param {string} slugOrId
 * @returns {boolean}
 */
export function canReaderGoBackToOverview(slugOrId) {
  if (typeof window === 'undefined') return false;

  const hasBrowserHistory = Boolean(window.history.state && window.history.state.idx > 0);
  if (!hasBrowserHistory) return false;

  const clean = String(slugOrId || '').toLowerCase().trim();
  const targetOverview = `/manga/${clean}`;
  const state = getNavState();

  // Check if overview route exists earlier in session history
  return state.history.some((p) => normalizePath(p.split('?')[0]) === targetOverview);
}

/**
 * Handler for Reader Back button.
 * Navigates back to Manga Overview cleanly without pushing redundant entries.
 * @param {function} navigate - React Router navigate function
 * @param {string} mangaSlugOrId
 */
export function navigateBackFromReader(navigate, mangaSlugOrId) {
  const targetSlug = String(mangaSlugOrId || '').trim();
  const overviewUrl = `/manga/${targetSlug}`;

  if (canReaderGoBackToOverview(targetSlug)) {
    // Return to the existing overview entry in history
    navigate(-1);
  } else {
    // Opened reader directly: replace reader route with overview to prevent ping-pong
    navigate(overviewUrl, { replace: true });
  }
}

/**
 * Check whether we can use browser history back from overview to previous in-app page
 * @param {string} slugOrId
 * @returns {boolean}
 */
export function canOverviewGoBack(slugOrId) {
  if (typeof window === 'undefined') return false;

  const hasBrowserHistory = Boolean(window.history.state && window.history.state.idx > 0);
  if (!hasBrowserHistory) return false;

  const clean = String(slugOrId || '').toLowerCase().trim();
  const state = getNavState();
  const origin = state.mangaOrigins?.[clean];

  // We can go back if there is an in-app origin and history depth > 0
  return Boolean(origin && origin !== `/manga/${clean}`);
}

/**
 * Handler for Manga Overview (Detail Page) Orqaga button.
 * Guarantees navigating to previous page (Home, Search, Catalogue, Library)
 * and NEVER returning to a chapter reader.
 * @param {function} navigate - React Router navigate function
 * @param {string} mangaSlugOrId
 */
export function navigateBackFromOverview(navigate, mangaSlugOrId) {
  const clean = String(mangaSlugOrId || '').trim();
  const origin = getMangaOrigin(clean);

  // If we arrived from a valid in-app route and have history depth, navigate(-1) preserves scroll
  if (canOverviewGoBack(clean)) {
    navigate(-1);
  } else if (origin && !isReaderPath(origin)) {
    navigate(origin);
  } else {
    navigate('/');
  }
}
