# Delegate Dashboard - Copilot Instructions

## Repository Summary

Delegate Dashboard is a web application for managing WCA (World Cube Association) competition logistics. It enables delegates and organizers to edit competitions, set staff roles, create and edit groups, and manage competitor assignments through an intuitive interface. The app is deployed on Netlify and integrates with the WCA API.

### Context

WCA Competitions happen across one or more days. Across these days, various "events" are held such as 3x3, 4x4, 3x3 blindfolded, and so on.... A competition will hold 1 or more of these WCA events and the events will happen as a series of rounds. People will register for a competition and register for certain events such as 3x3 and 4x4, and they then can compete in those events. Everyone gets placed in round 1, but after each round, a subset of people will progress to the next round.

All of the data for these competitions is stored in a "WCIF". That is the schedule, configuration of events, people and their registrations and assignments, are all stored in the wcif. We use the `@wca/helpers` npm package to manage this data format in a type safe way. A schedule will be split into multiple venues, each venue will have rooms, and each room will have multiple schedule activities (in this case, the top level schedule activities are typically rounds and other activities such as lunch). Round activities have `childActivities` which represent each group. A schedule will have multiple round activities for each room a round happens in, so 3x3 round 1 may exist at the same schedule start and end times in both "blue stage" and "red stage" rooms. They will have the same activityCode but different IDs.

This app allows to configure the `schedule` and `person` fields in the wcif. For persons, we edit their assignments and for the schedule, we'll split a round into multiple groups and people will be assigned different jobs in those groups.

## Project Information

- **Type**: Single-page web application (React SPA)
- **Size**: ~110 source files (All typescript)
- **Languages**: TypeScript, JavaScript (JSX/TSX), HTML, CSS
- **Frameworks**: React 17, Redux, Material-UI v5, Vite
- **Build Tool**: Vite 4.4.9 (migrated from Create React App)
- **Target Runtime**: Modern browsers (ES2021+)
- **Package Manager**: Yarn (preferred) or npm with `--legacy-peer-deps`
- **Node Version**: LTS (specified in `.nvmrc` as `lts/*`)

## Build & Validation Commands

### Critical: Package Installation

**ALWAYS use Yarn for installation and building.** The project has a `yarn.lock` file and npm will fail without `--legacy-peer-deps` due to peer dependency conflicts with Material-UI v4 packages.

```bash
# Correct - use Yarn (preferred)
yarn install

# Alternative - use npm with flag (NOT recommended)
npm install --legacy-peer-deps
```

**Time**: ~15-60 seconds for `yarn install`

### Build Commands

```bash
# Development server - runs on http://localhost:5173 (Vite default port)
yarn start
# or: npm start (if using npm)
# Note: README mentions port 3000 (old CRA), but Vite uses 5173

# Production build - outputs to dist/ directory
yarn build
# Time: ~20-30 seconds
# Note: Runs TypeScript compiler (tsc) first, then Vite build
# Warnings about CSS syntax errors and large chunk sizes are expected

# Lint code
yarn lint
# or: npm run lint
# Uses ESLint with React/JSX rules
# Time: ~2-5 seconds

# Test (runs lint only - no unit tests configured)
yarn test
# or: npm test
# Note: CI=true npm test is used in pre-commit hook
```

### Expected Build Warnings (Safe to Ignore)

1. **CSS syntax warnings**: `Unexpected ";" [css-syntax-error]` - These are benign and don't affect functionality
2. **Large chunk warning**: Bundle size exceeds 500 KB - This is known and acceptable for this application
3. **Browserslist outdated warning**: `caniuse-lite is outdated` - Does not block builds
4. **Peer dependency warnings**: Multiple warnings during `yarn install` about unmet peer dependencies - These are acceptable

### Pre-commit Hook

The repository uses Husky to run tests before commits:

- Located at: `.husky/pre-commit`
- Runs: `CI=true npm test` (which runs `npm run lint`)
- This will block commits if linting fails

## Project Architecture

### Directory Structure

```
/
├── .github/              # GitHub configuration (FUNDING.yml only, no workflows)
├── .husky/              # Git hooks (pre-commit runs tests)
├── dist/                # Production build output (gitignored)
├── public/              # Static assets (favicon, manifest, robots.txt)
│   └── wcif-extensions/ # WCIF extension specifications
├── src/
│   ├── App/            # Main app component and navigation
│   ├── assets/         # Images, CSS, SVG assets
│   ├── components/     # Reusable UI components
│   ├── config/         # Configuration files (assignments.ts)
│   ├── hooks/          # Custom React hooks (useDebounce, usePageTracking)
│   ├── lib/            # Business logic and utilities
│   │   └── groupAssignments/  # Group assignment generation logic
│   ├── pages/          # Page components (Home, Competition)
│   │   ├── Competition/  # Competition management pages
│   │   │   ├── Assignments/
│   │   │   ├── Checks/
│   │   │   ├── DangerEdit/
│   │   │   ├── Export/
│   │   │   ├── Import/
│   │   │   ├── Person/
│   │   │   ├── Rooms/
│   │   │   ├── Round/
│   │   │   ├── Staff/
│   │   │   └── ScramblerSchedule/
│   │   └── Home/       # Home page and header
│   ├── providers/      # React context providers (Auth, Breadcrumbs, CommandPrompt)
│   ├── store/          # Redux store, actions, reducers, selectors
│   ├── index.tsx       # Application entry point
│   └── theme.ts        # Material-UI theme configuration
├── index.html          # HTML template (Vite entry point)
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── .eslintrc.json      # ESLint configuration
├── package.json        # Dependencies and scripts
└── yarn.lock           # Yarn lock file (DO NOT delete)
```

### Key Files

- **Entry Point**: `src/index.tsx` - Sets up Redux store, React Router, and Material-UI theme
- **Main App**: `src/App/index.tsx` - Fetches competitions and renders Navigation
- **Navigation**: `src/App/Navigation.tsx` - Defines app routes
- **Store**: `src/store/index.ts` - Redux store configuration with thunk middleware
- **API Layer**: `src/lib/wcaAPI.js` - WCA API integration
- **WCIF Extensions**: `src/lib/wcif-extensions.js` - WCIF (WCA Competition Interchange Format) utilities

### Configuration Files

- **Vite Config**: `vite.config.ts` - React plugin, TypeScript paths, SVGR, PWA
- **TypeScript**: `tsconfig.json` - ESNext target, strict null checks, JSX support
- **ESLint**: `.eslintrc.json` - React/JSX rules, Prettier integration
- **Prettier**: Configured inline in `package.json`
- **Environment**: `.env` - Sets `VITE_WCA_ORIGIN` to staging WCA server
- **Netlify**: `netlify.toml` - SPA redirect config, production env vars
- **Editor**: `.editorconfig` - LF line endings, 100 char line length

## Validation Steps

### No GitHub Actions or CI Workflows

This repository **does not have GitHub Actions workflows**. The only automated check is the local pre-commit hook that runs linting.

### Manual Validation Checklist

Before committing changes, always:

1. **Install dependencies**: `yarn install` (if package.json changed)
2. **Run linter**: `yarn lint` - Must pass with no errors
3. **Build the app**: `yarn build` - Should complete successfully
4. **Test locally** (if possible): `yarn start` and manually verify changes in browser

### Making Changes

1. **For TypeScript/JavaScript files**: Ensure no ESLint errors
2. **For React components**: Maintain existing patterns (functional components with hooks)
3. **For state management**: Use Redux actions/reducers in `src/store/`
4. **For API calls**: Use `src/lib/wcaAPI.js` utilities
5. **For styling**: Use Material-UI components and sx prop (avoid inline styles)

## Common Issues & Workarounds

### Issue 1: npm install fails with peer dependency errors

**Solution**: Use `yarn install` instead, or `npm install --legacy-peer-deps`

### Issue 2: TypeScript compiler (tsc) not found

**Cause**: Using npm without installing TypeScript properly
**Solution**: Use `yarn` instead, which properly installs all dependencies

### Issue 3: Build fails with "Cannot find module" errors

**Solution**:

1. Delete `node_modules/` and `yarn.lock`/`package-lock.json`
2. Run `yarn install` (fresh install)
3. Run `yarn build`

### Issue 4: Git commit blocked by pre-commit hook

**Cause**: ESLint found errors in code
**Solution**: Run `yarn lint` to see errors, fix them, then commit again

## Dependencies & Integration Points

- **WCA API**: Integrates with World Cube Association API (staging or production based on env)
- **WCIF Format**: Uses WCA Competition Interchange Format for data exchange
- **Groupifier Compatibility**: Maintains compatibility with Groupifier extension format
- **Material-UI**: Heavy use of MUI components (both v4 and v5 packages present)
- **Redux**: State management for WCIF data, competitions, and assignments
- **React Router v6**: Client-side routing with history API

## Repository Root Files

```
.editorconfig         # Editor configuration (LF, 100 char limit)
.env                  # Environment variables (WCA staging URL)
.eslintignore         # ESLint ignore patterns
.eslintrc.json        # ESLint configuration
.gitignore            # Git ignore patterns (node_modules, dist, build)
.nvmrc                # Node version (lts/*)
index.html            # HTML template with Google Analytics
LICENSE               # Apache 2.0 license
netlify.toml          # Netlify deployment configuration
package.json          # Dependencies and build scripts
README.md             # Project documentation (CRA boilerplate)
tsconfig.json         # TypeScript compiler configuration
vite.config.ts        # Vite bundler configuration
yarn.lock             # Yarn dependency lock file
```

## Important Notes

- **DO NOT run `npm run eject`** - This is a legacy CRA command that doesn't apply to Vite builds
- **TypeScript is partially adopted** - Mix of .ts, .tsx, .js, and .jsx files
- **No unit tests** - The test script only runs linting
- **Build artifacts go to dist/** - Not build/ (Vite convention, not CRA)
- **Environment variables** - Use `VITE_` prefix for Vite to expose them
- **Service Worker/PWA** - Configured via vite-plugin-pwa

## Trust These Instructions

The information in this file has been validated by running actual commands against the repository. Only search for additional information if:

- You encounter an error not documented here
- You need to understand specific business logic in the code
- The instructions appear outdated (check git commit dates)

When making changes, favor minimal modifications and maintain consistency with existing code patterns. Always test your changes by running `yarn lint` and `yarn build` before committing.
