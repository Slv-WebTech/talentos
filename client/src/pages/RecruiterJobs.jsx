import { useEffect, useState } from 'react';
import { getSession } from '../services/authService';
import { listMyJobs, createJob, updateJob } from '../services/jobService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { Badge, Tag } from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { BriefcaseIcon, BuildingIcon, MapPinIcon, DollarIcon } from '../components/icons/Icons';
import styles from './RecruiterJobs.module.css';

const EMPTY_FORM = {
  title: '',
  department: '',
  requiredSkills: '',
  minExperienceYears: '',
  salaryMin: '',
  salaryMax: '',
  location: '',
};

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

export default function RecruiterJobs() {
  const { token } = getSession();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadJobs() {
    setLoading(true);
    listMyJobs(token)
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadJobs, [token]);

  function updateField(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createJob(token, {
        title: form.title,
        department: form.department || undefined,
        location: form.location || undefined,
        requiredSkills: form.requiredSkills
          ? form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        minExperienceYears: form.minExperienceYears ? Number(form.minExperienceYears) : undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      });
      setForm(EMPTY_FORM);
      loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(job) {
    try {
      await updateJob(token, job.id, { status: job.status === 'open' ? 'closed' : 'open' });
      loadJobs();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Job postings</h1>
        <p className={styles.subtitle}>Create new openings and manage who can see them.</p>
      </div>

      <Card>
        <h2 className={styles.formHeading}>Post a new job</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <Input label="Job title" value={form.title} onChange={updateField('title')} required />
            </div>
            <Input label="Department" optional value={form.department} onChange={updateField('department')} />
            <Input label="Location" optional value={form.location} onChange={updateField('location')} />
            <div className={styles.fieldFull}>
              <Input
                label="Required skills"
                optional
                helper="Comma-separated, e.g. React, Node.js, SQL"
                value={form.requiredSkills}
                onChange={updateField('requiredSkills')}
              />
            </div>
            <Input
              label="Minimum experience (years)"
              optional
              type="number"
              min="0"
              value={form.minExperienceYears}
              onChange={updateField('minExperienceYears')}
            />
            <div />
            <Input
              label="Salary — minimum"
              optional
              type="number"
              min="0"
              value={form.salaryMin}
              onChange={updateField('salaryMin')}
            />
            <Input
              label="Salary — maximum"
              optional
              type="number"
              min="0"
              value={form.salaryMax}
              onChange={updateField('salaryMax')}
            />
          </div>
          <Button type="submit" variant="primary" loading={submitting}>
            Post job
          </Button>
        </form>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}

      <h2 className={styles.listHeading}>Your postings</h2>

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
              <Card key={job.id}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>{job.title}</h3>
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

                <div className={styles.cardFooter}>
                  <Button
                    variant={job.status === 'open' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleStatus(job)}
                  >
                    {job.status === 'open' ? 'Close posting' : 'Reopen posting'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <EmptyState
          icon={<BriefcaseIcon width={22} height={22} />}
          title="No job postings yet"
          description="Create your first job posting using the form above to start receiving applications."
        />
      )}
    </div>
  );
}
