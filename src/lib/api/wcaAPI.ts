import { pick } from '../utils';
import { getLocalStorage } from './localStorage';
import { CompetitionSearchResult, WcaPerson, WcaUser } from './types';
import { WCA_ORIGIN } from './wca-env';
import { Competition } from '@wca/helpers';

const wcaAccessToken = (): string | null => getLocalStorage('accessToken');

export const getMe = (): Promise<{ me: WcaUser }> => {
  console.log('Access Token:', wcaAccessToken());
  return wcaApiFetch(`/me`);
};

/**
 * @deprecated
 */
export const getManageableCompetitions = (): Promise<CompetitionSearchResult[]> => {
  const params = new URLSearchParams({
    managed_by_me: 'true',
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getUpcomingManageableCompetitions = (): Promise<CompetitionSearchResult[]> => {
  const oneWeekAgo = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    managed_by_me: 'true',
    start: oneWeekAgo.toISOString(),
    sort: 'start_date',
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getPastManageableCompetitions = (): Promise<CompetitionSearchResult[]> => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    managed_by_me: 'true',
    end: oneWeekAgo.toISOString(),
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getWcif = (competitionId: string): Promise<Competition> =>
  wcaApiFetch(`/competitions/${competitionId}/wcif`);

export const patchWcif = (
  competitionId: string,
  wcif: Partial<Competition>
): Promise<Competition> =>
  wcaApiFetch(`/competitions/${competitionId}/wcif`, {
    method: 'PATCH',
    body: JSON.stringify(wcif),
  });

export const saveWcifChanges = (
  previousWcif: Competition,
  newWcif: Competition
): Promise<Competition | void> => {
  const keysDiff = Object.keys(newWcif).filter(
    (key) => previousWcif[key as keyof Competition] !== newWcif[key as keyof Competition]
  );
  if (keysDiff.length === 0) return Promise.resolve();
  return patchWcif(newWcif.id, pick(newWcif, keysDiff));
};

export const searchPersons = (query: string): Promise<WcaPerson[]> =>
  wcaApiFetch(`/persons?q=${query}`);

export const getPerson = (personId: number): Promise<WcaPerson> =>
  wcaApiFetch(`/persons/${personId}`);

export const searchUsers = (query: string): Promise<{ result: WcaUser[] }> =>
  wcaApiFetch(`/search/users?q=${query}`);

export const getUser = (userId: number): Promise<{ user: WcaUser }> =>
  wcaApiFetch(`/users/${userId}`);

export const wcaApiFetch = async <T = any>(
  path: string,
  fetchOptions: RequestInit = {}
): Promise<T> => {
  const baseApiUrl = `${WCA_ORIGIN}/api/v0`;

  const res = await fetch(
    `${baseApiUrl}${path}`,
    Object.assign({}, fetchOptions, {
      headers: new Headers({
        Authorization: `Bearer ${wcaAccessToken()}`,
        'Content-Type': 'application/json',
      }),
    })
  );

  if (!res.ok) {
    if (res.statusText) {
      throw new Error(`${res.status}: ${res.statusText}`);
    } else {
      throw new Error(`Something went wrong: Status code ${res.status}`);
    }
  }

  return await res.json();
};
