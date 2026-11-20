import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './JobApplicants.module.css';
import { getSession } from '../services/authService';
import { getJob } from '../services/jobService';
import {
  listApplicationsPage,
  getResumeUrl,
  getStatusHistory,
  rerankJob,
  updateApplicationStatus,
  allowedNextStatuses,
  CONFIRM_STATUSES,
  STATUS_TONE,
  formatStatusLabel,
} from '../services/applicationService';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { Badge, Tag } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { ClockIcon, UsersIcon } from '../components/icons/Icons';

const PAGE_SIZE = 20;

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
  const [notice, setNotice] = useState(null);
  const [resumeFallback, setResumeFallback] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', sort: 'score' });
  const [histories, setHistories] = useState({});

  // debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => (f.q === searchText.trim() ? f : { ...f, q: searchText.trim() })), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    getJob(token, id)
      .then(setJob)
      .catch((err) => setError(err.message));
  }, [token, id]);

  const loadFirstPage = useCallback(
    (limit = PAGE_SIZE) => {
      setLoading(true);
      return listApplicationsPage(token, id, { offset: 0, limit, ...filters })
        .then((page) => {
          setApplicants(page.data);
          setHasMore(page.meta.hasMore);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token, id, filters]
  );

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const page = await listApplicationsPage(token, id, { offset: applicants.length, limit: PAGE_SIZE, ...filters });
      setApplicants((prev) => [...prev, ...page.data.filter((a) => !prev.some((p) => p.id === a.id))]);
      setHasMore(page.meta.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleRerank() {
    setError(null);
    setNotice(null);
    try {
      const { updated } = await rerankJob(token, id);
      await loadFirstPage(Math.max(applicants.length, PAGE_SIZE));
      setNotice(`Re-scored ${updated} applicant${updated === 1 ? '' : 's'}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOpenResume(applicationId) {
    setError(null);
    setResumeFallback(null);
    try {
      const { url } = await getResumeUrl(token, applicationId);
      const tab = window.open(url, '_blank', 'noopener,noreferrer');
      // popup blockers can reject window.open after an async call; offer the link instead
      if (!tab) setResumeFallback(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(application, status) {
    setError(null);
    setNotice(null);
    if (
      CONFIRM_STATUSES.includes(status) &&
      !window.confirm(`Mark ${application.candidate_name} as ${formatStatusLabel(status)}?`)
    ) {
      return;
    }
    try {
      const updated = await updateApplicationStatus(token, application.id, status);
      setApplicants((prev) =>
        prev.map((a) => (a.id === application.id ? { ...a, pipeline_status: updated.pipeline_status } : a))
      );
      setHistories((h) => {
        const { [application.id]: _stale, ...rest } = h;
        return rest;
      });
      setNotice(`${application.candidate_name} moved to ${formatStatusLabel(updated.pipeline_status)}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleHistory(applicationId) {
    if (histories[applicationId]) {
      setHistories((h) => {
        const { [applicationId]: _closed, ...rest } = h;
        return rest;
      });
      return;
    }
    try {
      setHistories((h) => ({ ...h, [applicationId]: { rows: null } }));
      const rows = await getStatusHistory(token, applicationId);
      setHistories((h) => ({ ...h, [applicationId]: { rows } }));
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = Boolean(filters.q || filters.status);

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/recruiter/jobs">
        ← Back to job postings
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>{job ? `Applicants — ${job.title}` : 'Applicants'}</h1>
        <p className={styles.subtitle}>
          {filters.sort === 'newest' ? 'Newest applications first.' : 'Best AI match first.'}
        </p>
      </div>

      <div className={styles.filterBar} role="search">
        <Input
          label="Search applicants"
          type="search"
          placeholder="Name or email"
          value={searchText}
          maxLength={100}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select label="Status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'].map((st) => (
            <option key={st} value={st}>
              {formatStatusLabel(st)}
            </option>
          ))}
        </Select>
        <Select label="Sort by" value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
          <option value="score">Best match</option>
          <option value="newest">Newest</option>
        </Select>
      </div>

      <div aria-live="polite">{notice && <Alert tone="success">{notice}</Alert>}</div>
      {error && <Alert tone="danger">{error}</Alert>}
      {resumeFallback && (
        <Alert tone="warning">
          Your browser blocked the new tab.{' '}
          <a href={resumeFallback} target="_blank" rel="noopener noreferrer">
            Open the resume
          </a>
          .
        </Alert>
      )}

      {loading && (
        <div className={styles.grid}>
          <ApplicantCardSkeleton />
          <ApplicantCardSkeleton />
          <ApplicantCardSkeleton />
        </div>
      )}

      {!loading && applicants.length > 0 && (
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
              <select
                className={styles.statusSelect}
                aria-label={`Pipeline status for ${app.candidate_name}`}
                value={app.pipeline_status}
                onChange={(e) => handleStatusChange(app, e.target.value)}
              >
                {[app.pipeline_status, ...allowedNextStatuses(app.pipeline_status)].map((st) => (
                  <option key={st} value={st}>
                    {formatStatusLabel(st)}
                  </option>
                ))}
              </select>

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

              {histories[app.id] && (
                <ol className={styles.historyList} aria-label={`Status history for ${app.candidate_name}`}>
                  {histories[app.id].rows === null && <li>Loading…</li>}
                  {histories[app.id].rows?.length === 0 && <li>No status changes yet.</li>}
                  {histories[app.id].rows?.map((h) => (
                    <li key={h.id}>
                      {formatStatusLabel(h.from_status)} → {formatStatusLabel(h.to_status)}
                      {h.changed_by_name ? ` by ${h.changed_by_name}` : ''} · {new Date(h.created_at).toLocaleString()}
                    </li>
                  ))}
                </ol>
              )}

              <div className={styles.cardFooter}>
                {app.ranking_score != null && (
                  <span
                    className={styles.matchScore}
                    title={`Matched: ${(app.ranking_details?.matchedSkills || []).join(', ') || 'none'}; missing: ${(app.ranking_details?.missingSkills || []).join(', ') || 'none'}`}
                  >
                    Match {Math.round(app.ranking_score)}%
                  </span>
                )}
                <button type="button" className={styles.resumeLink} onClick={() => toggleHistory(app.id)} aria-expanded={Boolean(histories[app.id])}>
                  History
                </button>
                <button type="button" className={styles.resumeLink} onClick={() => handleOpenResume(app.id)}>
                  View resume ↗
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && applicants.length > 0 && (
        <div className={styles.listActions}>
          <Button variant="secondary" size="sm" onClick={handleRerank}>
            Re-score all
          </Button>
          {hasMore && (
            <Button variant="secondary" size="sm" onClick={handleLoadMore} loading={loadingMore}>
              Load more
            </Button>
          )}
        </div>
      )}

      {!loading && !error && applicants.length === 0 && (
        <EmptyState
          icon={<UsersIcon width={22} height={22} />}
          title={filtered ? 'No applicants match these filters' : 'No applicants yet'}
          description={
            filtered
              ? 'Try a different search or status.'
              : "Once candidates apply to this job, they'll show up here with their parsed resume details."
          }
        />
      )}
    </div>
  );
}
