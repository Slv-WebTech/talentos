import styles from './Alert.module.css';
import { AlertIcon, CheckIcon } from '../icons/Icons';

const TONES = {
  danger: styles.danger,
  warning: styles.warning,
  success: styles.success,
  info: styles.info,
};

export default function Alert({ tone = 'danger', children, className = '' }) {
  const Icon = tone === 'success' ? CheckIcon : AlertIcon;
  return (
    <div className={[styles.alert, TONES[tone], className].filter(Boolean).join(' ')} role="alert">
      <Icon className={styles.icon} width={18} height={18} />
      <div>{children}</div>
    </div>
  );
}
