import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  getMe,
  getPastManageableCompetitions,
  getUpcomingManageableCompetitions,
  saveWcifChanges,
  wcaApiFetch,
} from './wcaAPI';

vi.mock('./localStorage', () => ({
  getLocalStorage: vi.fn(() => 'token-123'),
}));

vi.mock('./wca-env', () => ({
  WCA_ORIGIN: 'https://wca.test',
}));

const mockFetch = (response: Partial<Response>) => {
  const baseResponse: Partial<Response> = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({ ok: true }),
  };
  globalThis.fetch = vi.fn().mockResolvedValue({ ...baseResponse, ...response });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('wcaAPI', () => {
  it('fetches /me with auth headers', async () => {
    mockFetch({ json: vi.fn().mockResolvedValue({ me: { id: 1 } }) });

    await getMe();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://wca.test/api/v0/me',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it('throws helpful errors when responses are not ok', async () => {
    mockFetch({ ok: false, status: 500, statusText: 'Server Error' });

    await expect(wcaApiFetch('/me')).rejects.toThrow('500: Server Error');

    mockFetch({ ok: false, status: 418, statusText: '' });
    await expect(wcaApiFetch('/me')).rejects.toThrow('Something went wrong: Status code 418');
  });

  it('builds upcoming and past competition queries', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(0);
    mockFetch({ json: vi.fn().mockResolvedValue([]) });

    await getUpcomingManageableCompetitions();
    await getPastManageableCompetitions();

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
      .map((call) => call[0] as string)
      .join(' ');

    expect(calls).toContain('managed_by_me=true');
    expect(calls).toContain('start=1969-12-18T00%3A00%3A00.000Z');
    expect(calls).toContain('end=1969-12-25T00%3A00%3A00.000Z');
  });

  it('only patches changed WCIF keys', async () => {
    mockFetch({ json: vi.fn().mockResolvedValue({ id: 'Comp', name: 'New' }) });
    const previousWcif = {
      id: 'Comp',
      name: 'Old',
      schedule: { startDate: '2024-01-01', numberOfDays: 1, venues: [] },
      events: [],
      persons: [],
      extensions: [],
    } as any;
    const newWcif = { ...previousWcif, name: 'New' };

    await saveWcifChanges(previousWcif, newWcif);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://wca.test/api/v0/competitions/Comp/wcif',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'New' }),
      })
    );
  });

  it('returns early when there are no WCIF changes', async () => {
    mockFetch({ json: vi.fn().mockResolvedValue({}) });
    const wcif = {
      id: 'Comp',
      name: 'Same',
      schedule: { startDate: '2024-01-01', numberOfDays: 1, venues: [] },
      events: [],
      persons: [],
      extensions: [],
    } as any;

    await saveWcifChanges(wcif, wcif);

    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      'https://wca.test/api/v0/competitions/Comp/wcif',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});
