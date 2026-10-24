/**
 * MangaLive.uz — Admin & Content Management Service
 *
 * Provides authenticated administration methods for:
 * - Supabase Auth & admin role verification (public.admin_users)
 * - Manga metadata CRUD & genre relationships
 * - Chapter CRUD & chapter page ordering
 * - Media uploads to Supabase Storage (manga-covers & manga-chapters)
 *
 * Security:
 * - Operates strictly under the Supabase public anon client with authenticated user JWT.
 * - NEVER uses or exposes the service_role key.
 * - All mutations are guarded server-side by PostgreSQL RLS (public.is_admin()).
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { normalizeManga, normalizeChapter } from '../types/entities.js';
import { getR2Status, uploadMangaCoverToR2 } from './r2StorageService.js';
import { invalidateMangaCache } from './mangaService.js';

/**
 * Sign in as admin with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: any, session: any }>}
 */
export async function adminSignIn(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi sozlanmagan (.env.local faylini tekshiring).');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(`Kirishda xatolik: ${error.message}`);
  }

  // Check if this authenticated user is an authorized admin
  const isAdmin = await checkIsAdminUser(data.user?.id);
  if (!isAdmin) {
    // Sign out immediately if not authorized
    await supabase.auth.signOut();
    throw new Error(
      'Kirish rad etildi: Ushbu hisob public.admin_users ro\'yxatiga kiritilmagan. Supabase SQL Editor orqali admin qilib belgilang.'
    );
  }

  return data;
}

/**
 * Sign out current admin user.
 */
export async function adminSignOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * Get currently authenticated user.
 * @returns {Promise<any|null>}
 */
export async function getAdminUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Check if the given or current user is an authorized admin.
 * Verifies against public.admin_users table (protected by RLS).
 * @param {string} [userId]
 * @returns {Promise<boolean>}
 */
export async function checkIsAdminUser(userId) {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    let targetUid = userId;
    if (!targetUid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      targetUid = user.id;
    }

    // Query admin_users table. Only admins can select from this table per RLS policy:
    // "Admins can view admin users" ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin());
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', targetUid)
      .maybeSingle();

    if (error) {
      // If permission denied or other error, user is not admin
      return false;
    }

    return Boolean(data && data.user_id === targetUid);
  } catch (err) {
    console.warn('[adminService] checkIsAdminUser exception:', err);
    return false;
  }
}

/**
 * Check storage bucket readiness.
 * @returns {Promise<{ coversReady: boolean, chaptersReady: boolean, buckets: string[] }>}
 */
export async function checkStorageBuckets() {
  if (!isSupabaseConfigured || !supabase) {
    return { coversReady: false, chaptersReady: false, buckets: [] };
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      return { coversReady: false, chaptersReady: false, buckets: [] };
    }

    const bucketNames = (buckets || []).map((b) => b.name);
    return {
      coversReady: bucketNames.includes('manga-covers'),
      chaptersReady: bucketNames.includes('manga-chapters'),
      buckets: bucketNames,
    };
  } catch (err) {
    console.warn('[adminService] checkStorageBuckets error:', err);
    return { coversReady: false, chaptersReady: false, buckets: [] };
  }
}

/**
 * Upload manga cover image to Supabase Storage ('manga-covers' bucket).
 * @param {File} file
 * @param {string} mangaSlug
 * @returns {Promise<string>} Public URL of the uploaded cover
 */
export async function uploadMangaCover(file, mangaSlug) {
  const cleanSlug = mangaSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  // Check if Cloudflare R2 is available
  try {
    const r2Info = await getR2Status();
    if (r2Info?.configured) {
      const r2Url = await uploadMangaCoverToR2({ mangaSlug: cleanSlug, file });
      if (r2Url) return r2Url;
    }
  } catch (r2Err) {
    console.warn('[Admin] R2 cover upload fallback to Supabase:', r2Err.message);
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const ext = file.name.split('.').pop() || 'webp';
  const filePath = `${cleanSlug}/cover_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('manga-covers')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Muqova yuklashda xatolik: ${uploadError.message}. Supabase'da "manga-covers" bucket mavjudligini tekshiring.`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('manga-covers')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Fetch all manga records for the admin list (including relations).
 * @returns {Promise<import('../types/schema').Manga[]>}
 */
export async function fetchAdminMangas() {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('mangas')
    .select(`
      *,
      manga_genres (
        genres (id, slug, name)
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Mangalarni yuklashda xatolik: ${error.message}`);
  }

  return (data || []).map(normalizeManga);
}

/**
 * Fetch all available genres.
 * @returns {Promise<Array<{ id: string, slug: string, name: string }>>}
 */
export async function fetchAllGenres() {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('genres')
    .select('id, slug, name, icon')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Janrlarni yuklashda xatolik: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new manga record in Supabase.
 * @param {object} mangaData
 * @returns {Promise<any>}
 */
export async function createManga(mangaData) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const slug = (mangaData.slug || mangaData.title)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

  const row = {
    slug,
    title: mangaData.title.trim(),
    title_en: mangaData.titleEn ? mangaData.titleEn.trim() : null,
    author: mangaData.author ? mangaData.author.trim() : 'Noma\'lum',
    type: mangaData.type || 'manga',
    status: mangaData.status || 'davom etmoqda',
    rating: Number(mangaData.rating ?? 0.0),
    rating_count: Number(mangaData.ratingCount ?? 0),
    views_count: Number(mangaData.viewsCount ?? 0),
    cover_url: mangaData.coverUrl || null,
    banner_url: mangaData.bannerUrl || null,
    cover_color_start: mangaData.coverColorStart || '#0d001a',
    cover_color_end: mangaData.coverColorEnd || '#2d004d',
    cover_accent: mangaData.coverAccent || '#c084fc',
    synopsis: mangaData.synopsis ? mangaData.synopsis.trim() : '',
    featured_tagline: mangaData.featuredTagline ? mangaData.featuredTagline.trim() : null,
    is_featured: Boolean(mangaData.isFeatured),
    is_popular: Boolean(mangaData.isPopular),
    is_new: Boolean(mangaData.isNew),
  };

  const { data: newManga, error: insertError } = await supabase
    .from('mangas')
    .insert(row)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Manga yaratishda xatolik: ${insertError.message}`);
  }

  // Link genres if provided
  if (Array.isArray(mangaData.genreIds) && mangaData.genreIds.length > 0) {
    const genreRows = mangaData.genreIds.map((gId) => ({
      manga_id: newManga.id,
      genre_id: gId,
    }));
    await supabase.from('manga_genres').insert(genreRows);
  }

  invalidateMangaCache(newManga.id);
  if (newManga.slug) invalidateMangaCache(newManga.slug);
  invalidateMangaCache();

  return normalizeManga(newManga);
}

/**
 * Update an existing manga record.
 * @param {string} mangaId
 * @param {object} mangaData
 * @returns {Promise<any>}
 */
export async function updateManga(mangaId, mangaData) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const row = {
    title: mangaData.title?.trim(),
    title_en: mangaData.titleEn ? mangaData.titleEn.trim() : null,
    author: mangaData.author ? mangaData.author.trim() : 'Noma\'lum',
    type: mangaData.type,
    status: mangaData.status,
    rating: Number(mangaData.rating ?? 0.0),
    cover_url: mangaData.coverUrl || null,
    banner_url: mangaData.bannerUrl || null,
    cover_color_start: mangaData.coverColorStart || '#0d001a',
    cover_color_end: mangaData.coverColorEnd || '#2d004d',
    cover_accent: mangaData.coverAccent || '#c084fc',
    synopsis: mangaData.synopsis ? mangaData.synopsis.trim() : '',
    featured_tagline: mangaData.featuredTagline ? mangaData.featuredTagline.trim() : null,
    is_featured: Boolean(mangaData.isFeatured),
    is_popular: Boolean(mangaData.isPopular),
    is_new: Boolean(mangaData.isNew),
    updated_at: new Date().toISOString(),
  };

  if (mangaData.slug) {
    row.slug = mangaData.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  }

  const { data: updated, error: updateError } = await supabase
    .from('mangas')
    .update(row)
    .eq('id', mangaId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Mangani yangilashda xatolik: ${updateError.message}`);
  }

  // Update genre associations if provided
  if (Array.isArray(mangaData.genreIds)) {
    // Delete existing links
    await supabase.from('manga_genres').delete().eq('manga_id', mangaId);
    if (mangaData.genreIds.length > 0) {
      const genreRows = mangaData.genreIds.map((gId) => ({
        manga_id: mangaId,
        genre_id: gId,
      }));
      await supabase.from('manga_genres').insert(genreRows);
    }
  }

  invalidateMangaCache(mangaId);
  if (updated?.slug) invalidateMangaCache(updated.slug);
  invalidateMangaCache();

  return normalizeManga(updated);
}

/**
 * Delete a manga record.
 * @param {string} mangaId
 * @returns {Promise<boolean>}
 */
export async function deleteManga(mangaId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const { error } = await supabase
    .from('mangas')
    .delete()
    .eq('id', mangaId);

  if (error) {
    throw new Error(`Mangani o'chirishda xatolik: ${error.message}`);
  }

  invalidateMangaCache(mangaId);
  invalidateMangaCache();

  return true;
}

/**
 * Fetch all chapters for a manga by its manga ID or slug.
 * @param {string} mangaId
 * @returns {Promise<import('../types/schema').Chapter[]>}
 */
export async function fetchMangaChapters(mangaId) {
  if (!isSupabaseConfigured || !supabase || !mangaId) return [];

  let targetId = mangaId;
  const isUuid = typeof targetId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId.trim());
  if (!isUuid) {
    const { data: m } = await supabase.from('mangas').select('id').eq('slug', targetId).maybeSingle();
    if (m?.id) targetId = m.id;
  }

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('manga_id', targetId)
    .order('chapter_number', { ascending: false });

  if (error) {
    throw new Error(`Boblar yuklashda xatolik: ${error.message}`);
  }

  return (data || []).map(normalizeChapter);
}

/**
 * Create a new chapter for a manga.
 * @param {object} chapterData
 * @returns {Promise<any>}
 */
export async function createChapter(chapterData) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  let targetId = chapterData.mangaId;
  const isUuid = typeof targetId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId.trim());
  if (!isUuid) {
    const { data: m } = await supabase.from('mangas').select('id').eq('slug', targetId).maybeSingle();
    if (m?.id) targetId = m.id;
  }

  const row = {
    manga_id: targetId,
    chapter_number: Number(chapterData.chapterNumber),
    title: chapterData.title ? chapterData.title.trim() : `${chapterData.chapterNumber}-bob`,
    pages_count: Number(chapterData.pagesCount ?? 0),
    published_at: chapterData.publishedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('chapters')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Bob yaratishda xatolik: ${error.message}`);
  }

  return normalizeChapter(data);
}

/**
 * Update an existing chapter.
 * @param {string} chapterId
 * @param {object} chapterData
 * @returns {Promise<any>}
 */
export async function updateChapter(chapterId, chapterData) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const row = {
    chapter_number: Number(chapterData.chapterNumber),
    title: chapterData.title ? chapterData.title.trim() : `${chapterData.chapterNumber}-bob`,
    pages_count: Number(chapterData.pagesCount ?? 0),
    published_at: chapterData.publishedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('chapters')
    .update(row)
    .eq('id', chapterId)
    .select()
    .single();

  if (error) {
    throw new Error(`Bobni yangilashda xatolik: ${error.message}`);
  }

  return normalizeChapter(data);
}

/**
 * Delete a chapter.
 * @param {string} chapterId
 * @returns {Promise<boolean>}
 */
export async function deleteChapter(chapterId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId);

  if (error) {
    throw new Error(`Bobni o'chirishda xatolik: ${error.message}`);
  }

  return true;
}
