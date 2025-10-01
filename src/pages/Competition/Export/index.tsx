// @ts-nocheck
import { findGroupActivitiesByRound, parseActivityCode } from '../../../lib/activities';
import { eventNameById, roundFormatById } from '../../../lib/events';
import { acceptedRegistrations } from '../../../lib/persons';
import { flatten } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { Button, Grid, Typography } from '@mui/material';
import { formatCentiseconds } from '@wca/helpers';
import { ExportToCsv } from 'export-to-csv';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../store/initialState';

const advancementConditionToText = ({ type, level }: any) => {
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
      return null;
  }
};

const csvOptions = {
  fieldSeparator: ',',
  quoteStrings: '"',
  showLabels: true,
};

const groupNumber = ({ activityCode }: any) => parseActivityCode(activityCode)?.groupNumber;

const staffingAssignmentToText = ({ assignmentCode, activity }: any) =>
  `${assignmentCode.split('-')[1][0].toUpperCase()}${groupNumber(activity)}`;

const competingAssignmentToText = (activity) =>
  `${activity.parent.room.name[0]}${groupNumber(activity)}`;

const getStageName = (room, activity) => {
  const stages = getExtensionData('Room', room, 'org.cubingusa.natshelper.v1')?.stages;
  const stageId = getExtensionData('Group', activity, 'org.cubingusa.natshelper.v1')?.stageId;

  if (stages?.length && stageId !== undefined) {
    const stageName = stages.find((s) => s.id === stageId)?.name;

    if (stageName) {
      return stageName;
    }
  }

  return room.name;
};

const ExportPage = (props?: any) => {
  const wcif = useSelector((state: AppState) => state.wcif);

  const memodGroupActivitiesForRound = useCallback(
    (activityCode) => findGroupActivitiesByRound(wcif, activityCode),
    [wcif]
  );

  const assignmentsToObj = (person) => {
    const obj = {};
    wcif.events.forEach((event) => {
      // get first round activities
      const activitiesForEvent = memodGroupActivitiesForRound(`${event.id}-r1`);
      const assignmentsForEvent = person.assignments
        .filter((assignment) => activitiesForEvent.some((a) => a.id === assignment.activityId))
        .map((assignment) => ({
          ...assignment,
          activity: activitiesForEvent.find((activity) => assignment.activityId === activity.id),
        }));

      const competingAssignment = assignmentsForEvent.find(
        ({ assignmentCode }) => assignmentCode === 'competitor'
      );
      const staffingAssignments = assignmentsForEvent.filter(
        ({ assignmentCode }) => assignmentCode.indexOf('staff') > -1
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

  const onExportNametagsData = (props?: any) => {
    const assignmentHeaders = flatten(
      wcif.events.map((e) => [e.id, e.id + '_station_number', e.id + '_staff'])
    );
    const headers = ['registrantId', 'name', 'wcaId', 'role', 'country_iso', ...assignmentHeaders];

    const data = [];
    acceptedRegistrations(wcif.persons)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((person) => {
        const assignmentData = [
          person.registrantId,
          person.name,
          person.wcaId,
          person.roles.filter((role) => role.indexOf('staff') === -1).join(','),
          person.countryIso2,
        ];
        const assignments = assignmentsToObj(person);
        assignmentHeaders.forEach((assignmentKey) => {
          assignmentData.push(assignments[assignmentKey]);
        });

        data.push(assignmentData);
      });

    const csvExporter = new ExportToCsv({
      ...csvOptions,
      filename: `${wcif.id}_nametags`,
      headers: headers,
    });

    csvExporter.generateCsv(data);
  };

  const onExportNametagsForPublisherData = (props?: any) => {
    const assignmentHeaders = flatten(wcif.events.map((e) => [e.id, e.id + '_staff']));
    const headers_template = [
      'name',
      'wcaId',
      'role',
      'country_iso',
      ...flatten(wcif.events.map((e) => [e.id, e.id + '_staff'])),
    ];

    const headers = [];
    for (let i = 0; i < 6; i++) {
      headers.push(...headers_template.map((col) => `${col}-${i}`));
    }

    const data = [];
    let buffer = [];
    let i = 0;

    acceptedRegistrations(wcif.persons)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((person) => {
        const assignmentData = [
          person.name,
          person.wcaId,
          person.roles.filter((role) => role.indexOf('staff') === -1).join(','),
          person.countryIso2,
        ];
        const assignments = assignmentsToObj(person);
        assignmentHeaders.forEach((assignmentKey) => {
          assignmentData.push(assignments[assignmentKey]);
        });

        buffer.push(...assignmentData);

        i++;

        if (i === 6) {
          data.push(buffer);
          buffer = [];
          i = 0;
        }
      });

    if (buffer.length > 0) {
      while (buffer.length < 6 * headers_template.length) {
        buffer.push('');
      }

      data.push(buffer);
    }

    const csvExporter = new ExportToCsv({
      ...csvOptions,
      filename: `${wcif.id}_nametags`,
      headers: headers,
    });

    csvExporter.generateCsv(data);
  };

  const onExportScorecardData = (props?: any) => {
    const scorecards = [];

    // For each event
    wcif.events.forEach((event) => {
      // for each round
      event.rounds.forEach((round) => {
        // get round information
        const roundData = {
          dnf_time: round.timeLimit
            ? `DNF if > ${formatCentiseconds(round.timeLimit.centiseconds)}`
            : '',
          cutoff_time: round.cutoff
            ? `1 or 2 < ${formatCentiseconds(round.cutoff.attemptResult)}`
            : '',
          round_format: roundFormatById(round.format).short,
          advancement_condition: round.advancementCondition
            ? advancementConditionToText(round.advancementCondition)
            : '',
          round_number: parseActivityCode(round.id)?.roundNumber,
        };

        const groupAssignmentsByEventAndRound = memodGroupActivitiesForRound(round.id).sort(
          (a, b) => groupNumber(a) - groupNumber(b)
        );

        // Add scorecards group by group
        groupAssignmentsByEventAndRound.forEach((groupActivity) => {
          const people = acceptedRegistrations(wcif.persons).filter((person) =>
            person.assignments.some(
              (a) => a.activityId === groupActivity.id && a.assignmentCode === 'competitor'
            )
          );

          const featuredCompetitors =
            getExtensionData('ActivityConfig', groupActivity, 'groupifier')
              ?.featuredCompetitorWcaUserIds || [];

          const stageName = getStageName(groupActivity.parent.room, groupActivity);

          people.forEach((person) => {
            scorecards.push({
              id: person.registrantId,
              wca_id: person.wcaId,
              competition_name: wcif.name,
              event_name: eventNameById(event.id),
              round_number: parseActivityCode(round.id)?.roundNumber,
              group_name: competingAssignmentToText(groupActivity),
              stage: stageName,
              group_number: parseActivityCode(groupActivity.activityCode).groupNumber,
              full_name: person.name,
              dnf_time: roundData.dnf_time,
              cutoff_time: roundData.cutoff_time,
              round_format: roundData.round_format,
              advancement_condition: roundData.advancement_condition,
              today_date: new Date(groupActivity.startTime).toLocaleDateString(),
              time: new Date(groupActivity.startTime).toLocaleTimeString(),
              stream: featuredCompetitors.includes(person.wcaUserId) ? 'True' : 'False',
            });
          });
        });
      });
    });

    const csvExporter = new ExportToCsv({
      ...csvOptions,
      filename: `${wcif.id}_scorecards`,
      headers: [
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
      ],
    });

    csvExporter.generateCsv(scorecards);
  };

  const onExportRegistrations = (props?: any) => {
    const csvExporter = new ExportToCsv({
      ...csvOptions,
      filename: `${wcif.id}_registrations`,
      headers: ['id', 'name', 'email', 'wca_id', 'country_id'],
    });

    const registrations = acceptedRegistrations(wcif.persons).map((person) => ({
      id: person.registrantId,
      name: person.name,
      email: person.email,
      wca_id: person.wcaId,
      country_id: person.countryIso2,
    }));

    csvExporter.generateCsv(registrations);
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
