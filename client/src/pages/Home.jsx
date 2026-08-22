import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import { getServerHealth } from '../services/healthService';
import { getSession } from '../services/authService';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ArrowRightIcon, BriefcaseIcon, InboxIcon, SparkleIcon } from '../components/icons/Icons';

const STATUS_META = {
  checking: { tone: 'neutral', pulse: true, label: 'Checking system status…' },
  ok: { tone: 'success', pulse: false, label: 'All systems operational' },
  unreachable: { tone: 'danger', pulse: false, label: 'Server unreachable' },
};

const FEATURES = [
  {
    icon: BriefcaseIcon,
    title: 'For recruiters',
    description: 'Post roles in minutes, manage every posting in one place, and open or close applications on demand.',
  },
  {
    icon: InboxIcon,
    title: 'For candidates',
    description: 'Browse open roles with clear requirements up front — skills, experience, and salary range at a glance.',
  },
  {
    icon: SparkleIcon,
    title: 'AI-powered matching',
    description: 'Resume parsing and candidate ranking against job requirements, so nothing is screened by hand.',
  },
];

export default function Home() {
  const [status, setStatus] = useState('checking');
  const session = getSession();

  useEffect(() => {
    getServerHealth()
      .then((data) => setStatus(data.status === 'ok' ? 'ok' : 'unreachable'))
      .catch(() => setStatus('unreachable'));
  }, []);

  const statusMeta = STATUS_META[status] ?? STATUS_META.checking;

  return (
    <div>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Logo />
          <div className={styles.headerActions}>
            {session ? (
              <Button as={Link} to="/dashboard" variant="primary" rightIcon={<ArrowRightIcon width={16} height={16} />}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost">
                  Log in
                </Button>
                <Button as={Link} to="/register" variant="primary">
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <span className={styles.eyebrow}>
            <Badge tone="brand">AI-assisted hiring</Badge>
          </span>
          <h1 className={styles.title}>Hire faster, with a shortlist AI already ranked for you.</h1>
          <p className={styles.subtitle}>
            TalentOS is a recruiting platform for posting jobs, collecting applications, and — as resume parsing and
            ranking come online — screening candidates against your requirements automatically.
          </p>
          <div className={styles.actions}>
            {session ? (
              <Button as={Link} to="/dashboard" variant="primary" size="lg" rightIcon={<ArrowRightIcon width={18} height={18} />}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register" variant="primary" size="lg" rightIcon={<ArrowRightIcon width={18} height={18} />}>
                  Get started
                </Button>
                <Button as={Link} to="/login" variant="secondary" size="lg">
                  Log in
                </Button>
              </>
            )}
          </div>
          <div className={styles.statusRow}>
            <Badge tone={statusMeta.tone} dot pulse={statusMeta.pulse}>
              {statusMeta.label}
            </Badge>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Everything hiring needs, one pipeline</h2>
            <p className={styles.sectionSubtitle}>
              Built for the two people who actually run a hiring process — the recruiter posting the role, and the
              candidate applying to it.
            </p>
          </div>
          <div className={styles.grid}>
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <span className={styles.featureIcon}>
                  <feature.icon width={20} height={20} />
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {!session && (
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaCard}>
              <div>
                <h2 className={styles.ctaTitle}>Ready to build your pipeline?</h2>
                <p className={styles.ctaSubtitle}>
                  Create an account as a recruiter to post your first role, or as a candidate to start browsing.
                </p>
              </div>
              <Button as={Link} to="/register" variant="secondary" size="lg">
                Create your account
              </Button>
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} TalentOS</span>
          <span>Built for faster, fairer hiring</span>
        </div>
      </footer>
    </div>
  );
}
