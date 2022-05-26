import { ExportToCsv } from 'export-to-csv';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button, Grid, Typography } from '@mui/material';
import { groupActivitiesByRound, parseActivityCode } from '../../lib/activities';
import { acceptedRegistrations } from '../../lib/persons';
import { flatten } from '../../lib/utils';

const csvOptions = {
  fieldSeparator: ',',
  quoteStrings: '"',
  showLabels: true,
};

const groupNumber = ({ activityCode }) => parseActivityCode(activityCode)?.groupNumber;

const staffingAssignmentToText = ({ assignmentCode, activity }) =>
  `${assignmentCode.split('-')[1][0]}${groupNumber(activity)}`;

const competingAssignmentToText = ({ assignmentCode, activity }) =>
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

      obj[event.id] = competingAssignment ? competingAssignmentToText(competingAssignment) : '-';
      obj[event.id + '_staff'] = staffingAssignments.map(staffingAssignmentToText).join(',') || '-';
    });
    return obj;
  };

  const onExportNametagsData = () => {
    const data = acceptedRegistrations(wcif.persons)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((person) => ({
        name: person.name,
        wcaId: person.wcaId,
        role: person.roles.filter((role) => role.indexOf('staff') === -1),
        ...assignmentsToObj(person),
      }));

    const csvExporter = new ExportToCsv({
      ...csvOptions,
      filename: `${wcif.id}_nametags.csv`,
      headers: ['name', 'wcaId', 'role', flatten(wcif.events.map((e) => [e.id, e.id + '_staff']))],
    });

    csvExporter.generateCsv(data);
  };
  const onExportScorecardData = () => {};

  return (
    <Grid container direction="column">
      <Grid item>
        <Typography>Export data for scorecards and nametags</Typography>
      </Grid>
      <Grid item>
        <Button onClick={onExportNametagsData}>Export nametags data</Button>
        <Button onClick={onExportScorecardData}>Export scorecard data</Button>
      </Grid>
    </Grid>
  );
};

export default ExportPage;
