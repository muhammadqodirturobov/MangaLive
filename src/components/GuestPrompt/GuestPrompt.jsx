import { useState, useEffect } from 'react';
import { Sparkles, X, Bookmark, History, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './GuestPrompt.module.css';

export const GUEST_CHAPTERS_COUNT_KEY = 'ml_guest_chapters_read';
export const REG_PROMPT_DISMISSED_KEY = 'ml_reg_prompt_dismissed';

export function recordGuestChapterRead() {
  try {
    const current = parseInt(localStorage.getItem(GUEST_CHAPTERS_COUNT_KEY) || '0', 10);
    localStorage.setItem(GUEST_CHAPTERS_COUNT_KEY, String(current + 1));
  } catch {
    // LocalStorage fallback
  }
}

export default function GuestPrompt() {
  const { user, openAuthModal } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      setVisible(false);
      return;
    }

    try {
      const dismissed = localStorage.getItem(REG_PROMPT_DISMISSED_KEY);
      if (dismissed === 'true') {
        setVisible(false);
        return;
      }

      const count = parseInt(localStorage.getItem(GUEST_CHAPTERS_COUNT_KEY) || '0', 10);
      if (count >= 3) {
        setVisible(true);
      }
    } catch {
      setVisible(false);
    }
  }, [user]);

  function handleDismiss() {
    setVisible(false);
    try {
      localStorage.setItem(REG_PROMPT_DISMISSED_KEY, 'true');
    } catch {
      // LocalStorage fallback
    }
  }

  function handleSignUp() {
    handleDismiss();
    openAuthModal('signup');
  }

  if (!visible || user) return null;

  return (
    <div className={styles.banner} role="region" aria-label="Ro'yxatdan o'tish taklifi">
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <Sparkles size={16} className={styles.sparkleIcon} />
          <span className={styles.title}>MangaLive-da o'qish yoqdimi?</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className={styles.closeBtn}
          aria-label="Yopish va boshqa ko'rsatmaslik"
        >
          <X size={15} />
        </button>
      </div>

      <p className={styles.desc}>
        Bepul hisob yarating va o'qish qulayligini oshiring:
      </p>

      <ul className={styles.benefits}>
        <li><Bookmark size={13} className={styles.benefitIcon} /> Sevimlilar va xatcho'plar</li>
        <li><History size={13} className={styles.benefitIcon} /> Oxirgi o'qilgan sahifani eslab qolish</li>
        <li><Smartphone size={13} className={styles.benefitIcon} /> Barcha qurilmalarda sinxronizatsiya</li>
      </ul>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleSignUp}
          className={`btn btn-primary ${styles.signUpBtn}`}
        >
          Bepul hisob ochish
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className={styles.dismissBtn}
        >
          Keyinroq
        </button>
      </div>
    </div>
  );
}
