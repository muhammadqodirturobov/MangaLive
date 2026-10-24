import { useState, useEffect } from 'react';
import { Database, HardDrive, Cloud, CheckCircle2, XCircle, Copy, Check, RefreshCw } from 'lucide-react';
import { checkStorageBuckets } from '../../services/adminService.js';
import { getR2Status } from '../../services/r2StorageService.js';
import styles from './StorageDiagnostics.module.css';

export default function StorageDiagnostics({ adminUser }) {
  const [status, setStatus] = useState({
    coversReady: false,
    chaptersReady: false,
    buckets: [],
  });
  const [r2Status, setR2Status] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    const [res, r2] = await Promise.all([
      checkStorageBuckets(),
      getR2Status(),
    ]);
    setStatus(res);
    setR2Status(r2);
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const copySql = () => {
    const sql = `-- Supabase Storage Setup Script
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('manga-covers', 'manga-covers', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('manga-chapters', 'manga-chapters', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read Covers" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'manga-covers');
CREATE POLICY "Public Read Chapter Pages" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'manga-chapters');
CREATE POLICY "Admin Upload Covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manga-covers' AND public.is_admin() = true);
CREATE POLICY "Admin Upload Chapter Pages" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manga-chapters' AND public.is_admin() = true);`;

    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Supabase & Admin Auth Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Database size={18} className={styles.iconPurple} />
            <h3>Ma'lumotlar Bazasi & Avtorizatsiya</h3>
          </div>
          <div className={styles.statusRow}>
            <span>Admin E-mail:</span>
            <strong>{adminUser?.email || 'Noma\'lum'}</strong>
          </div>
          <div className={styles.statusRow}>
            <span>Foydalanuvchi UUID:</span>
            <code>{adminUser?.id || '—'}</code>
          </div>
          <div className={styles.statusRow}>
            <span>Admin Ruxsati:</span>
            <span className={styles.activePill}>
              <CheckCircle2 size={13} />
              Tasdiqlangan (public.admin_users)
            </span>
          </div>
          <div className={styles.statusRow}>
            <span>Xavfsizlik darajasi:</span>
            <span className={styles.infoText}>Row Level Security (RLS) Faol</span>
          </div>
        </div>

        {/* Supabase Storage Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <HardDrive size={18} className={styles.iconBlue} />
            <h3>Supabase Storage Holati</h3>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={loadStatus}
              disabled={loading}
              title="Qayta tekshirish"
            >
              <RefreshCw size={13} className={loading ? styles.spinning : ''} />
            </button>
          </div>

          <div className={styles.bucketRow}>
            <div className={styles.bucketInfo}>
              <strong>manga-covers</strong>
              <small>Muqova rasmlari (5MB cheklov)</small>
            </div>
            {status.coversReady ? (
              <span className={styles.readyBadge}>
                <CheckCircle2 size={13} />
                Mavjud
              </span>
            ) : (
              <span className={styles.missingBadge}>
                <XCircle size={13} />
                Yaratilmagan
              </span>
            )}
          </div>

          <div className={styles.bucketRow}>
            <div className={styles.bucketInfo}>
              <strong>manga-chapters</strong>
              <small>Bob sahifalari (10MB cheklov)</small>
            </div>
            {status.chaptersReady ? (
              <span className={styles.readyBadge}>
                <CheckCircle2 size={13} />
                Mavjud
              </span>
            ) : (
              <span className={styles.missingBadge}>
                <XCircle size={13} />
                Yaratilmagan
              </span>
            )}
          </div>

          {(!status.coversReady || !status.chaptersReady) && (
            <div className={styles.fixNotice}>
              <p>
                Storage bucketlari hali Supabase loyihangizda ochilmagan.
                Quyidagi SQL skriptini Supabase SQL Editorida ishga tushiring:
              </p>
              <button type="button" className={styles.copySqlBtn} onClick={copySql}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Nusxalandi!' : 'Storage SQL skriptini nusxalash'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Cloudflare R2 Storage Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Cloud size={18} className={styles.iconPurple} />
            <h3>Cloudflare R2 Storage</h3>
          </div>

          <div className={styles.statusRow}>
            <span>Ulanish holati:</span>
            {r2Status?.configured ? (
              <span className={styles.activePill}>
                <CheckCircle2 size={13} />
                Faol (S3 API)
              </span>
            ) : (
              <span className={styles.missingBadge}>
                <XCircle size={13} />
                Sozlanmagan
              </span>
            )}
          </div>

          <div className={styles.statusRow}>
            <span>Bucket nomi:</span>
            <code>{r2Status?.bucketName || 'mangalive'}</code>
          </div>

          <div className={styles.statusRow}>
            <span>Yetkazib berish (CDN):</span>
            <span className={styles.infoText}>
              {r2Status?.hasPublicDeliveryUrl
                ? `Custom CDN (${r2Status.publicDeliveryDomain})`
                : 'Server / API Proxy (/api/r2/*)'}
            </span>
          </div>

          <div className={styles.statusRow}>
            <span>Xavfsizlik:</span>
            <span className={styles.activePill}>
              <CheckCircle2 size={13} />
              Server-side maxfiy kalitlar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
