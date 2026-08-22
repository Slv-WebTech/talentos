import styles from './Button.module.css';

const VARIANTS = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
};

const SIZES = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  iconOnly = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  children,
  disabled,
  ...props
}) {
  const classes = [
    styles.button,
    VARIANTS[variant],
    SIZES[size],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && (
        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2.2" opacity="0.25" />
          <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
      {iconOnly ? (
        !loading && children
      ) : (
        <>
          {!loading && leftIcon}
          {children}
          {!loading && rightIcon}
        </>
      )}
    </Component>
  );
}
