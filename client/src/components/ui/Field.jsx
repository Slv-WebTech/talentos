import { useId, useState } from 'react';
import styles from './Field.module.css';
import { ChevronDownIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../icons/Icons';

function FieldShell({ label, optional, helper, error, htmlFor, children }) {
  const helperId = useId();
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {optional && <span className={styles.optional}>Optional</span>}
        </label>
      )}
      {children(helperId)}
      {error ? (
        <span className={styles.errorText} id={helperId} role="alert">
          <AlertIcon width={14} height={14} />
          {error}
        </span>
      ) : (
        helper && (
          <span className={styles.helper} id={helperId}>
            {helper}
          </span>
        )
      )}
    </div>
  );
}

export function Input({ label, optional, helper, error, id, className = '', ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldShell label={label} optional={optional} helper={helper} error={error} htmlFor={inputId}>
      {(helperId) => (
        <div className={styles.inputWrap}>
          <input
            id={inputId}
            className={[styles.input, error && styles.invalid, className].filter(Boolean).join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error || helper ? helperId : undefined}
            {...props}
          />
        </div>
      )}
    </FieldShell>
  );
}

export function PasswordInput({ label, optional, helper, error, id, className = '', ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell label={label} optional={optional} helper={helper} error={error} htmlFor={inputId}>
      {(helperId) => (
        <div className={styles.inputWrap}>
          <input
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={[styles.input, styles.hasTrailing, error && styles.invalid, className]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error || helper ? helperId : undefined}
            {...props}
          />
          <button
            type="button"
            className={styles.trailingButton}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            {visible ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
          </button>
        </div>
      )}
    </FieldShell>
  );
}

export function Select({ label, optional, helper, error, id, className = '', children, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldShell label={label} optional={optional} helper={helper} error={error} htmlFor={inputId}>
      {(helperId) => (
        <div className={styles.inputWrap}>
          <select
            id={inputId}
            className={[styles.select, error && styles.invalid, className].filter(Boolean).join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error || helper ? helperId : undefined}
            {...props}
          >
            {children}
          </select>
          <span className={styles.selectChevron}>
            <ChevronDownIcon width={16} height={16} />
          </span>
        </div>
      )}
    </FieldShell>
  );
}
