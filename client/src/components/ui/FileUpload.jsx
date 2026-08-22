import { useId, useRef, useState } from 'react';
import styles from './FileUpload.module.css';
import { AlertIcon, UploadIcon, XIcon } from '../icons/Icons';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'File must be a PDF, DOC, or DOCX';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File must be 5MB or smaller';
  }
  return null;
}

export default function FileUpload({ label, file, onChange }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);

  function handleFiles(fileList) {
    const picked = fileList?.[0];
    if (!picked) return;
    const error = validateFile(picked);
    if (error) {
      setLocalError(error);
      onChange(null);
      return;
    }
    setLocalError(null);
    onChange(picked);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove(e) {
    e.stopPropagation();
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      {file ? (
        <div className={styles.fileRow}>
          <span className={styles.fileIcon}>
            <UploadIcon width={18} height={18} />
          </span>
          <span className={styles.fileMeta}>
            <span className={styles.fileName}>{file.name}</span>
            <span className={styles.fileSize}>{formatSize(file.size)}</span>
          </span>
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemove}
            aria-label="Remove selected file"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>
      ) : (
        <div
          className={[styles.dropzone, dragActive && styles.dropzoneActive, localError && styles.dropzoneInvalid]
            .filter(Boolean)
            .join(' ')}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <span className={styles.icon}>
            <UploadIcon width={24} height={24} />
          </span>
          <span className={styles.instructions}>
            Drag and drop your resume, or <span className={styles.browseLink}>browse</span>
          </span>
          <span className={styles.hint}>PDF, DOC, or DOCX — up to 5MB</span>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.hiddenInput}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {localError && (
        <span className={styles.errorText} role="alert">
          <AlertIcon width={14} height={14} />
          {localError}
        </span>
      )}
    </div>
  );
}
