import { wcaAccessToken } from './auth';
import { pick } from './utils';
import { WCA_ORIGIN } from './wca-env';

export const getMe = () => {
  console.log('Access Token:', wcaAccessToken());
  return wcaApiFetch(`/me`);
};

export const getManageableCompetitions = () => {
  const params = new URLSearchParams({
    managed_by_me: true,
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getUpcomingManageableCompetitions = () => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    managed_by_me: true,
    start: oneWeekAgo.toISOString(),
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getPastManageableCompetitions = () => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    managed_by_me: true,
    end: oneWeekAgo.toISOString(),
  });
  return wcaApiFetch(`/competitions?${params.toString()}`);
};

export const getWcif = (competitionId) => wcaApiFetch(`/competitions/${competitionId}/wcif`);

export const patchWcif = (competitionId, wcif) =>
  wcaApiFetch(`/competitions/${competitionId}/wcif`, {
    method: 'PATCH',
    body: JSON.stringify(wcif),
  });

export const saveWcifChanges = (previousWcif, newWcif) => {
  const keysDiff = Object.keys(newWcif).filter((key) => previousWcif[key] !== newWcif[key]);
  if (keysDiff.length === 0) return Promise.resolve();
  return patchWcif(newWcif.id, pick(newWcif, keysDiff));
};

export const searchPersons = (query) => wcaApiFetch(`/persons?q=${query}`);

export const getPerson = (personId) => wcaApiFetch(`/persons/${personId}`);

export const wcaApiFetch = async (path, fetchOptions = {}) => {
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
    throw new Error(`${res.status}${res.statusText ? `: ${res.statusText}` : ''}`);
  }

  return await res.json();
};
