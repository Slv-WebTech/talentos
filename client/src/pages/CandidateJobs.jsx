import { useEffect, useState } from 'react';
import { getSession } from '../services/authService';
import { listOpenJobs } from '../services/jobService';
import Card from '../components/ui/Card';
import { Badge, Tag } from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { BuildingIcon, MapPinIcon, ClockIcon, DollarIcon, InboxIcon } from '../components/icons/Icons';
import styles from './CandidateJobs.module.css';

function formatSalary(min, max) {
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return null;
}

function JobCardSkeleton() {
  return (
    <Card className={styles.skeletonCard}>
      <Skeleton width="70%" height="1.25rem" />
      <Skeleton width="45%" height="0.875rem" />
      <Skeleton width="55%" height="0.875rem" />
      <Skeleton width="90%" height="1.5rem" radius="var(--radius-sm)" />
    </Card>
  );
}

export default function CandidateJobs() {
  const { token } = getSession();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listOpenJobs(token)
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Open jobs</h1>
        <p className={styles.subtitle}>Explore current openings and find your next role.</p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading && (
        <div className={styles.grid}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className={styles.grid}>
          {jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max);
            return (
              <Card key={job.id} interactive>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>{job.title}</h3>
                  <Badge tone="success" dot>
                    Open
                  </Badge>
                </div>

                <div className={styles.metaList}>
                  {job.department && (
                    <span className={styles.metaRow}>
                      <BuildingIcon width={16} height={16} className={styles.metaIcon} />
                      {job.department}
                    </span>
                  )}
                  {job.location && (
                    <span className={styles.metaRow}>
                      <MapPinIcon width={16} height={16} className={styles.metaIcon} />
                      {job.location}
                    </span>
                  )}
                  {job.min_experience_years != null && (
                    <span className={styles.metaRow}>
                      <ClockIcon width={16} height={16} className={styles.metaIcon} />
                      {job.min_experience_years}+ years experience
                    </span>
                  )}
                  {salary && (
                    <span className={styles.metaRow}>
                      <DollarIcon width={16} height={16} className={styles.metaIcon} />
                      {salary}
                    </span>
                  )}
                </div>

                {job.required_skills?.length > 0 && (
                  <div className={styles.tagRow}>
                    {job.required_skills.map((skill) => (
                      <Tag key={skill}>{skill}</Tag>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState
          icon={<InboxIcon width={22} height={22} />}
          title="No open jobs right now"
          description="Check back soon — new openings are posted regularly."
        />
      )}
    </div>
  );
}
