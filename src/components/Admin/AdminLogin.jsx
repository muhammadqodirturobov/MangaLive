import { useState } from 'react';
import { ShieldCheck, LogIn, AlertCircle, ArrowLeft, KeyRound, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminSignIn } from '../../services/adminService.js';
import styles from './AdminLogin.module.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      await adminSignIn(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.iconCircle}>
            <ShieldCheck size={28} className={styles.shieldIcon} />
          </div>
          <h1 className={styles.loginTitle}>Admin Boshqaruv Paneli</h1>
          <p className={styles.loginSubtitle}>
            MangaLive.uz kontent boshqaruvi va ommaviy import tizimi
          </p>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} />
            <div className={styles.errorText}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="admin-email" className={styles.label}>
              Admin E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              required
              className={styles.input}
              placeholder="admin@mangalive.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="admin-pass" className={styles.label}>
              Parol
            </label>
            <input
              id="admin-pass"
              type="password"
              required
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span>Tekshirilmoqda...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Boshqaruv paneliga kirish</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.securityNotice}>
          <div className={styles.noticeHeader}>
            <KeyRound size={14} />
            <span>Xavfsizlik & Avtorizatsiya talabi</span>
          </div>
          <p>
            Tizimga faqat Supabase <code>public.admin_users</code> jadvalida ro'yxatdan o'tgan yoki
            maxfiy <code>app_metadata.is_admin = true</code> huquqiga ega foydalanuvchilar kira oladi.
            Barcha amallar PostgreSQL RLS tomonidan himoyalangan.
          </p>
          <div className={styles.sqlHint}>
            <Database size={13} />
            <span>Supabase SQL: <code>INSERT INTO public.admin_users (user_id) VALUES ('uid');</code></span>
          </div>
        </div>

        <div className={styles.loginFooter}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Asosiy saytga qaytish</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
