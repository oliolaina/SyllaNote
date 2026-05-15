import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import styles from './Header.module.css';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className={styles.header}>
      <Link to="/notes" className={styles.brand}>
        SyllaNote
      </Link>
      <div className={styles.right}>
        {user && (
          <span className={styles.user}>
            <strong>{user.name || user.email}</strong>
            <br />
            {user.email}
          </span>
        )}
        <Button variant="ghost" size="small" onClick={logout}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
