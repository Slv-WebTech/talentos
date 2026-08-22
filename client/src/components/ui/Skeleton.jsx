import styles from './Skeleton.module.css';

export function Skeleton({ width = '100%', height = '1rem', radius, className = '', style = {} }) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
    />
  );
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={[styles.spinner, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2.2" opacity="0.2" />
      <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
