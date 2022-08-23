import { useDispatch, useSelector } from 'react-redux';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Divider, Grid, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import CSVPreview from './CSVPreview';
import { rooms, flatActivities, parseActivityCode, generateNextChildActivityId, createGroupActivity, activityByActivityCode } from '../../../lib/activities'
import { events } from '../../../lib/events';
import { partialUpdateWCIF } from '../../../store/actions';
import { groupBy } from '../../../lib/utils';
import { createGroupAssignment } from '../../../lib/groups';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';

const validate = (wcif) => (data) => {
  const checks = [];

  if (!data.meta.fields.indexOf('email') === -1) {
    checks.push({
      key: 'email',
      passed: false,
      message: 'Missing email column',
    });
  } else {
    checks.push({
      key: 'email',
      passed: true,
      message: 'Contains email column',
    });
  }

  if (data.data.some((row) => !row.email)) {
    checks.push({
      key: 'email-filled',
      passed: false,
      message: 'Missing email in some rows'
    });
  } else {
    checks.push({
      key: 'email-filled',
      passed: true,
      message: 'All rows have an email defined'
    });
  }

  const events = wcif.events.map((event) => event.id);
  const personsMissingEvents = data.data.map((row) => ({
    email: row.email,
    assignments: events
      .map((eventId) => {
        const data = row[eventId].trim();

        if (!data || data === '-') {
          return null;
        }

        return {
          eventId,
          data,
        };
      })
      .filter((data) => data !== null),
    raw: row,
  })).filter(({ email, assignments, raw }) => {
    const person = wcif.persons.find((person) => (person.email === email));
    if (!person) {
      checks.push({
        key: 'person-missing',
        passed: false,
        message: `Person with email ${email} is missing from the WCIF`,
      });
      return true;
    }

    if (person.registration.eventIds.some((eventId) => !assignments.some((assignment) => assignment.eventId === eventId))) {
      return true;
    }

    return false;
  });

  // Find situation where a person does not have a value for their event column
  // TODO: cross reference with person's registered events
  if (personsMissingEvents.length > 0) {
    checks.push({
      key: 'has-all-competing-event-column',
      passed: false,
      message: 'Missing competing assignments for some events',
      data: personsMissingEvents,
    });
  } else {
    checks.push({
      key: 'has-all-competing-event-column',
      passed: true,
      message: 'Defines competing assignments for all persons in all events',
    });
  }

  return checks;
}

const numberRegex = /^([1-9]\d*)$/i;
const staffAssignmentRegex = /^(?<assignment>[RSJ])(?<groupNumber>[1-9]\d*)$/i

const competitorAssignmentRegexWithoutStage = /^(?<groupNumber>[1-9]\d*)$/i;
const competitorAssignmentRegexWithStage = /^(?<stage>[A-Z])(?:\s*)(?<groupNumber>[1-9]\d*)$/i;

/**
 * Requires that the CSV row has a field that is exactly the eventId
 * @param {*} stages 
 * @param {*} row 
 * @param {*} person 
 * @param {*} eventId 
 * @returns 
 */
const findCompetingAssignment = (stages, row, person, eventId) => {
  const data = row[eventId].trim();

  if (!data || data === '-') {
    throw new Error('Competitor is given no assignment for event they are registered for')
  }

  const matchWithStage = data.match(competitorAssignmentRegexWithStage);
  if (matchWithStage) {
    return;
  }

  const matchWithoutStage = data.match(competitorAssignmentRegexWithoutStage);

  if (matchWithoutStage && stages.length > 2) {
    throw new Error('Stage data for competitor assignment is ambiguous');
  }

  if (matchWithoutStage && stages.length === 1) {
    const groupNumber = parseInt(matchWithoutStage.groups.groupNumber, 10);
    return {
      registrantId: person.registrantId,
      eventId: eventId,
      groupNumber,
      activityCode: `${eventId}-r1-g${groupNumber}`,
      assignmentCode: 'competitor',
      roomId: stages[0].id
    };
  }

  throw new Error(`Invalid competitor assignment data`, {
    data, person, eventId
  });
};

const StaffAssignmentMap = {
  R: 'staff-runner',
  S: 'staff-scrambler',
  J: 'staff-judge',
};

const findStaffingAssignments = (stages, row, person, eventId) => {
  const data = row[eventId + 'j'].trim();

  // No staff assignment
  if (!data || data === '-') {
    return [];
  }

  const baseAssignmentData = {
    registrantId: person.registrantId,
    eventId: eventId,

  }

  const assignments = data.trim().split(/[,;]/).map((assignment) => {
    // If there is only 1 stage, then we can infer stage data.
    if (stages.length === 1) {
      const plainNumberMatch = assignment.match(numberRegex);
      const staffAssignmentMatch = assignment.match(staffAssignmentRegex);

      if (plainNumberMatch) {
        const groupNumber = parseInt(assignment, 10);

        return {
          ...baseAssignmentData,
          activityCode: `${eventId}-r1-g${groupNumber}`,
          assignmentCode: 'staff-judge', // default staffing assignment
          roomId: stages[0].id
        };
      }

      if (staffAssignmentMatch) {
        const { assignment, groupNumber } = staffAssignmentMatch.groups;

        return {
          ...baseAssignmentData,
          activityCode: `${eventId}-r1-g${groupNumber}`,
          assignmentCode: StaffAssignmentMap[assignment],
          roomId: stages[0].id,
        };
      }
    }

    return null;
  });

  return assignments.filter(Boolean);
}

/**
 * Translates CSV contents to competitor assignments and also lists missing group activities
 * @param {*} wcif 
 * @param {*} data 
 * @param {*} cb 
 * @returns 
 */
const generateAssignments = (wcif, data) => {
  const assignments = [];
  const stages = rooms(wcif);

  data.data.forEach((row) => {
    const person = wcif.persons.find((person) => (person.email === row.email));

    person.registration.eventIds.forEach((eventId) => {
      try {
        const competingAssignment = findCompetingAssignment(stages, row, person, eventId);
        if (competingAssignment) {
          assignments.push(competingAssignment);
        }
      } catch (e) {
        console.error(e);
      }

      try {
        const staffingAssignments = findStaffingAssignments(stages, row, person, eventId);
        if (staffingAssignments && staffingAssignments.length) {
          assignments.push(...staffingAssignments);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });

  return assignments;
}

const determineMissingGroupActivities = (wcif, assignments) => {
  const missingActivities = [];
  const stages = rooms(wcif).map((room) => ({
    room,
    activities: flatActivities(room),
  }));

  assignments.forEach((assignment) => {
    if (missingActivities.find((activity) => activity.activityCode === assignment.activityCode)) {
      return;
    }

    // Both the WCIF and assignment data are in sync on how many stages there are
    if (stages.length === 1) {
      const activity = stages[0].activities.find((activity) => activity.activityCode === assignment.activityCode);
      if (!activity) {
        missingActivities.push({
          activityCode: assignment.activityCode,
          roomId: assignment.roomId,
        });
      }
    } else if (stages.length > 1 && assignment.stage) {

    } else {
      throw new Error('Mismatch between number of stages in WCIF and assignment data');
    }
  });

  return missingActivities.sort((a, b) => {
    const aParsedActivityCode = parseActivityCode(a.activityCode);
    const bParsedActivityCode = parseActivityCode(b.activityCode);

    if (aParsedActivityCode.eventId === bParsedActivityCode.eventId) {
      return aParsedActivityCode.groupNumber - bParsedActivityCode.groupNumber;
    } else {
      return events.findIndex((e) => e.id === aParsedActivityCode.eventId) - events.findIndex((e) => e.id === bParsedActivityCode.eventId);
    }
  });
}

const generateMissingGroupActivities = (wcif, missingActivities) => {
  const schedule = wcif.schedule;
  const missingActivitiesByRoundId = groupBy(missingActivities, (activity) => {
    const eventRound = activity.activityCode.split('-').slice(0, 2).join('-');
    return eventRound;
  });

  let startingActivityId = generateNextChildActivityId(wcif);

  Object.keys(missingActivitiesByRoundId).forEach((eventRound) => {
    const groups = missingActivitiesByRoundId[eventRound];
    groups.forEach((group) => {
      const { activityCode, roomId } = group;
      const { groupNumber } = parseActivityCode(activityCode);

      const venue = schedule.venues.find((venue) => venue.rooms.some((room) => room.id === roomId))
      const room = venue.rooms.find((room) => room.id === roomId);
      const roundActivity = room.activities.find((activity) => activity.activityCode === eventRound);
      roundActivity.childActivities.push(createGroupActivity(startingActivityId, roundActivity, groupNumber));

      startingActivityId += 1;
    });
  });

  return {
    ...wcif,
    schedule,
  };
}

const upsertCompetitorAssignments = (wcif, assignments) => {
  const persons = wcif.persons;

  assignments.forEach((assignment) => {
    const person = persons.find((person) => person.registrantId === assignment.registrantId);
    const activity = activityByActivityCode(wcif, assignment.roomId, assignment.activityCode);

    const newAssignment = createGroupAssignment(person.registrantId, activity.id, assignment.assignmentCode).assignment;

    if (person.assignments.find((assignment) => assignment.activityId === activity.id)) {
      person.assignments = person.assignments.map((assignment) => assignment.activityId === activity.id ? newAssignment : assignment);
    } else {
      person.assignments.push(newAssignment);
    }
  });

  return {
    ...wcif,
    persons,
  }
}

const ImportPage = () => {
  const wcif = useSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { readString } = usePapaParse();
  const [file, setFile] = useState();
  const [CSVContents, setCSVContents] = useState();
  const [competitorAssignments, setCompetitorAssignments] = useState();
  const [missingGroupActivities, setMissingGroupActivities] = useState();
  const [assignmentGenerationError, setAssignmentGenerationError] = useState();
  const validateContents = useMemo(() => wcif && validate(wcif), [wcif]);
  const validation = useMemo(() => validateContents && CSVContents && validateContents(CSVContents), [validateContents, CSVContents]);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Import',
      },
    ]);
  }, [setBreadcrumbs]);

  const fileReader = new FileReader();

  const handleOnChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();

    if (file) {
      fileReader.onload = function (event) {
        const csvOutput = event.target.result;
        readString(csvOutput, {
          worker: false,
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase(),
          complete: (results) => {
            setCSVContents(results);
          },
        });
      };

      fileReader.readAsText(file);
    }
  };

  const onGenerateCompetitorAssignments = () => {
    try {
      const assignments = generateAssignments(wcif, CSVContents);
      setCompetitorAssignments(assignments);

      const missingGroupActivities = determineMissingGroupActivities(wcif, assignments);
      setMissingGroupActivities(missingGroupActivities);

      setAssignmentGenerationError(null);
    } catch (e) {
      console.error(e);
      setAssignmentGenerationError(e);
    }
  };

  const onImportCompetitorAssignments = () => {
    // TODO: dispatch import assignments
    const newWcif = upsertCompetitorAssignments(
      generateMissingGroupActivities(
        wcif,
        missingGroupActivities
      ),
      competitorAssignments
    );

    dispatch(partialUpdateWCIF({
      persons: newWcif.persons,
      schedule: newWcif.schedule,
    }));
  }

  return (
    <Grid container direction="column">
      <Grid item sx={{ padding: '1em' }}>
        <Typography variant="h5">Instructions</Typography>
        <Typography variant="body1">
          The following are instructions on how to properly format data to import it into delegate dashboard and thus, the WCA website.
          <br />
          The first item to note is that whatever CSV you upload must have 1 row per person, mainly identified by their email.
          <br />
          You must also have a column for each event containing a competitor's competing group.
        </Typography>
        <Accordion>
          <AccordionSummary>
            <Typography>Competing group format</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              The competing group format is as follows:
              <br />
              {"<First letter of the stage><Number of the group>"}
              <br />
              You will have a chance to confirm that the stages match up correctly with the prefix you have used.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Divider />
      <Grid item sx={{ padding: '1em' }}>
        <Typography variant="h5">Import data from CSV</Typography>
        <form>
          <input
            type="file"
            accept=".csv"
            onChange={handleOnChange}
          />
          <Button
            variant="contained"
            onClick={handleOnSubmit}
            style={{ marginLeft: '1em' }}
          >
            IMPORT CSV
          </Button>
        </form>
      </Grid>
      {CSVContents && (
        <>
          <Divider />
          <br />
          <Grid>
            <Typography variant="h5">Checks</Typography>
            {validation.map((check) => (
              <Alert key={check.key} severity={check.passed ? 'success' : 'error'}>
                {check.message}
                {check.data && check.key === 'has-all-competing-event-column' && (
                  check.data.map((i) => i.email).join(', ')
                )}
              </Alert>
            ))}
          </Grid>
          <br />
          <Divider />
          <br />
          <Grid>
            <CSVPreview CSVContents={CSVContents} />
          </Grid>
          <Divider />
          <Grid item sx={{ padding: '1em' }}>
            <Typography variant="h5">Confirm data</Typography>
            <Typography>
              Please confirm that the data you have uploaded is correct.
              <br />
              If it is, click the button below to import it into delegate dashboard.
            </Typography>
            <Typography>
              {CSVContents.data.length} people found
            </Typography>
            <Button variant="contained" disabled={validation.some((check) => !check.passed)} onClick={onGenerateCompetitorAssignments}>GENERATE COMPETITOR ASSIGNMENTS</Button>
            <Typography>{competitorAssignments?.length || 0} generated assignments</Typography>
            <Typography>{missingGroupActivities ? missingGroupActivities.length : '???'} missing group activities{missingGroupActivities ? `: (${missingGroupActivities.map((a) => a.activityCode).join(', ')})` : ''}</Typography>
            {assignmentGenerationError && (
              <Alert severity="error">
                {assignmentGenerationError.message}
              </Alert>
            )}
            <Button variant="contained" disabled={!competitorAssignments?.length} onClick={onImportCompetitorAssignments}>GENERATE MISSING GROUP ACTIVITIES AND IMPORT COMPETITOR ASSIGNMENTS</Button>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default ImportPage;
