import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { getFavorites, getReadingHistory, getGuestAvatar, setGuestAvatar } from '../data/userStorage.js';
import { DEFAULT_AVATAR, resolveAvatar } from '../data/avatars.js';

function syncAuthCookie(token) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `mangalive_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `mangalive_token=; path=/; max-age=0; SameSite=Lax`;
  }
}

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isAuthModalOpen: false,
  authModalTab: 'login',
  authOptions: {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [authOptions, setAuthOptions] = useState({
    intendedDestination: null,
    reason: null,
    chapterNumber: null,
    mangaTitle: null,
  });

  // Migrate guest data (favorites & reading history & avatar) to Supabase account
  const migrateGuestData = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured || !supabase) return;
    try {
      // 1. Migrate Favorites
      const localFavs = getFavorites();
      if (localFavs.length > 0) {
        for (const fId of localFavs) {
          try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fId);
            let mangaUuid = fId;
            if (!isUuid) {
              const { data } = await supabase.from('mangas').select('id').eq('slug', fId).maybeSingle();
              if (data?.id) mangaUuid = data.id;
              else continue;
            }
            await supabase.from('user_favorites').upsert(
              { user_id: userId, manga_id: mangaUuid },
              { onConflict: 'user_id,manga_id' }
            );
          } catch (e) {
            console.warn('Guest favorite migration error:', e.message);
          }
        }
      }

      // 2. Migrate Reading History
      const localHistory = getReadingHistory();
      if (localHistory.length > 0) {
        for (const item of localHistory) {
          try {
            const idOrSlug = item.mangaSlug || item.mangaId;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
            let mangaUuid = idOrSlug;
            if (!isUuid) {
              const { data } = await supabase.from('mangas').select('id').eq('slug', idOrSlug).maybeSingle();
              if (data?.id) mangaUuid = data.id;
              else continue;
            }
            await supabase.from('user_reading_history').upsert(
              {
                user_id: userId,
                manga_id: mangaUuid,
                last_chapter_number: item.chapterNumber || 1,
                read_at: new Date(item.timestamp || Date.now()).toISOString(),
              },
              { onConflict: 'user_id,manga_id' }
            );
          } catch (e) {
            console.warn('Guest history migration error:', e.message);
          }
        }
      }

      // 3. Migrate Guest Avatar if user doesn't have an anime avatar or still has dicebear
      const guestAvatar = getGuestAvatar();
      if (guestAvatar) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const currentAv = currentUser?.user_metadata?.avatar_url;
          if (!currentAv || currentAv.includes('dicebear.com') || currentAv.includes('bottts')) {
            const clean = resolveAvatar(guestAvatar);
            await supabase.auth.updateUser({
              data: { avatar_url: clean },
            });
            setUser((prev) => (prev ? {
              ...prev,
              user_metadata: { ...prev.user_metadata, avatar_url: clean }
            } : prev));
          }
        } catch (e) {
          console.warn('Guest avatar migration error:', e.message);
        }
      }
    } catch (err) {
      console.warn('Guest data migration error:', err);
    }
  }, []);

  // Listen to Supabase Auth state changes and restore session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.access_token) {
        syncAuthCookie(initialSession.access_token);
      }
      setLoading(false);
      if (initialSession?.user?.id) {
        migrateGuestData(initialSession.user.id);
      }
    }).catch((err) => {
      console.warn('[AuthContext] Session fetch error:', err.message);
      syncAuthCookie(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (newSession?.access_token) {
        syncAuthCookie(newSession.access_token);
      } else {
        syncAuthCookie(null);
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user?.id) {
        await migrateGuestData(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        syncAuthCookie(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [migrateGuestData]);

  const openAuthModal = useCallback((tab = 'login', options = {}) => {
    setAuthModalTab(tab);
    if (options && typeof options === 'object') {
      setAuthOptions((prev) => ({ ...prev, ...options }));
      if (options.intendedDestination) {
        try {
          sessionStorage.setItem('ml_intended_destination', options.intendedDestination);
        } catch {}
      }
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase sozlanmagan');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.session?.access_token) {
      syncAuthCookie(data.session.access_token);
    }
    if (data?.user?.id) {
      await migrateGuestData(data.user.id);
    }

    let dest = authOptions.intendedDestination;
    if (!dest && typeof sessionStorage !== 'undefined') {
      dest = sessionStorage.getItem('ml_intended_destination');
    }
    if (dest) {
      try {
        sessionStorage.removeItem('ml_intended_destination');
      } catch {}
      setAuthOptions((prev) => ({ ...prev, intendedDestination: null }));
    }

    closeAuthModal();
    return { ...data, destination: dest };
  }, [closeAuthModal, migrateGuestData, authOptions.intendedDestination]);

  const signUp = useCallback(async (email, password, fullName = '') => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase sozlanmagan');
    }
    const initialAvatar = resolveAvatar(getGuestAvatar() || DEFAULT_AVATAR);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || email.split('@')[0],
          avatar_url: initialAvatar,
        },
      },
    });
    if (error) throw error;
    if (data?.session?.access_token) {
      syncAuthCookie(data.session.access_token);
    }
    if (data?.user?.id) {
      await migrateGuestData(data.user.id);
    }

    let dest = authOptions.intendedDestination;
    if (!dest && typeof sessionStorage !== 'undefined') {
      dest = sessionStorage.getItem('ml_intended_destination');
    }
    if (dest) {
      try {
        sessionStorage.removeItem('ml_intended_destination');
      } catch {}
      setAuthOptions((prev) => ({ ...prev, intendedDestination: null }));
    }

    closeAuthModal();
    return { ...data, destination: dest };
  }, [closeAuthModal, migrateGuestData, authOptions.intendedDestination]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut error:', err);
    }
    syncAuthCookie(null);
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase sozlanmagan');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profil?reset=true`,
    });
    if (error) throw error;
    return data;
  }, []);

  const updateProfile = useCallback(async ({ fullName, avatarUrl }) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase sozlanmagan');
    }
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName.trim();
    if (avatarUrl !== undefined) {
      const cleanAvatar = resolveAvatar(avatarUrl.trim());
      updates.avatar_url = cleanAvatar;
      setGuestAvatar(cleanAvatar);
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) throw error;
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthModalOpen,
        authModalTab,
        authOptions,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
