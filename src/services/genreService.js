/**
 * MangaLive.uz — Genre Service (Data Access Layer)
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { GENRES as LOCAL_GENRES, getGenreBySlug as localGetGenreBySlug } from '../data/genres.js';

export const GENRES = LOCAL_GENRES;

/**
 * Get genre definitions (synchronous fallback).
 * @returns {import('../types/schema').Genre[]}
 */
export function getGenres() {
  return LOCAL_GENRES;
}

/**
 * Get genre by slug (synchronous fallback).
 * @param {string} slug
 * @returns {import('../types/schema').Genre|undefined}
 */
export function getGenreBySlug(slug) {
  return localGetGenreBySlug(slug);
}

/**
 * Async fetch genres from database.
 * @returns {Promise<import('../types/schema').Genre[]>}
 */
export async function fetchGenres() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[genreService] Failed to fetch genres:', error.message);
      throw new Error(`Supabase fetchGenres error: ${error.message}`);
    }

    return (data || []).map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      icon: g.icon,
      description: g.description,
    }));
  }

  return LOCAL_GENRES;
}
