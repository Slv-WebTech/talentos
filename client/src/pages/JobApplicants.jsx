import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './JobApplicants.module.css';
import { getSession } from '../services/authService';
import { getJob } from '../services/jobService';
import { listApplicationsForJob, STATUS_TONE, formatStatusLabel } from '../services/applicationService';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { Badge, Tag } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { ClockIcon, UsersIcon } from '../components/icons/Icons';

function ApplicantCardSkeleton() {
  return (
    <Card className={styles.skeletonCard}>
      <Skeleton width="60%" height="1.25rem" />
      <Skeleton width="45%" height="0.875rem" />
      <Skeleton width="90%" height="1.5rem" radius="var(--radius-sm)" />
    </Card>
  );
}

export default function JobApplicants() {
  const { id } = useParams();
  const { token } = getSession();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getJob(token, id), listApplicationsForJob(token, id)])
      .then(([jobData, applications]) => {
        setJob(jobData);
        setApplicants(applications);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/recruiter/jobs">
        ← Back to job postings
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>{job ? `Applicants — ${job.title}` : 'Applicants'}</h1>
        <p className={styles.subtitle}>Everyone who has applied to this job, newest first.</p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading && (
        <div className={styles.grid}>
          <ApplicantCardSkeleton />
          <ApplicantCardSkeleton />
          <ApplicantCardSkeleton />
        </div>
      )}

      {!loading && !error && applicants.length > 0 && (
        <div className={styles.grid}>
          {applicants.map((app) => (
            <Card key={app.id}>
              <div className={styles.cardHead}>
                <span className={styles.candidateName}>{app.candidate_name}</span>
                <Badge tone={STATUS_TONE[app.pipeline_status]} dot>
                  {formatStatusLabel(app.pipeline_status)}
                </Badge>
              </div>
              <p className={styles.candidateEmail}>{app.candidate_email}</p>

              {app.parsed_data?.parseError ? (
                <Alert tone="warning">
                  Resume couldn't be parsed automatically ({app.parsed_data.parseError}) — review it manually.
                </Alert>
              ) : (
                <div className={styles.detailList}>
                  {app.parsed_data?.experienceYears != null && (
                    <span className={styles.metaRow}>
                      <ClockIcon width={16} height={16} className={styles.metaIcon} />
                      {app.parsed_data.experienceYears}+ years experience
                    </span>
                  )}
                  {app.parsed_data?.skills?.length > 0 && (
                    <div>
                      <span className={styles.detailLabel}>Skills</span>
                      <div className={styles.tagRow}>
                        {app.parsed_data.skills.map((skill) => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  {app.parsed_data?.education?.length > 0 && (
                    <div>
                      <span className={styles.detailLabel}>Education</span>
                      <div className={styles.educationList}>
                        {app.parsed_data.education.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.cardFooter}>
                <a className={styles.resumeLink} href={app.resume_url} target="_blank" rel="noreferrer">
                  View resume ↗
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && applicants.length === 0 && (
        <EmptyState
          icon={<UsersIcon width={22} height={22} />}
          title="No applicants yet"
          description="Once candidates apply to this job, they'll show up here with their parsed resume details."
        />
      )}
    </div>
  );
}
