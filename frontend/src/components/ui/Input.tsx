import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface FieldProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={[styles.input, className].filter(Boolean).join(' ')} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea
        className={[styles.input, styles.textarea, className].filter(Boolean).join(' ')}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
