import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { getFavorites, getReadingHistory } from '../data/userStorage.js';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isAuthModalOpen: false,
  authModalTab: 'login',
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

  // Migrate guest data (favorites & reading history) to Supabase account
  const migrateGuestData = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured || !supabase) return;
    try {
      // 1. Migrate Favorites
      const localFavs = getFavorites();
      if (localFavs.length > 0) {
        // Resolve UUIDs for slugs
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
    } catch (err) {
      console.warn('Guest data migration error:', err);
    }
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
      if (initialSession?.user?.id) {
        migrateGuestData(initialSession.user.id);
      }
    }).catch((err) => {
      console.warn('[AuthContext] Session fetch error:', err.message);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        await migrateGuestData(newSession.user.id);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [migrateGuestData]);

  const openAuthModal = useCallback((tab = 'login') => {
    setAuthModalTab(tab);
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
    if (data?.user?.id) {
      await migrateGuestData(data.user.id);
    }
    closeAuthModal();
    return data;
  }, [closeAuthModal, migrateGuestData]);

  const signUp = useCallback(async (email, password, fullName = '') => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase sozlanmagan');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        },
      },
    });
    if (error) throw error;
    if (data?.user?.id) {
      await migrateGuestData(data.user.id);
    }
    closeAuthModal();
    return data;
  }, [closeAuthModal, migrateGuestData]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl.trim();

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
