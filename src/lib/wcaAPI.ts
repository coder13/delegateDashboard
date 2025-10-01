import { getLocalStorage } from './localStorage';
import { pick } from './utils';
import { WCA_ORIGIN } from './wca-env';
import { Competition } from '@wca/helpers';

interface WcaUser {
  id: number;
  name: string;
  avatar?: {
    url: string;
    thumb_url: string;
  };
  [key: string]: any;
}

export interface WcaPerson {
  id: string;
  name: string;
  [key: string]: any;
}

interface WcaCompetition {
  id: string;
  name: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  [key: string]: any;
}

const wcaAccessToken = (): string | null => getLocalStorage('accessToken');

export const getMe = (): Promise<WcaUser> => {
  console.log('Access Token:', wcaAccessToken());
  return wcaApiFetch(`/me`);
};

/**
 * @deprecated
 */
export const getManageableCompetitions = (): Promise<WcaCompetition[]> => {
  const params = new URLSearchParams({
    managed_by_me: 'true',
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getUpcomingManageableCompetitions = (): Promise<WcaCompetition[]> => {
  const oneWeekAgo = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    managed_by_me: 'true',
    start: oneWeekAgo.toISOString(),
    sort: 'start_date',
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getPastManageableCompetitions = (): Promise<WcaCompetition[]> => {
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
  const keysDiff = Object.keys(newWcif).filter((key) => previousWcif[key] !== newWcif[key]);
  if (keysDiff.length === 0) return Promise.resolve();
  return patchWcif(newWcif.id, pick(newWcif, keysDiff));
};

export const searchPersons = (query: string): Promise<WcaPerson[]> =>
  wcaApiFetch(`/persons?q=${query}`);

export const getPerson = (personId: string): Promise<WcaPerson> =>
  wcaApiFetch(`/persons/${personId}`);

export const searchUsers = (query: string): Promise<{ result: WcaUser[] }> =>
  wcaApiFetch(`/search/users?q=${query}`);

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
