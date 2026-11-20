import styles from './Logo.module.css';

// The TalentOS "T + spark" mark (matches assets/logo-mark.svg).
function MarkGlyph() {
  return (
    <svg width="20" height="20" viewBox="22 14 98 92" aria-hidden="true" focusable="false">
      <rect x="26" y="38" width="56" height="18" rx="6" fill="#fff" />
      <rect x="45" y="56" width="18" height="44" rx="6" fill="#fff" />
      <path d="M100 20l4.2 9.8L114 34l-9.8 4.2L100 48l-4.2-9.8L86 34l9.8-4.2z" fill="#ffd166" />
    </svg>
  );
}

export default function Logo({ size = 'md', className = '' }) {
  return (
    <span className={[styles.logo, size === 'sm' && styles.sm, className].filter(Boolean).join(' ')}>
      <span className={styles.mark}>
        <MarkGlyph />
      </span>
      <span className={styles.wordmark}>
        Talent<span style={{ color: 'var(--brand)' }}>OS</span>
      </span>
    </span>
  );
}
