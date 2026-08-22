import styles from './RoleOption.module.css';

export function RoleOptionGroup({ children }) {
  return <div className={styles.group}>{children}</div>;
}

export function RoleOption({ name, value, checked, onChange, icon, title, description }) {
  return (
    <label className={[styles.option, checked && styles.checked].filter(Boolean).join(' ')}>
      <input
        className={styles.input}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.icon}>{icon}</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>
    </label>
  );
}
