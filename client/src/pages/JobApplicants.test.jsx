import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/authService', () => ({ getSession: () => ({ token: 't', user: { id: 1, name: 'R', role: 'recruiter' } }) }));
vi.mock('../services/jobService', () => ({ getJob: vi.fn().mockResolvedValue({ id: 5, title: 'Engineer' }) }));
vi.mock('../services/applicationService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listApplicationsPage: vi.fn(),
    updateApplicationStatus: vi.fn(),
    getStatusHistory: vi.fn(),
    getResumeUrl: vi.fn(),
    rerankJob: vi.fn(),
  };
});

import JobApplicants from './JobApplicants';
import * as service from '../services/applicationService';

const applicant = (over = {}) => ({
  id: 1, candidate_name: 'Ann', candidate_email: 'ann@x.io', pipeline_status: 'applied',
  parsed_data: { skills: ['python'], experienceYears: 3 }, ranking_score: 88.4, ranking_details: { matchedSkills: ['python'], missingSkills: [] },
  ...over,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/recruiter/jobs/5']}>
      <Routes>
        <Route path="/recruiter/jobs/:id" element={<JobApplicants />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  service.listApplicationsPage.mockResolvedValue({ data: [applicant()], meta: { limit: 20, offset: 0, hasMore: false } });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('JobApplicants', () => {
  it('renders applicants with match score and only valid next statuses', async () => {
    renderPage();
    expect(await screen.findByText('Ann')).toBeTruthy();
    expect(screen.getByText('Match 88%')).toBeTruthy();
    const select = screen.getByLabelText('Pipeline status for Ann');
    expect([...select.options].map((o) => o.value)).toEqual(['applied', 'shortlisted', 'rejected']);
  });

  it('asks for confirmation before rejecting and does nothing when declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    const select = await screen.findByLabelText('Pipeline status for Ann');
    fireEvent.change(select, { target: { value: 'rejected' } });
    expect(window.confirm).toHaveBeenCalled();
    expect(service.updateApplicationStatus).not.toHaveBeenCalled();
  });

  it('updates status when confirmed and shows feedback', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    service.updateApplicationStatus.mockResolvedValue(applicant({ pipeline_status: 'rejected' }));
    renderPage();
    fireEvent.change(await screen.findByLabelText('Pipeline status for Ann'), { target: { value: 'rejected' } });
    expect(await screen.findByText('Ann moved to Rejected.')).toBeTruthy();
    expect(service.updateApplicationStatus).toHaveBeenCalledWith('t', 1, 'rejected');
  });

  it('shows the server message when a transition is refused', async () => {
    service.updateApplicationStatus.mockRejectedValue(new Error('cannot move an application from applied to selected'));
    renderPage();
    fireEvent.change(await screen.findByLabelText('Pipeline status for Ann'), { target: { value: 'shortlisted' } });
    expect(await screen.findByText(/cannot move an application/)).toBeTruthy();
  });

  it('applies search and status filters through the API and shows a filtered empty state', async () => {
    renderPage();
    await screen.findByText('Ann');
    service.listApplicationsPage.mockResolvedValue({ data: [], meta: { limit: 20, offset: 0, hasMore: false } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'selected' } });
    await waitFor(() => expect(service.listApplicationsPage).toHaveBeenLastCalledWith('t', '5', expect.objectContaining({ status: 'selected' })));
    expect(await screen.findByText('No applicants match these filters')).toBeTruthy();
  });

  it('falls back to a link when the browser blocks the resume tab', async () => {
    service.getResumeUrl.mockResolvedValue({ url: 'https://signed.example/r' });
    vi.spyOn(window, 'open').mockReturnValue(null);
    renderPage();
    fireEvent.click(await screen.findByText('View resume ↗'));
    const link = await screen.findByText('Open the resume');
    expect(link.getAttribute('href')).toBe('https://signed.example/r');
  });

  it('loads more without duplicating rows', async () => {
    service.listApplicationsPage
      .mockResolvedValueOnce({ data: [applicant()], meta: { limit: 20, offset: 0, hasMore: true } })
      .mockResolvedValueOnce({ data: [applicant(), applicant({ id: 2, candidate_name: 'Bo', candidate_email: 'bo@x.io' })], meta: { limit: 20, offset: 1, hasMore: false } });
    renderPage();
    fireEvent.click(await screen.findByText('Load more'));
    expect(await screen.findByText('Bo')).toBeTruthy();
    expect(screen.getAllByText('Ann')).toHaveLength(1);
  });
});
