import { formatCentiseconds } from '@wca/helpers';
import { ExportToCsv } from 'export-to-csv';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button, Grid, Typography } from '@mui/material';
import { groupActivitiesByRound, parseActivityCode } from '../../lib/activities';
import { eventNameById, roundFormatById } from '../../lib/events';
import { acceptedRegistrations } from '../../lib/persons';
import { flatten } from '../../lib/utils';

const advancementConditionToText = ({ type, level }) => {
  switch (type) {
    case 'ranking':
      return `top ${level}`;
    case 'percent':
      return `top ${level}%`;
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

const groupNumber = ({ activityCode }) => parseActivityCode(activityCode)?.groupNumber;

const staffingAssignmentToText = ({ assignmentCode, activity }) =>
  `${assignmentCode.split('-')[1][0]}${groupNumber(activity)}`;

const competingAssignmentToText = (activity) =>
  `${activity.parent.room.name[0]}${groupNumber(activity)}`;

const ExportPage = () => {
  const wcif = useSelector((state) => state.wcif);

  const memodGroupActivitiesForRound = useCallback(
    (activityCode) => groupActivitiesByRound(wcif, activityCode),
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
      obj[event.id.toString() + '_staff'] =
        staffingAssignments.map(staffingAssignmentToText).join(',') || '-';
    });
    return obj;
  };

  const onExportNametagsData = () => {
    const assignmentHeaders = flatten(wcif.events.map((e) => [e.id, e.id + '_staff']));
    const headers = [
      'name',
      'wcaId',
      'role',
      'country_iso',
      ...flatten(wcif.events.map((e) => [e.id, e.id + '_staff'])),
    ];

    const data = [];
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

        data.push(assignmentData);
      });

    const csvExporter = new ExportToCsv({
      ...csvOptions,
      filename: `${wcif.id}_nametags`,
      headers: headers,
    });

    csvExporter.generateCsv(data);
  };

  const onExportScorecardData = () => {
    const scorecards = [];

    wcif.events.forEach((event) => {
      event.rounds.forEach((round) => {
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
        };

        const groupAssignmentsByEventAndRound = memodGroupActivitiesForRound(round.id).sort(
          (a, b) => groupNumber(a) - groupNumber(b)
        );

        groupAssignmentsByEventAndRound.forEach((groupActivity) => {
          const people = acceptedRegistrations(wcif.persons).filter((person) =>
            person.assignments.some((a) => a.activityId === groupActivity.id)
          );

          people.forEach((person) => {
            scorecards.push({
              id: person.registrantId,
              competition_name: wcif.id,
              event_name: eventNameById(event.id),
              group: competingAssignmentToText(groupActivity),
              stage: groupActivity.parent.room.name,
              group_number: parseActivityCode(groupActivity.activityCode).groupNumber,
              full_name: person.name,
              dnf_time: roundData.dnf_time,
              cutoff_time: roundData.cutoff_time,
              round_format: roundData.round_format,
              advancement_condition: roundData.advancement_condition,
              today_date: new Date(groupActivity.startTime).toLocaleDateString(),
              time: new Date(groupActivity.startTime).toLocaleTimeString(),
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
        'competition_name',
        'event_name',
        'group',
        'stage',
        'group_number',
        'full_name',
        'dnf_time',
        'cutoff_time',
        'round_format',
        'advancement_condition',
        'today_date',
        'time',
      ],
    });

    csvExporter.generateCsv(scorecards);
  };

  return (
    <Grid container direction="column">
      <Grid item sx={{ padding: '1em' }}>
        <Typography>Export data for scorecards and nametags</Typography>
      </Grid>
      <Grid item sx={{ padding: '0 0.5em' }}>
        <Button sx={{ margin: '0 0.25em' }} onClick={onExportNametagsData} variant="outlined">
          Generate nametags csv
        </Button>
        <Button sx={{ margin: '0 0.25em' }} onClick={onExportScorecardData} variant="outlined">
          Generate scorecard csv
        </Button>
      </Grid>
      <Grid>
        {/* <List>
          <ListSubheader>Downloads</ListSubheader>
          <ListItemButton
            style={{ width: '100%' }}
            component={CsvDownload}
            data={[{ data: 'foo' }]}>
            <ListItemText primary={`${wcif.id}_nametags.csv`} secondary="secondary" />
          </ListItemButton>
        </List> */}
      </Grid>
    </Grid>
  );
};

export default ExportPage;
