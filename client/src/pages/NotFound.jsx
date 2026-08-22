import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import { getSession } from '../services/authService';
import { ArrowRightIcon } from '../components/icons/Icons';

export default function NotFound() {
  const session = getSession();
  return (
    <div className={styles.page}>
      <Logo />
      <div>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.subtitle}>The page you're looking for doesn't exist or may have moved.</p>
      </div>
      <Button as={Link} to={session ? '/dashboard' : '/'} variant="primary" rightIcon={<ArrowRightIcon width={16} height={16} />}>
        {session ? 'Back to dashboard' : 'Back home'}
      </Button>
    </div>
  );
}
