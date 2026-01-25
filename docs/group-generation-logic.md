# Group Generation Logic

This document explains how Delegate Dashboard creates group activities and assigns people to those groups. It covers the UI flows, generator order, time distribution rules, and edge cases.

## Creating Group Activities

There are multiple entry points for generating group activities. The core mechanics are shared: create child activities with unique IDs, consistent activityCodes, and times distributed evenly over the parent round activity.

### Configure Group Counts (Round page)

The Configure Group Counts dialog sets the round extension and creates groups for every round activity (stage) matching the activityCode.

Flow:

1. Reads `delegateDashboard.groups` from the round.
2. User chooses group count and whether to spread across stages.
3. Saves the round extension with `updateRoundExtensionData`.
4. Calls `createGroupsAcrossStages` to build child activities for each matching round activity.
5. Persists new activities via `updateRoundActivities`.

How time is split:

- For each round activity, total duration is split evenly across group count.
- Group 1 starts at round start; subsequent groups start at start + (duration / groupCount) \* index.

Key code references:

- Dialog: `src/pages/Competition/Round/ConfigureGroupCountsDialog.tsx`
- Group creation: `src/lib/wcif/groups.ts` (createGroupsAcrossStages)

#### Spread groups across stages

- `spreadGroupsAcrossAllStages = true` means every stage gets the same group count.
- The group count is a single number.

#### Per-room group counts

- `spreadGroupsAcrossAllStages = false` means group count can vary by room.
- The `groups` value becomes a map of room ID to group count.
- The dialog warns this flow is experimental and suggests manual grouping.

### Rooms page group creation

The Rooms page provides per-room round activity controls that use per-activity group counts.

Flow:

1. The table row exposes an input for groups (stored in `delegateDashboard.activityConfig`).
2. Clicking Create generates child activities with sequential IDs and group numbers.
3. New groups inherit round start/end time and are not time-split in this flow.

Key code references:

- Rooms UI: `src/pages/Competition/Rooms/Room.jsx`
- Group count storage: `src/store/reducer.ts` (UPDATE_GROUP_COUNT)

### Import flow: generate missing group activities

CSV import can reference group activities that do not exist yet. The import flow detects missing groups and creates them.

Flow:

1. Parse CSV into assignments.
2. Determine missing group activities by activityCode and roomId.
3. Create missing groups and append to the round activity.
4. Rebalance start/end times for all groups in the affected rounds.

Key code references:

- Import logic: `src/lib/importExport/import.ts`
- Missing group detection: `determineMissingGroupActivities`
- Creation and time rebalance: `generateMissingGroupActivities`, `balanceStartAndEndTimes`

### Configure Groups dialog (manual edits)

This dialog lets you add, edit, or delete individual groups for a round activity.

Behavior:

- Add group:
  - Computes next group number based on highest existing group number.
  - Adds a new group activity.
  - Re-splits start/end times across all groups.
- Edit group:
  - Adjusts duration and time frame.
  - Updates the next group start time to avoid overlap.
- Delete group:
  - Removes the group and re-splits timing across remaining groups.

Key code references:

- Dialog: `src/pages/Competition/Round/ConfigureGroupsDialog.tsx`

## Assignment Generation Pipeline

Assignments for a round are generated in a fixed order. Each generator receives existing assignments and returns new ones. The reducer concatenates results in sequence.

Order of generators:

1. Competing assignments for staff.
2. Competing assignments for delegates and organizers.
3. Competing assignments for everyone else.
4. Judge assignments based on competing assignments.

Key code references:

- Generator pipeline: `src/store/reducers/generateAssignments.ts`

### 1. Competing assignments for staff

Purpose: Ensure staff members with staff assignments get a competitor group that does not conflict.

Logic:

- Filter to persons who are in the round, have staff assignments, and lack competitor assignments.
- For each person, pick the previous group relative to their earliest staff group.
- If the previous group is already a staff group, walk backward until a valid group is found.

Key code references:

- Generator: `src/lib/assignmentGenerators/generateCompetingAssignmentsForStaff.ts`
- Helper: `previousGroupForActivity` in `src/lib/wcif/groups.ts`

### 2. Competing assignments for delegates and organizers

Purpose: Place key staff in later groups to leave earlier groups less constrained.

Logic:

- Filter to delegates/organizers missing competitor assignments.
- Collect unique group numbers and sort descending.
- Assign delegates/organizers to latest groups first.

Key code references:

- Generator: `src/lib/assignmentGenerators/generateGroupAssignmentsForDelegatesAndOrganizers.ts`

### 3. Competing assignments for everyone else

Purpose: Fill remaining competitors into groups with balanced sizes.

Logic:

- Filter to persons in the round missing competitor assignments.
- Sort by seed (PR/result) and name for deterministic ordering.
- Choose the group with the smallest size, breaking ties by activity ID.
- Create a competitor assignment for each person.

Key code references:

- Generator: `src/lib/assignmentGenerators/generateCompetingGroupActitivitesForEveryone.ts`

### 4. Judge assignments from competing assignments

Purpose: Automatically assign judges to a different group.

Logic:

- Only runs when multiple groups exist.
- Filter to competitors without staff assignments and not organizers/delegates.
- Assign each person to judge the next group relative to their competitor group.

Key code references:

- Generator: `src/lib/assignmentGenerators/generateJudgeAssignmentsFromCompetingAssignments.ts`
- Helper: `nextGroupForActivity` in `src/lib/wcif/groups.ts`

## Time Distribution Rules

Group creation splits round times in some flows, and leaves times unchanged in others.

- Configure Group Counts and Import flows: split evenly across all groups within the round activity time window.
- Rooms page Create action: groups inherit parent round start/end time without splitting.
- Manual edits (Configure Groups dialog): recalculates times to keep groups sequential and non-overlapping.

Key code references:

- Time split: `createGroupsAcrossStages` in `src/lib/wcif/groups.ts`
- Manual edit recalculation: `src/pages/Competition/Round/ConfigureGroupsDialog.tsx`
- Import rebalance: `balanceStartAndEndTimes` in `src/lib/importExport/import.ts`

## Multi-stage Handling

When the same round activityCode exists in multiple rooms (stages), group creation can behave in two modes:

- Spread across stages: each stage gets the same number of groups.
- Per-room counts: each stage can have its own group count.

Group IDs are allocated sequentially across all affected stages to avoid collisions.

Key code references:

- Multi-stage splitting: `createGroupsAcrossStages` in `src/lib/wcif/groups.ts`
- Round data: `src/containers/Round/hooks/useRoundData.ts`

## Guardrails and Edge Cases

- Single-group rounds: judge assignments are not generated.
- Missing room for activity: group creation throws, so the UI should not allow creation when room lookup fails.
- Missing group counts: group creation is blocked until counts are provided.
- CSV import with ambiguous stage data: competitor assignments without stage are rejected when multiple stages exist.

Key code references:

- Generator edge cases: `src/lib/assignmentGenerators/*`
- Import validation: `src/lib/importExport/import.ts`

## Testing References

Existing tests capture expected behavior for group creation and assignment generation:

- Group helpers: `src/lib/wcif/groups.test.ts`
- Competing assignments: `src/lib/assignmentGenerators/generateCompetingGroupActitivitesForEveryone.test.ts`
- Delegates/organizers: `src/lib/assignmentGenerators/generateGroupAssignmentsForDelegatesAndOrganizers.test.ts`
- Staff competing assignments: `src/lib/assignmentGenerators/generateCompetingAssignmentsForStaff.test.ts`
- Judge assignments: `src/lib/assignmentGenerators/generateJudgeAssignmentsFromCompetingAssignments.test.ts`
