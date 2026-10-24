import { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { testMangaConnection } from '../services/mangaService.js';
import styles from './ConnectionTestPage.module.css';

export default function ConnectionTestPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await testMangaConnection();
      setResult(res);
    } catch (err) {
      setResult({
        success: false,
        isConfigured: true,
        message: `Kutilmagan xatolik yuz berdi: ${err.message}`,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex', gap: '8px' }}>
          <ArrowLeft size={16} /> Bosh sahifaga qaytish
        </Link>
        <h1 className={styles.title}>
          <Database size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--color-purple-400)' }} />
          Supabase Ulanish Diagnostikasi
        </h1>
        <p className={styles.subtitle}>
          Frontend va PostgreSQL/Supabase bazasi o&apos;rtasidagi ulanish va RLS siyosatlarini tekshirish
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.statusRow}>
          {loading ? (
            <span className={`${styles.badge} ${styles.badgeFallback}`}>
              <RefreshCw size={14} className="spin" /> Tekshirilmoqda...
            </span>
          ) : result?.success ? (
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
              <CheckCircle2 size={14} /> Muvaffaqiyatli ulangan
            </span>
          ) : result?.isConfigured ? (
            <span className={`${styles.badge} ${styles.badgeError}`}>
              <XCircle size={14} /> Ulanish xatosi
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeFallback}`}>
              <AlertTriangle size={14} /> Mahalliy Demo Rejim
            </span>
          )}
        </div>

        <p className={styles.message}>
          {loading ? "Ma'lumotlar bazasiga so'rov yuborilmoqda..." : result?.message}
        </p>

        {/* Error Details if connection failed */}
        {!loading && result && !result.success && result.isConfigured && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>Xatolik tafsilotlari:</div>
            <div style={{ color: '#fca5a5', fontSize: 'var(--text-sm)', marginBottom: '8px' }}>
              {result.error}
            </div>
            {result.code && (
              <span className={styles.errorCode}>Postgres xato kodi: {result.code}</span>
            )}
            <div className={styles.instructionBox} style={{ marginTop: '12px' }}>
              <div className={styles.instructionTitle}>Qanday tuzatish mumkin:</div>
              <ul className={styles.instructionList}>
                <li><code>.env.local</code> faylida <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> to&apos;g&apos;ri ekanligini tekshiring.</li>
                <li>Supabase loyihangiz faol holatdaligini tasdiqlang.</li>
                <li>Supabase SQL Editorida <code>supabase/recovery_safe_schema.sql</code> skripti muvaffaqiyatli bajarilganligiga ishonch hosil qiling.</li>
              </ul>
            </div>
          </div>
        )}

        {/* If Not Configured */}
        {!loading && result && !result.isConfigured && (
          <div className={styles.instructionBox}>
            <div className={styles.instructionTitle}>Haqiqiy Supabase loyihasini ulash tartibi:</div>
            <ol className={styles.instructionList}>
              <li>Supabase Dashboard &gt; Project Settings &gt; API bo&apos;limiga kiring.</li>
              <li><code>Project URL</code> va <code>anon public</code> kalitini nusxalang.</li>
              <li>Loyiha ildizidagi <code>.env.local</code> fayliga quyidagicha joylashtiring:
                <pre style={{ margin: '8px 0', padding: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px' }}>
{`VITE_SUPABASE_URL=https://<sizning-loyiha-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
                </pre>
              </li>
              <li>Vite serverini qayta ishga tushiring (yoki sahifani yangilang) va bu yerda &quot;Qayta tekshirish&quot; tugmasini bosing.</li>
            </ol>
          </div>
        )}

        {/* If Successful */}
        {!loading && result && result.success && (
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
              Jonli bazadan olingan namunalar ({result.count} ta asar mavjud):
            </h4>
            {result.data && result.data.length > 0 ? (
              <div className={styles.recordList}>
                {result.data.map((m) => (
                  <div key={m.id} className={styles.recordItem}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.title}</span>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>
                      slug: <code style={{ color: 'var(--color-purple-300)' }}>{m.slug || m.id}</code> · {m.status} · {m.chapters} bob
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>
                Bazada hozircha manga yozuvlari yo&apos;q. SQL yoki Admin orqali qo&apos;shilishi kutilmoqda.
              </p>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={runTest}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Qayta tekshirish
          </button>
        </div>
      </div>
    </main>
  );
}
