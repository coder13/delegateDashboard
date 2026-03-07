import { findGroupActivitiesByRound, parseActivityCode } from '../../../lib/domain/activities';
import { eventNameById, roundFormatShortById } from '../../../lib/domain/events';
import { acceptedRegistrations } from '../../../lib/domain/persons';
import { type ActivityWithParent } from '../../../lib/domain/types';
import {
  getGroupifierActivityConfig,
  getRoomExtensionData,
  getGroupExtensionData,
} from '../../../lib/wcif/extensions';
import { useAppSelector } from '../../../store';
import { Button, Typography } from '@mui/material';
import {
  type Activity,
  type Assignment,
  type Event,
  type Person,
  type Room,
  type Round,
  formatCentiseconds,
} from '@wca/helpers';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import { flatten } from 'lodash';
import { useCallback } from 'react';
import Grid from '@mui/material/GridLegacy';

type AdvancementConditionLike = {
  type: 'ranking' | 'percent' | 'attemptResult';
  level: number;
};

type AssignmentWithActivity = Assignment & { activity: ActivityWithParent };

const advancementConditionToText = ({ type, level }: AdvancementConditionLike): string => {
  switch (type) {
    case 'ranking':
      return `Top ${level}`;
    case 'percent':
      return `Top ${level}%`;
    case 'attemptResult':
      if (level === -2) {
        return '> DNS';
      } else if (level === -1) {
        return '> DNF';
      } else {
        return `< ${formatCentiseconds(level)}`;
      }
    default:
      return '';
  }
};

const csvOptions = {
  fieldSeparator: ',',
  quoteStrings: true,
  quoteCharacter: '"',
  showColumnHeaders: true,
};

const buildCsvConfig = (filename: string, headers: string[]) =>
  mkConfig({
    ...csvOptions,
    filename,
    columnHeaders: headers,
  });

const groupNumber = ({ activityCode }: Pick<Activity, 'activityCode'>) =>
  parseActivityCode(activityCode)?.groupNumber;

const staffingAssignmentToText = ({ assignmentCode, activity }: AssignmentWithActivity) =>
  `${assignmentCode.split('-')[1][0].toUpperCase()}${groupNumber(activity)}`;

const competingAssignmentToText = (activity: ActivityWithParent) =>
  `${activity.parent.room.name[0]}${groupNumber(activity)}`;

const getStageName = (room: Room, activity: ActivityWithParent) => {
  const stages = getRoomExtensionData(room)?.stages;
  const stageId = getGroupExtensionData(activity)?.stageId;

  if (stages?.length && stageId !== undefined) {
    const stageName = stages.find((s) => s.id === stageId)?.name;

    if (stageName) {
      return stageName;
    }
  }

  return room.name;
};

const ExportPage = () => {
  const wcif = useAppSelector((state) => state.wcif);
  const memodGroupActivitiesForRound = useCallback(
    (activityCode: string): ActivityWithParent[] =>
      wcif ? findGroupActivitiesByRound(wcif, activityCode) : [],
    [wcif]
  );

  if (!wcif) {
    return null;
  }

  const assignmentsToObj = (person: Person): Record<string, string | number> => {
    const obj: Record<string, string | number> = {};
    wcif.events.forEach((event: Event) => {
      // get first round activities
      const activitiesForEvent = memodGroupActivitiesForRound(`${event.id}-r1`);
      const assignmentsForEvent = (person.assignments ?? []).flatMap((assignment: Assignment) => {
        if (!activitiesForEvent.some((activity) => activity.id === assignment.activityId)) {
          return [];
        }

        const activity = activitiesForEvent.find((a) => assignment.activityId === a.id);

        if (!activity) {
          return [];
        }

        return [
          {
            ...assignment,
            activity,
          } as AssignmentWithActivity,
        ];
      });

      const competingAssignment = assignmentsForEvent.find(
        ({ assignmentCode }) => assignmentCode === 'competitor'
      );
      const staffingAssignments = assignmentsForEvent.filter(({ assignmentCode }) =>
        assignmentCode.includes('staff')
      );

      obj[event.id.toString()] = competingAssignment
        ? competingAssignmentToText(competingAssignment.activity)
        : '-';

      obj[event.id.toString() + '_station_number'] =
        competingAssignment && competingAssignment.stationNumber
          ? competingAssignment.stationNumber
          : '';

      obj[event.id.toString() + '_staff'] =
        staffingAssignments.map(staffingAssignmentToText).join(',') || '-';
    });
    return obj;
  };

  const onExportNametagsData = () => {
    const assignmentHeaders = flatten(
      wcif.events.map((e) => [e.id, e.id + '_station_number', e.id + '_staff'])
    ) as string[];
    const headers = ['registrantId', 'name', 'wcaId', 'role', 'country_iso', ...assignmentHeaders];

    const data = acceptedRegistrations(wcif.persons)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((person) => {
        const assignments = assignmentsToObj(person);
        const row: Record<string, string | number> = {
          registrantId: person.registrantId,
          name: person.name,
          wcaId: person.wcaId ?? '',
          role: (person.roles ?? []).filter((role) => role.indexOf('staff') === -1).join(','),
          country_iso: person.countryIso2,
        };

        assignmentHeaders.forEach((assignmentKey) => {
          row[assignmentKey] = assignments[assignmentKey] ?? '';
        });

        return row;
      });

    const csvConfig = buildCsvConfig(`${wcif.id}_nametags`, headers);
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  const onExportNametagsForPublisherData = () => {
    const assignmentHeaders = flatten(wcif.events.map((e) => [e.id, e.id + '_staff'])) as string[];
    const headers_template: string[] = [
      'name',
      'wcaId',
      'role',
      'country_iso',
      ...flatten(wcif.events.map((e) => [e.id, e.id + '_staff'])),
    ];

    const headers: string[] = [];
    for (let i = 0; i < 6; i++) {
      headers.push(...headers_template.map((col) => `${col}-${i}`));
    }

    const data: Array<Record<string, string | number>> = [];
    let buffer: Array<string | number> = [];
    let i = 0;

    acceptedRegistrations(wcif.persons)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((person) => {
        const assignmentData: Array<string | number> = [
          person.name,
          person.wcaId ?? '',
          (person.roles ?? []).filter((role) => role.indexOf('staff') === -1).join(','),
          person.countryIso2,
        ];
        const assignments = assignmentsToObj(person);
        assignmentHeaders.forEach((assignmentKey) => {
          assignmentData.push(assignments[assignmentKey] ?? '');
        });

        buffer.push(...assignmentData);

        i++;

        if (i === 6) {
          const row: Record<string, string | number> = {};
          headers.forEach((header, index) => {
            row[header] = buffer[index] ?? '';
          });
          data.push(row);
          buffer = [];
          i = 0;
        }
      });

    if (buffer.length > 0) {
      while (buffer.length < 6 * headers_template.length) {
        buffer.push('');
      }

      const row: Record<string, string | number> = {};
      headers.forEach((header, index) => {
        row[header] = buffer[index] ?? '';
      });
      data.push(row);
    }

    const csvConfig = buildCsvConfig(`${wcif.id}_nametags`, headers);
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  const onExportScorecardData = () => {
    const scorecards: Array<Record<string, string | number>> = [];

    // For each event
    wcif.events.forEach((event: Event) => {
      // for each round
      event.rounds.forEach((round: Round) => {
        // get round information
        const roundData = {
          dnf_time: round.timeLimit
            ? `DNF if > ${formatCentiseconds(round.timeLimit.centiseconds)}`
            : '',
          cutoff_time: round.cutoff
            ? `1 or 2 < ${formatCentiseconds(round.cutoff.attemptResult)}`
            : '',
          round_format: roundFormatShortById(round.format),
          advancement_condition: round.advancementCondition
            ? advancementConditionToText(round.advancementCondition)
            : '',
          round_number: parseActivityCode(round.id)?.roundNumber ?? '',
        };

        const groupAssignmentsByEventAndRound = memodGroupActivitiesForRound(round.id).sort(
          (a, b) => (groupNumber(a) ?? 0) - (groupNumber(b) ?? 0)
        );

        // Add scorecards group by group
        groupAssignmentsByEventAndRound.forEach((groupActivity) => {
          const people = acceptedRegistrations(wcif.persons).filter((person) =>
            (person.assignments ?? []).some(
              (a) => a.activityId === groupActivity.id && a.assignmentCode === 'competitor'
            )
          );

          const featuredCompetitors =
            getGroupifierActivityConfig(groupActivity)?.featuredCompetitorWcaUserIds || [];

          const stageName = getStageName(groupActivity.parent.room, groupActivity);

          people.forEach((person) => {
            scorecards.push({
              id: person.registrantId,
              wca_id: person.wcaId ?? '',
              competition_name: wcif.name,
              event_name: eventNameById(event.id),
              round_number: parseActivityCode(round.id)?.roundNumber ?? '',
              group_name: competingAssignmentToText(groupActivity),
              stage: stageName,
              group_number: parseActivityCode(groupActivity.activityCode).groupNumber ?? '',
              full_name: person.name,
              dnf_time: roundData.dnf_time,
              cutoff_time: roundData.cutoff_time,
              round_format: roundData.round_format,
              advancement_condition: roundData.advancement_condition,
              today_date: new Date(groupActivity.startTime).toLocaleDateString(),
              time: new Date(groupActivity.startTime).toLocaleTimeString(),
              stream:
                person.wcaUserId && featuredCompetitors.includes(person.wcaUserId)
                  ? 'True'
                  : 'False',
            });
          });
        });
      });
    });

    const headers = [
      'id',
      'wca_id',
      'competition_name',
      'event_name',
      'round_number',
      'group_name',
      'stage',
      'group_number',
      'full_name',
      'dnf_time',
      'cutoff_time',
      'round_format',
      'advancement_condition',
      'today_date',
      'time',
      'stream',
    ];

    const csvConfig = buildCsvConfig(`${wcif.id}_scorecards`, headers);
    const csv = generateCsv(csvConfig)(scorecards);
    download(csvConfig)(csv);
  };

  const onExportRegistrations = () => {
    const registrations = acceptedRegistrations(wcif.persons).map((person) => ({
      id: person.registrantId,
      name: person.name,
      email: person.email,
      wca_id: person.wcaId ?? '',
      country_id: person.countryIso2,
    }));

    const headers = ['id', 'name', 'email', 'wca_id', 'country_id'];
    const csvConfig = buildCsvConfig(`${wcif.id}_registrations`, headers);
    const csv = generateCsv(csvConfig)(registrations);
    download(csvConfig)(csv);
  };

  return (
    <Grid container direction="column">
      <Grid item sx={{ padding: '1em' }}>
        <Typography>Export data for scorecards and nametags</Typography>
      </Grid>
      <Grid item sx={{ padding: '0 0.5em' }}>
        <Button sx={{ margin: '0 0.25em' }} onClick={onExportNametagsData} variant="outlined">
          Generate Nametags CSV
        </Button>
        <Button sx={{ margin: '0 0.25em' }} onClick={onExportScorecardData} variant="outlined">
          Generate Scorecard CSV
        </Button>
        <Button sx={{ margin: '0 0.25em' }} onClick={onExportRegistrations} variant="outlined">
          Generate Registration CSV
        </Button>
        <Button
          sx={{ margin: '0 0.25em' }}
          onClick={onExportNametagsForPublisherData}
          variant="outlined">
          Generate Nametags for publisher CSV
        </Button>
      </Grid>
    </Grid>
  );
};

export default ExportPage;
