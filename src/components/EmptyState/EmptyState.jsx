import { SearchX } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * EmptyState — shown when search returns no results or a section is empty.
 * @param {string}    title   — heading text
 * @param {string}    message — body copy
 * @param {ReactNode} action  — optional CTA button/link
 */
export default function EmptyState({ title, message, action }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <SearchX size={48} className={styles.icon} aria-hidden="true" />
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
