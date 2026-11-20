import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  allowedNextStatuses,
  CONFIRM_STATUSES,
  formatStatusLabel,
  listApplicationsPage,
} from './applicationService';

afterEach(() => vi.restoreAllMocks());

describe('status helpers', () => {
  it('formats labels', () => {
    expect(formatStatusLabel('interview_scheduled')).toBe('Interview Scheduled');
  });

  it('only offers valid transitions and never a direct rejected -> selected jump', () => {
    expect(allowedNextStatuses('rejected')).not.toContain('selected');
    expect(allowedNextStatuses('selected')).not.toContain('rejected');
    expect(allowedNextStatuses('applied')).toEqual(['shortlisted', 'rejected']);
    expect(allowedNextStatuses('unknown')).toEqual([]);
  });

  it('asks for confirmation on final outcomes only', () => {
    expect(CONFIRM_STATUSES).toEqual(['selected', 'rejected']);
  });
});

describe('listApplicationsPage', () => {
  it('builds the query string, encodes search text and returns data with meta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1 }], meta: { limit: 20, offset: 0, hasMore: true } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const page = await listApplicationsPage('tok', 7, { q: 'a&b c', status: 'shortlisted', sort: 'newest', offset: 20 });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/applications');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      job: '7', limit: '20', offset: '20', sort: 'newest', q: 'a&b c', status: 'shortlisted',
    });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    expect(page.meta.hasMore).toBe(true);
    expect(page.data).toHaveLength(1);
  });

  it('omits empty filters and surfaces API errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: 'bad status' } }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(listApplicationsPage('tok', 1)).rejects.toThrow('bad status');
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.has('status')).toBe(false);
  });
});
