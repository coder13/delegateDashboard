import { wcaAccessToken } from './auth';
import { WCA_ORIGIN } from './wca-env';
import { pick } from './utils';

export const getMe = () => {
  console.log(wcaAccessToken());
  return wcaApiFetch(`/me`);
}

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

export const getWcif = competitionId =>
  wcaApiFetch(`/competitions/${competitionId}/wcif`);

export const updateWcif = (competitionId, wcif) =>
  wcaApiFetch(`/competitions/${competitionId}/wcif`, {
    method: 'PATCH',
    body: JSON.stringify(wcif),
  });

export const saveWcifChanges = (previousWcif, newWcif) => {
  const keysDiff = Object.keys(newWcif).filter(
    key => previousWcif[key] !== newWcif[key]
  );
  if (keysDiff.length === 0) return Promise.resolve();
  return updateWcif(newWcif.id, pick(newWcif, keysDiff));
};

export const wcaApiFetch = (path, fetchOptions = {}) => {
  const baseApiUrl = `${WCA_ORIGIN}/api/v0`;

  console.log('fetching', path, wcaAccessToken())

  return fetch(
    `${baseApiUrl}${path}`,
    Object.assign({}, fetchOptions, {
      headers: new Headers({
        Authorization: `Bearer ${wcaAccessToken()}`,
        'Content-Type': 'application/json',
      }),
    })
  ).then(response => {
    if (!response.ok) throw new Error(response.statusText);
    return response;
  }).then(response => response.json());
};