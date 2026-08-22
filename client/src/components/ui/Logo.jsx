import styles from './Logo.module.css';
import { SparkleIcon } from '../icons/Icons';

export default function Logo({ size = 'md', className = '' }) {
  return (
    <span className={[styles.logo, size === 'sm' && styles.sm, className].filter(Boolean).join(' ')}>
      <span className={styles.mark}>
        <SparkleIcon width={16} height={16} stroke="currentColor" />
      </span>
      <span className={styles.wordmark}>
        Talent<span style={{ color: 'var(--brand)' }}>OS</span>
      </span>
    </span>
  );
}
