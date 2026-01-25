import type { Page, Route } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type',
};

const jsonResponse = (data: unknown, status = 200) => ({
  status,
  headers: {
    'content-type': 'application/json',
    ...corsHeaders,
  },
  body: JSON.stringify(data),
});

const cloneFixture = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;

export const createWcaApiState = (fixtures: { wcif: any; wcifMultiStage?: any }) => {
  const wcifById: Record<string, unknown> = {};

  if (fixtures.wcif && typeof fixtures.wcif === 'object' && 'id' in fixtures.wcif) {
    wcifById[fixtures.wcif.id] = cloneFixture(fixtures.wcif);
  }

  if (
    fixtures.wcifMultiStage &&
    typeof fixtures.wcifMultiStage === 'object' &&
    'id' in fixtures.wcifMultiStage
  ) {
    wcifById[fixtures.wcifMultiStage.id] = cloneFixture(fixtures.wcifMultiStage);
  }

  return {
    wcifById,
    wcif: cloneFixture(fixtures.wcif),
  };
};

export const seedAuth = async (
  page: Page,
  options?: {
    clientId?: string;
    accessToken?: string;
    expirationTime?: string;
  }
) => {
  const clientId = options?.clientId ?? 'e2e-client';
  const accessToken = options?.accessToken ?? 'e2e-access-token';
  const expirationTime =
    options?.expirationTime ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await page.addInitScript(
    ({ clientId, accessToken, expirationTime }) => {
      const accessKey = `delegate-dashboard.${clientId}.accessToken`;
      const expirationKey = `delegate-dashboard.${clientId}.expirationTime`;
      localStorage.setItem(accessKey, accessToken);
      localStorage.setItem(expirationKey, expirationTime);
    },
    { clientId, accessToken, expirationTime }
  );
};

export const registerWcaApiRoutes = async (
  page: Page,
  state: { wcif: any; wcifById: Record<string, any> },
  fixtures: {
    me: unknown;
    competitionsUpcoming: unknown;
    competitionsPast: unknown;
    personsSearch: unknown;
    person: unknown;
    usersSearch: unknown;
    user: unknown;
  }
) => {
  await page.route('**/api/v0/**', async (route: Route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      return;
    }

    const url = new URL(request.url());
    const apiIndex = url.pathname.indexOf('/api/v0');
    const apiPath = apiIndex >= 0 ? url.pathname.slice(apiIndex + '/api/v0'.length) : url.pathname;

    if (apiPath === '/me' && method === 'GET') {
      await route.fulfill(jsonResponse({ me: fixtures.me }));
      return;
    }

    if (apiPath === '/competitions' && method === 'GET') {
      const payload = url.searchParams.has('end')
        ? fixtures.competitionsPast
        : fixtures.competitionsUpcoming;
      await route.fulfill(jsonResponse(payload));
      return;
    }

    const wcifMatch = apiPath.match(/^\/competitions\/([^/]+)\/wcif$/);
    if (wcifMatch && method === 'GET') {
      const competitionId = wcifMatch[1];
      const wcif = state.wcifById[competitionId] ?? state.wcif;
      await route.fulfill(jsonResponse(wcif));
      return;
    }

    if (wcifMatch && method === 'PATCH') {
      const competitionId = wcifMatch[1];
      const body = request.postData();
      const patch = body ? JSON.parse(body) : {};
      const existing = state.wcifById[competitionId] ?? state.wcif;
      const next = { ...existing, ...patch };
      state.wcifById[competitionId] = next;
      if (competitionId === state.wcif?.id) {
        state.wcif = next;
      }
      await route.fulfill(jsonResponse(next));
      return;
    }

    if (apiPath === '/persons' && method === 'GET') {
      await route.fulfill(jsonResponse(fixtures.personsSearch));
      return;
    }

    const personMatch = apiPath.match(/^\/persons\/(\d+)$/);
    if (personMatch && method === 'GET') {
      await route.fulfill(jsonResponse(fixtures.person));
      return;
    }

    if (apiPath === '/search/users' && method === 'GET') {
      await route.fulfill(jsonResponse(fixtures.usersSearch));
      return;
    }

    const userMatch = apiPath.match(/^\/users\/(\d+)$/);
    if (userMatch && method === 'GET') {
      await route.fulfill(jsonResponse(fixtures.user));
      return;
    }

    await route.fulfill(jsonResponse({ error: 'Unhandled WCA API request' }, 404));
  });
};
