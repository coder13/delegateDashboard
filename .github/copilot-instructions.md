# Delegate Dashboard - Copilot Instructions

## Repository Summary

Delegate Dashboard is a web application for managing WCA (World Cube Association) competition logistics. It enables delegates and organizers to edit competitions, set staff roles, create and edit groups, and manage competitor assignments through an intuitive interface. The app is deployed on Netlify and integrates with the WCA API.

## Domain Model (WCIF)

All competition data lives in a **WCIF** (WCA Competition Interchange Format) object stored in Redux. The WCIF is the single source of truth for:

- **schedule**: Venues → Rooms → Activities (rounds, lunch, etc.)
- **events**: Events → Rounds → Results
- **persons**: Registrations, roles (delegate/organizer), and assignments

Key concepts:

- **Activity Codes**: Hierarchical identifiers like `333-r1-g2` (3x3 Round 1 Group 2). Parse with `parseActivityCode()` from `src/lib/activities.ts`
- **Child Activities**: Round activities contain `childActivities` representing groups. Same `activityCode` can exist in multiple rooms with different IDs
- **Assignments**: Link persons to activities with roles (`competitor`, `staff-judge`, `staff-scrambler`, etc.). See `src/config/assignments.ts`
- **Extensions**: Custom data attached to WCIF entities via `buildExtension()` / `getExtensionData()` in `src/lib/wcif-extensions.js`

Use `@wca/helpers` npm package for type-safe WCIF manipulation (types: `Competition`, `Activity`, `Person`, `Assignment`, `Event`).

## State Management Architecture

**Redux + Thunks** - No slices, single reducer in `src/store/reducer.js`:

- **Actions**: `src/store/actions.js` - Action creators and thunks for async operations (WCA API calls)
- **Reducer**: Switch-style reducer with sub-reducers in `src/store/reducers/` for complex operations
- **Selectors**: `src/store/selectors.js` - Memoized selectors using `reselect`
- **Typed Hooks**: Use `useAppSelector` and `useAppDispatch` from `src/store/index.ts` (not raw `useAppSelector`/`useDispatch`)

### WCIF Update Pattern

**Never mutate WCIF directly**. Use immutable update helpers from `src/lib/utils.ts`:

```typescript
// Update nested properties immutably
updateIn(wcif, ['persons', 0, 'name'], (name) => newName);
mapIn(wcif, ['persons'], (person) => ({ ...person, checked: true }));
setIn(wcif, ['schedule', 'venues', 0, 'name'], 'New Venue');
```

To save changes: Dispatch `saveWcifChanges(previousWcif, newWcif)` - it diffs and PATCHes only changed top-level keys to WCA API.

## Critical Workflows

**Installation**: ALWAYS use `yarn install` (not npm). The project has peer dependency conflicts that require `--legacy-peer-deps` with npm.

**Development**:

```bash
yarn start          # Dev server on http://localhost:5173 (Vite, not port 3000)
yarn lint           # ESLint - MUST pass before commits (pre-commit hook)
yarn build          # Production build to dist/ (runs tsc first)
```

**No unit tests exist** - `yarn test` only runs linting. Manual testing required.

**Environment**: `.env` sets `VITE_WCA_ORIGIN` to staging. Use `VITE_` prefix for all env vars (Vite requirement).

## Code Conventions

### Component Patterns

- **Functional components only** with hooks (no class components)
- Mix of `.tsx` (new) and `.jsx` (legacy) - prefer TypeScript for new files
- **Material-UI styling**: Use `sx` prop, avoid inline styles. Theme in `src/theme.ts`
- **Routing**: React Router v6 with history API. See `src/App/Navigation.tsx` for route structure

### Assignment Generation Logic

Located in `src/lib/groupAssignments/`. Key pattern:

1. **Generate functions**: Return a function that takes `InProgressAssignmment[]` and returns new assignments
2. **Chaining**: Generators compose - each reads existing assignments and adds more
3. **Example**: `generateCompetingGroupActitivitesForEveryone()` assigns competitors to groups, balancing by group size

### WCA API Integration

- **Auth**: OAuth via `AuthProvider` in `src/providers/AuthProvider.tsx` - stores token in localStorage
- **API calls**: Use functions in `src/lib/wcaAPI.js` (e.g., `getWcif()`, `patchWcif()`, `searchPersons()`)
- **Staging mode**: Query param `?staging=true` forces staging API even in production

## Project Structure

```
src/
├── lib/                    # Pure business logic (no React)
│   ├── activities.ts       # Activity code parsing, finding rounds/groups
│   ├── assignments.ts      # Assignment helpers (isCompetitorAssignment, etc.)
│   ├── persons.ts          # Person filtering (personsShouldBeInRound, byPROrResult)
│   ├── groups.ts           # Group creation logic
│   ├── utils.ts            # Immutable updates (updateIn, mapIn, setIn)
│   ├── wcif-extensions.js  # Extension CRUD (buildExtension, getExtensionData)
│   ├── wcaAPI.js           # WCA API client
│   └── groupAssignments/   # Assignment generation algorithms
├── store/                  # Redux (actions, reducer, selectors, initialState)
├── pages/Competition/      # Feature-based page components
│   ├── Round/              # Round editing (groups, times)
│   ├── Assignments/        # Bulk assignment management
│   ├── Staff/              # Staff role assignment
│   └── Person/             # Individual person editor
├── components/             # Reusable UI components
├── providers/              # React context (Auth, Breadcrumbs, CommandPrompt)
└── config/                 # Static config (assignments.ts - assignment types/colors)
```

## Common Patterns

### Finding Activities

```typescript
// Get all group activities for a round
findGroupActivitiesByRound(wcif, '333-r1');

// Find specific activity by ID
findActivityById(wcif, activityId);

// Replace activity in schedule
findAndReplaceActivity(wcif, activityId, (activity) => updatedActivity);
```

### Working with Persons

```typescript
// Filter persons who should be in a round
personsShouldBeInRound(round)(wcif.persons);

// Sort by personal record or previous result
persons.sort(byPROrResult(event, roundNumber));
```

### Extensions (Groupifier compatibility)

Extensions store custom data. This app creates `delegateDashboard.groups` extensions, but also reads Groupifier's `groupifier.ActivityConfig`:

```javascript
getExtensionData('groups', roundActivity); // Returns { groups: 4, spreadGroupsAcrossAllStages: true }
setExtensionData('groups', roundActivity, { groups: 6 });
```

## Known Issues & Warnings

**Safe to ignore during build**:

- CSS syntax warnings (`Unexpected ";"`)
- Large chunk size warning (>500 KB)
- Peer dependency warnings during install
- Browserslist outdated warning

**Common pitfalls**:

- Don't use `npm install` without `--legacy-peer-deps`
- Build outputs to `dist/`, not `build/` (Vite, not CRA)
- Activity IDs are numbers, activityCodes are strings (e.g., `333-r1`)
- Multiple activities can share same activityCode but have different IDs (multi-room rounds)

## Integration Points

- **WCA API**: OAuth, WCIF CRUD, person/user search
- **Groupifier**: Reads `groupifier.ActivityConfig` extensions for backward compatibility
- **Netlify**: SPA redirects in `netlify.toml`, env vars in Netlify dashboard
- **Google Analytics**: Tracked via `usePageTracking` hook in Navigation
