import styles from './Card.module.css';

export default function Card({ padded = true, interactive = false, className = '', children, ...props }) {
  const classes = [styles.card, padded && styles.padded, interactive && styles.interactive, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
