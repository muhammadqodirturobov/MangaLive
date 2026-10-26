import { createClient } from '@supabase/supabase-js';

/**
 * MangaLive.uz — Supabase Client Initializer
 *
 * Checks environment configuration safely.
 * If credentials are not supplied, gracefully falls back to local data mode.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env ? globalThis.process.env : {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'mangalive_supabase_auth_session',
        flowType: 'pkce',
      },
    })
  : null;
