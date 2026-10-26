import { Zap, BookCheck, ShieldCheck, Smartphone } from 'lucide-react';
import styles from './ValuePropositionStrip.module.css';

const PILLARS = [
  {
    icon: Zap,
    title: 'Tezkor R2 Bulut',
    desc: 'Kechikishsiz bir zumda yuklanish',
    color: '#38bdf8',
  },
  {
    icon: BookCheck,
    title: 'Sifatli Tarjima',
    desc: "O'zbek tilidagi rasmiy uslub",
    color: '#a855f7',
  },
  {
    icon: ShieldCheck,
    title: '100% Bepul',
    desc: 'Hech qanday to\'lov va reklamasiz',
    color: '#22c55e',
  },
  {
    icon: Smartphone,
    title: 'Qulay Mutolaa',
    desc: 'Mobil va veb uchun moslashtirilgan',
    color: '#fbbf24',
  },
];

export default function ValuePropositionStrip() {
  return (
    <section className={styles.stripSection} aria-label="MangaLive afzalliklari">
      <div className={styles.stripCard}>
        {PILLARS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className={styles.pillarItem}>
              <div
                className={styles.iconWrap}
                style={{ '--icon-accent': p.color }}
              >
                <Icon size={18} className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.textWrap}>
                <h4 className={styles.pillarTitle}>{p.title}</h4>
                <p className={styles.pillarDesc}>{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
