import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './AuthModal.module.css';

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState(authModalTab || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (authModalTab) setTab(authModalTab);
    setError('');
    setSuccessMsg('');
  }, [authModalTab, isAuthModalOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        if (!email.trim() || !password) throw new Error('Email va parolni kiriting');
        await signIn(email.trim(), password);
      } else if (tab === 'signup') {
        if (!email.trim() || !password) throw new Error('Email va parolni kiriting');
        if (password.length < 6) throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        await signUp(email.trim(), password, fullName);
      } else if (tab === 'reset') {
        if (!email.trim()) throw new Error('Emailingizni kiriting');
        await resetPassword(email.trim());
        setSuccessMsg("Parolni tiklash havolasi emailingizga yuborildi. Pochtangizni tekshiring.");
      }
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeAuthModal()}>
      <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button
          type="button"
          className={styles.closeBtn}
          onClick={closeAuthModal}
          aria-label="Yopish"
        >
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.logoBadge}>MangaLive</div>
          <h2 id="auth-modal-title" className={styles.title}>
            {tab === 'login' && 'Hisobga kirish'}
            {tab === 'signup' && "Ro'yxatdan o'tish"}
            {tab === 'reset' && 'Parolni tiklash'}
          </h2>
          <p className={styles.subtitle}>
            {tab === 'login' && "Sevimlilar va o'qish tarixingizni barcha qurilmalarda sinxronlang"}
            {tab === 'signup' && "Bir necha soniyada bepul MangaLive a'zosi bo'ling"}
            {tab === 'reset' && "Emailingizni kiriting, tiklash havolasini yuboramiz"}
          </p>
        </div>

        {tab !== 'reset' && (
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'login' ? styles.activeTab : ''}`}
              onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            >
              Kirish
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'signup' ? styles.activeTab : ''}`}
              onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
            >
              Ro'yxatdan o'tish
            </button>
          </div>
        )}

        {error && (
          <div className={styles.alertError} role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.alertSuccess} role="status">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'signup' && (
            <div className={styles.field}>
              <label htmlFor="auth-name" className={styles.label}>Ismingiz yoki Taxallus</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Masalan: Jasur"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={styles.input}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="auth-email" className={styles.label}>Email manzil</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="nomi@misol.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                autoComplete="email"
              />
            </div>
          </div>

          {tab !== 'reset' && (
            <div className={styles.field}>
              <div className={styles.passwordHeader}>
                <label htmlFor="auth-password" className={styles.label}>Parol</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    className={styles.forgotBtn}
                    onClick={() => { setTab('reset'); setError(''); setSuccessMsg(''); }}
                  >
                    Parolni unutdingizmi?
                  </button>
                )}
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Kamida 6 ta belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary ${styles.submitBtn}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>Kutilmoqda...</span>
              </>
            ) : (
              <span>
                {tab === 'login' && 'Kirish'}
                {tab === 'signup' && "Ro'yxatdan o'tish"}
                {tab === 'reset' && 'Tiklash havolasini yuborish'}
              </span>
            )}
          </button>
        </form>

        {tab === 'reset' && (
          <div className={styles.backToLogin}>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            >
              ← Kirish sahifasiga qaytish
            </button>
          </div>
        )}

        <div className={styles.guestNote}>
          ✨ <span>Mehmon sifatida cheklovsiz o'qish doim ochiq</span>
        </div>
      </div>
    </div>
  );
}
