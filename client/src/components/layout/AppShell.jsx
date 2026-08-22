import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './AppShell.module.css';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { getSession, logout } from '../../services/authService';
import { BriefcaseIcon, ClockIcon, InboxIcon, LogoutIcon, MenuIcon, XIcon } from '../icons/Icons';

function navItemsFor(role) {
  const items = [{ to: '/dashboard', label: 'Dashboard', icon: null }];
  if (role === 'recruiter') {
    items.push({ to: '/recruiter/jobs', label: 'Job postings', icon: BriefcaseIcon });
  }
  if (role === 'candidate') {
    items.push({ to: '/candidate/jobs', label: 'Browse jobs', icon: InboxIcon });
    items.push({ to: '/candidate/applications', label: 'My applications', icon: ClockIcon });
  }
  return items;
}

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = getSession();
  const user = session?.user;
  const navItems = navItemsFor(user?.role);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <div className={styles.left}>
            <Link to="/dashboard" aria-label="Go to dashboard">
              <Logo />
            </Link>
            <nav className={styles.nav} aria-label="Primary">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[styles.navLink, location.pathname === item.to && styles.navLinkActive]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={location.pathname === item.to ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.right}>
            {user && (
              <div className={styles.userChip}>
                <span className={styles.avatar}>{initials(user.name)}</span>
                <span className={styles.userMeta}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userRole}>{user.role}</span>
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" leftIcon={<LogoutIcon width={16} height={16} />} onClick={handleLogout}>
              Log out
            </Button>
            <button
              type="button"
              className={styles.menuButton}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <nav
          className={[styles.mobileNav, mobileOpen && styles.mobileNavOpen].filter(Boolean).join(' ')}
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={[styles.navLink, location.pathname === item.to && styles.navLinkActive]
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main id="main-content" className={styles.main}>
        <div className="container">{children}</div>
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} TalentOS</span>
          <span>Built for faster, fairer hiring</span>
        </div>
      </footer>
    </div>
  );
}
