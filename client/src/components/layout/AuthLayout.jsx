import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';
import Logo from '../ui/Logo';
import Card from '../ui/Card';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className={styles.page}>
      <Link to="/" className={styles.logoLink} aria-label="TalentOS home">
        <Logo />
      </Link>
      <div className={styles.card}>
        <Card>
          <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.form}>{children}</div>
        </Card>
        {footer && <p className={styles.footerText}>{footer}</p>}
      </div>
    </div>
  );
}
