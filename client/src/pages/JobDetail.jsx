import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './JobDetail.module.css';
import { getSession } from '../services/authService';
import { getJob } from '../services/jobService';
import { applyToJob, listMyApplications, STATUS_TONE, formatStatusLabel } from '../services/applicationService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Badge, Tag } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import FileUpload from '../components/ui/FileUpload';
import { ArrowRightIcon, BuildingIcon, ClockIcon, DollarIcon, MapPinIcon } from '../components/icons/Icons';

function formatSalary(min, max) {
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return null;
}

export default function JobDetail() {
  const { id } = useParams();
  const { token } = getSession();
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getJob(token, id), listMyApplications(token)])
      .then(([jobData, applications]) => {
        setJob(jobData);
        setApplication(applications.find((a) => a.job_id === Number(id)) || null);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!resumeFile) {
      setSubmitError('Please attach your resume before applying.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const created = await applyToJob(token, { jobId: id, resumeFile });
      setApplication(created);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Skeleton width="120px" height="1rem" />
        <Skeleton width="60%" height="2rem" />
        <Skeleton width="100%" height="180px" radius="var(--radius-lg)" />
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className={styles.page}>
        <Alert tone="danger">{loadError || 'Job not found.'}</Alert>
        <Link className={styles.backLink} to="/candidate/jobs">
          Back to open jobs
        </Link>
      </div>
    );
  }

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/candidate/jobs">
        ← Back to open jobs
      </Link>

      <div className={styles.header}>
        <div className={styles.headRow}>
          <h1 className={styles.title}>{job.title}</h1>
          <Badge tone={job.status === 'open' ? 'success' : 'neutral'} dot>
            {job.status}
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
      </div>

      {application ? (
        <Card className={styles.appliedCard}>
          <Badge tone={STATUS_TONE[application.pipeline_status]} dot>
            {formatStatusLabel(application.pipeline_status)}
          </Badge>
          <p className={styles.appliedHeading}>You've already applied to this job</p>
          <Button as={Link} to="/candidate/applications" variant="secondary" rightIcon={<ArrowRightIcon width={16} height={16} />}>
            View your applications
          </Button>
        </Card>
      ) : job.status !== 'open' ? (
        <Alert tone="warning">This job is no longer accepting applications.</Alert>
      ) : (
        <Card>
          <h2 className={styles.formHeading}>Apply to this job</h2>
          {submitError && <Alert tone="danger">{submitError}</Alert>}
          <form className={styles.form} onSubmit={handleSubmit}>
            <FileUpload label="Resume" file={resumeFile} onChange={setResumeFile} />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              Submit application
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
