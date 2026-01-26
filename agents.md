# Delegate Dashboard - Agent Instructions

See `spec.md` for feature behavior and product details.

We use yarn, not npm

## Project Structure

```
src/
├── lib/                    # Pure business logic (no React)
│   ├── assignmentGenerators/ # Assignment generation pipeline
│   ├── domain/             # Domain helpers (activities, persons, events)
│   ├── importExport/        # CSV import/export utilities
│   ├── wcif/               # WCIF helpers, groups, extensions, validation
│   ├── api/                # WCA API + localStorage helpers
│   └── utils/              # Shared utilities (time, history, etc.)
├── store/                  # Redux (actions, reducer, reducers, selectors)
├── pages/Competition/      # Feature-based page components
│   ├── Round/              # Round editing (groups, times)
│   ├── Assignments/        # Bulk assignment management
│   ├── Staff/              # Staff role assignment
│   └── Person/             # Individual person editor
├── components/             # Reusable UI components
├── providers/              # React context (Auth, Breadcrumbs, CommandPrompt)
└── config/                 # Static config (assignments.ts - assignment types/colors)
```

## Commands

Installation: ALWAYS use `yarn install` (not npm). The project has peer dependency conflicts that require `--legacy-peer-deps` with npm.

```bash
yarn dev            # Dev server on http://localhost:5173 (Vite, not port 3000)
yarn lint           # ESLint - MUST pass before commits (pre-commit hook)
yarn build          # Production build to dist/ (runs tsc first)
yarn test           # Vitest test suite
```

Environment: `.env` sets `VITE_WCA_ORIGIN` to staging. Use `VITE_` prefix for all env vars (Vite requirement).

## State Management Architecture

Redux + Thunks - No slices, single reducer in `src/store/reducer.ts`:

- Actions: `src/store/actions.ts` - Action creators and thunks for async operations (WCA API calls)
- Reducer: Switch-style reducer with sub-reducers in `src/store/reducers/` for complex operations
- Selectors: `src/store/selectors.ts` - Memoized selectors using `reselect`
- Typed Hooks: Use `useAppSelector` and `useAppDispatch` from `src/store/index.ts` (not raw `useAppSelector`/`useDispatch`)

### WCIF Update Pattern

Never mutate WCIF directly. Use immutable update helpers from `src/lib/utils`:

```typescript
// Update nested properties immutably
updateIn(wcif, ['persons', 0, 'name'], (name) => newName);
mapIn(wcif, ['persons'], (person) => ({ ...person, checked: true }));
setIn(wcif, ['schedule', 'venues', 0, 'name'], 'New Venue');
```

## Code Conventions

### Component Patterns

- Functional components only with hooks (no class components)
- Material-UI styling: Use `sx` prop, avoid inline styles. Theme in `src/theme.ts`

## Known Issues and Warnings

Safe to ignore during build:

- CSS syntax warnings (`Unexpected ";"`)
- Large chunk size warning (>500 KB)
- Peer dependency warnings during install
- Browserslist outdated warning

## Writing Tests

- Tests go in their own _tests_ folder in the same folder as the code being tested.
- Add or update tests when changing behavior.
- Tests use Vitest + React Testing Library.
- Prefer existing test data builders before creating inline fixtures.
- For store-related tests, use helpers in `src/store/reducers/_tests_/helpers.ts`:
  - `buildActivity(overrides)`
  - `buildPerson(overrides)`
  - `buildWcif(activities, persons)`
  - `buildState(wcif)`
- For new tests that need additional builders, extend the shared helpers instead of duplicating patterns.
- Keep fixtures minimal and override only the fields relevant to the assertion.
- Use `as Assignment[]` or similar type narrowing only when the type system requires it.
