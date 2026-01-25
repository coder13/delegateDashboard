import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = dirname(fileURLToPath(import.meta.url));

const readJson = <T>(filename: string): T => {
  const raw = readFileSync(join(fixturesDir, filename), 'utf-8');
  return JSON.parse(raw) as T;
};

export const fixtures = {
  me: readJson('me.json'),
  competitionsUpcoming: readJson('competitions-upcoming.json'),
  competitionsPast: readJson('competitions-past.json'),
  wcif: readJson('wcif.json'),
  wcifMultiStage: readJson('wcif-multi-stage.json'),
  personsSearch: readJson('persons-search.json'),
  person: readJson('person.json'),
  usersSearch: readJson('users-search.json'),
  user: readJson('user.json'),
};
