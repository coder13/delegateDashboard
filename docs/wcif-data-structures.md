# WCIF Data Structures

This document covers the WCIF data model and the extensions used by Delegate Dashboard for group configuration.

## Activities and Schedule

### Activities

A schedule is split into many activities. Each activity is either related to an event / round / group or is a misc activity (break, lunch, etc). For group generation we only use event-related activities.

Activities are grouped into rooms (stages). Each room has a list of activities scheduled in that room.

- Round activities are the top level activities in a schedule.
  - A round is represented by an activity with an activityCode like `333-r1`.
- Group activities are child activities of a round activity.
  - Groups are child activities on that round activity, with activityCodes like `333-r1-g1`.
  - Group activities live in `schedule.venues[].rooms[].activities[].childActivities`.

Key code references:

- Group helpers: `src/lib/wcif/groups.ts`
- Activity helpers: `src/lib/wcif/activities.ts`, `src/lib/domain/activities`

### Activity codes

- Group numbers are parsed from the activityCode using `parseActivityCode`.
- When group activities are created, the app uses activityCode helpers to keep codes consistent.

Key code references:

- Activity code helpers: `src/lib/domain/activities/activityCode.ts`

## Group Configuration Extensions

Group counts are stored in WCIF extensions and may come from multiple sources.

### Delegate Dashboard groups extension

- Extension ID: `delegateDashboard.groups`.
- Data shape includes:
  - `groups`: number or per-room map of group counts.
  - `spreadGroupsAcrossAllStages`: boolean.
- The extension provides defaults when missing.

Key code references:

- Extension functions: `src/lib/wcif/extensions/delegateDashboard/delegateDashboard.ts`
- Extension types: `src/lib/wcif/extensions/delegateDashboard/types.ts`

### Activity config extension

- Per-activity group count is stored on activities via `delegateDashboard.activityConfig`.
- This is used by the Rooms page to set estimated group counts per activity.

Key code references:

- Extension helpers: `src/lib/wcif/extensions/delegateDashboard/delegateDashboard.ts`
- Update path: `src/store/reducer.ts` (UPDATE_GROUP_COUNT)

### Groupifier compatibility

- The app can read `groupifier.ActivityConfig` for backward compatibility.
- `getGroupData` checks Delegate Dashboard extensions first, then Groupifier.

Key code references:

- Extension utilities: `src/lib/wcif/extensions/utils.ts`
- Groupifier extension: `src/lib/wcif/extensions/groupifier`
