import styles from './Badge.module.css';

const TONES = {
  neutral: styles.neutral,
  brand: styles.brand,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
};

export function Badge({ tone = 'neutral', dot = false, pulse = false, className = '', children }) {
  return (
    <span className={[styles.badge, TONES[tone], className].filter(Boolean).join(' ')}>
      {dot && <span className={[styles.dot, pulse && styles.dotPulse].filter(Boolean).join(' ')} />}
      {children}
    </span>
  );
}

export function Tag({ children, className = '' }) {
  return <span className={[styles.tag, className].filter(Boolean).join(' ')}>{children}</span>;
}
