# Delegate Dashboard - Product Spec

See `agents.md` for file structure, commands, and engineering guidelines.

## Overview

Delegate Dashboard is a web application for managing WCA (World Cube Association) competition logistics. It enables delegates and organizers to edit competitions, set staff roles, create and edit groups, and manage competitor assignments through an intuitive interface. The app is deployed on Netlify and integrates with the WCA API.

## Core Features

- Competition editing: Manage event rounds, schedules, and activity groups for a competition.
- Staff roles: Assign delegate and organizer roles, and manage staff responsibilities.
- Group management: Create, edit, and balance groups for rounds and stages.
- Assignments: Link people to activities with roles (competitor, judge, scrambler, etc.).
- Person editing: Manage registrations and per-person assignments across rounds.

## Navigation and Layout

- Competition layout fetches the WCIF on load and displays global errors in the header area.
- A persistent drawer and breadcrumbs anchor navigation; breadcrumbs are scoped to the active page.
- Unsaved changes trigger a save reminder banner with a one-click save action.
- `Ctrl+S` triggers save of WCIF changes.

## Competition Home

- Home shows a competition summary card and a round selector.
- Selecting a round navigates to the round management page.

## Round Management

- Round statistics summarize stage times, round size, competitor counts, and group counts.
- Participants in the round are derived from WCA Live results where available.
- Assignment actions include:
  - Configure assignments per group.
  - Auto-generate competitor and judging assignments.
  - Configure station numbers once assignments exist.
  - Configure group counts and group definitions.
  - Reset group activities (full reset) or reset competitor and judging assignments.
- Raw WCIF round data and raw round activities data can be opened for advanced edits.
- Time limit and cutoff blocks show how many competitors may make the limit or cutoff.
- When no results exist for a later round, the UI warns that assignments cannot be generated.

## Rooms and Group Creation

- Rooms page lists venues and rooms, and allows per-round group creation.
- For each round activity, operators can:
  - Set estimated group count.
  - Create child group activities based on the group count.
  - See estimated competitor counts using registration data and advancement conditions.
- A room-level action allows resetting all groups for that room (clears child activities and group extensions).

## Staff Management

- Staff page lists all persons, with filters applied to hide deleted or pending registrations.
- Delegates and organizers are read-only; staff roles are toggled for accepted registrations.
- Non-competing staff can be added via a dedicated dialog.
- Footer totals summarize staff counts, first-timers, delegates, and organizers.

## Person Detail

- Person page shows key person details and a timeline table of assignments.
- Assignments are sorted by activity start time for a chronological view.

## Assignments Troubleshooting

- Assignments page lists all assignments grouped by stage and group activity.
- Filters allow narrowing by stage and event.
- Reset all assignments is available for global cleanup.
- Unknown assignments (no activity match) are surfaced separately.

## Import and Export

- Import supports CSV uploads for Round 1 competitor and staff assignments.
- CSV must include one row per person, keyed by email, with event columns and optional staff columns.
- Later rounds are out of scope for this import flow and must not be imported with this feature.
- CSV data is validated before import; validation errors block assignment generation.
- Import flow:
  1. Upload CSV.
  2. Validate contents.
  3. Generate competitor assignments.
  4. Generate missing group activities if needed.
  5. Import assignments into WCIF.
- Export outputs:
  - Nametags CSV with group, station, and staff fields.
  - Scorecards CSV with event/round metadata and schedule details.
  - Registrations CSV for accepted competitors.
  - Nametags for publisher format (six-up layout).

## Scrambler Schedule

- Scrambler schedule groups scrambler assignments by room and day.
- Activities are sorted chronologically and grouped by date.
- Scrambler lists link directly to person detail pages.

## First-Timer Checks

- First-timer check page scans accepted registrations without a WCA ID.
- It queries the WCA API for exact-name matches and stores results in local storage.
- Matches are shown per registrant to verify first-timer status.

## WCIF Query Tool

- Query page provides a JSONPath explorer over the WCIF state.
- Queries are debounced and results render as a tree view.
- Useful for ad hoc inspection and troubleshooting.

## Groupifier Printing Integration

- Groupifier printing page updates the WCIF extension for scorecard paper size.
- Links out to Groupifier for the actual printing flow.

## Danger Edit

- Danger edit provides direct JSON editing for persons, events, and schedule.
- Changes are debounced and written into the WCIF store.
- Intended for advanced troubleshooting only.

## Domain Model (WCIF)

All competition data lives in a WCIF (WCA Competition Interchange Format) object stored in Redux. The WCIF is the single source of truth for:

- schedule: Venues -> Rooms -> Activities (rounds, lunch, etc.)
- events: Events -> Rounds -> Results
- persons: Registrations, roles (delegate/organizer), and assignments

Key concepts:

- Activity Codes: Hierarchical identifiers like `333-r1-g2` (3x3 Round 1 Group 2). Parse with `parseActivityCode()` from `src/lib/activities.ts`
- Child Activities: Round activities contain `childActivities` representing groups. Same `activityCode` can exist in multiple rooms with different IDs
- Assignments: Link persons to activities with roles (`competitor`, `staff-judge`, `staff-scrambler`, etc.). See `src/config/assignments.ts`
- Extensions: Custom data attached to WCIF entities via `buildExtension()` / `getExtensionData()` in `src/lib/wcif-extensions.js`

Use `@wca/helpers` npm package for type-safe WCIF manipulation (types: `Competition`, `Activity`, `Person`, `Assignment`, `Event`).

## Assignment Generation Behavior

Assignment generation logic lives in `src/lib/groupAssignments/` and follows a consistent pattern:

1. Generate functions return a function that takes `InProgressAssignmment[]` and returns new assignments.
2. Generators compose; each reads existing assignments and adds more.
3. The default generator balances competitors across groups to keep group sizes even.

## Extensions and Compatibility

Extensions store custom data. This app creates `delegateDashboard.groups` extensions, but also reads Groupifier's `groupifier.ActivityConfig` for backward compatibility.

## WCA API Integration

- OAuth authentication lives in `AuthProvider` and stores the token in localStorage.
- WCIF CRUD uses `src/lib/wcaAPI.js` functions (e.g., `getWcif()`, `patchWcif()`, `searchPersons()`).
- Staging mode: the `?staging=true` query param forces staging API even in production.

## Analytics and Hosting

- Google Analytics is tracked via `usePageTracking` in navigation.
- Netlify handles SPA redirects via `netlify.toml` and environment variables via the Netlify dashboard.
