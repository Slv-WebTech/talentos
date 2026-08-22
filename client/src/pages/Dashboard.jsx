import { Link } from 'react-router-dom';
import { getSession } from '../services/authService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  BriefcaseIcon,
  InboxIcon,
  SparkleIcon,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon,
} from '../components/icons/Icons';
import styles from './Dashboard.module.css';

const PRIMARY_ACTION = {
  recruiter: {
    icon: BriefcaseIcon,
    heading: 'Manage job postings',
    body: 'Create new openings, edit existing ones, and track applicant status.',
    to: '/recruiter/jobs',
    cta: 'Go to job postings',
  },
  candidate: {
    icon: InboxIcon,
    heading: 'Browse open jobs',
    body: 'Explore current openings that match your skills and apply in a few clicks.',
    to: '/candidate/jobs',
    cta: 'Browse open jobs',
  },
};

const ROADMAP_ITEMS = [
  {
    icon: SparkleIcon,
    title: 'AI resume screening',
    body: "Automatically parse and rank incoming resumes against each job's requirements.",
  },
  {
    icon: ClockIcon,
    title: 'Interview scheduling',
    body: 'Coordinate interviews and move candidates through your pipeline.',
  },
  {
    icon: UsersIcon,
    title: 'Hiring analytics',
    body: 'Track pipeline health and time-to-hire across every posting.',
  },
];

export default function Dashboard() {
  const { user } = getSession();
  const firstName = user.name.trim().split(/\s+/)[0];
  const primary = PRIMARY_ACTION[user.role];
  const PrimaryIcon = primary?.icon;

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <p className={styles.eyebrow}>Welcome back</p>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>Hi, {firstName}</h1>
          <Badge tone="brand" className={styles.roleBadge}>
            {user.role}
          </Badge>
        </div>
      </div>

      {primary && (
        <Card interactive className={styles.primaryCard}>
          <span className={styles.primaryIconBadge}>
            <PrimaryIcon width={24} height={24} />
          </span>
          <h2 className={styles.primaryHeading}>{primary.heading}</h2>
          <p className={styles.primaryBody}>{primary.body}</p>
          <Button
            variant="primary"
            as={Link}
            to={primary.to}
            rightIcon={<ArrowRightIcon width={16} height={16} />}
          >
            {primary.cta}
          </Button>
        </Card>
      )}

      <section className={styles.roadmapSection}>
        <h2 className={styles.roadmapHeading}>What's next</h2>
        <div className={styles.roadmapGrid}>
          {ROADMAP_ITEMS.map((item) => (
            <Card key={item.title} className={styles.roadmapCard}>
              <div className={styles.roadmapCardHeader}>
                <span className={styles.roadmapIconWrap}>
                  <item.icon width={20} height={20} />
                </span>
                <Badge tone="neutral">Coming soon</Badge>
              </div>
              <h3 className={styles.roadmapCardTitle}>{item.title}</h3>
              <p className={styles.roadmapCardBody}>{item.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
