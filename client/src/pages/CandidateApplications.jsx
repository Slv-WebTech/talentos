import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './CandidateApplications.module.css';
import { getSession } from '../services/authService';
import { listMyApplications, STATUS_TONE, formatStatusLabel } from '../services/applicationService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { BuildingIcon, InboxIcon, MapPinIcon } from '../components/icons/Icons';

function ApplicationCardSkeleton() {
  return (
    <Card className={styles.skeletonCard}>
      <Skeleton width="70%" height="1.25rem" />
      <Skeleton width="45%" height="0.875rem" />
    </Card>
  );
}

export default function CandidateApplications() {
  const { token } = getSession();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    listMyApplications(token)
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My applications</h1>
        <p className={styles.subtitle}>Track the status of every job you've applied to.</p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading && (
        <div className={styles.grid}>
          <ApplicationCardSkeleton />
          <ApplicationCardSkeleton />
          <ApplicationCardSkeleton />
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className={styles.grid}>
          {applications.map((app) => (
            <Card key={app.id}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>{app.job_title}</h3>
                <Badge tone={STATUS_TONE[app.pipeline_status]} dot>
                  {formatStatusLabel(app.pipeline_status)}
                </Badge>
              </div>
              {(app.job_department || app.job_location) && (
                <span className={styles.metaRow}>
                  <BuildingIcon width={16} height={16} className={styles.metaIcon} />
                  {app.job_department}
                  {app.job_location && ` — ${app.job_location}`}
                </span>
              )}
              <span className={styles.appliedDate}>
                Applied {new Date(app.created_at).toLocaleDateString()}
              </span>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          icon={<InboxIcon width={22} height={22} />}
          title="No applications yet"
          description="Browse open jobs and apply to start tracking your applications here."
          action={
            <Button as={Link} to="/candidate/jobs" variant="primary">
              Browse open jobs
            </Button>
          }
        />
      )}
    </div>
  );
}
