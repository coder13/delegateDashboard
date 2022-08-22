import { useSelector } from 'react-redux';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Divider, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { usePapaParse } from 'react-papaparse';

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
      debugger;
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


const ImportPage = () => {
  const wcif = useSelector((state) => state.wcif);
  const { readString } = usePapaParse();
  const [file, setFile] = useState();
  const [CSVContents, setCSVContents] = useState();
  const validateContents = useMemo(() => wcif && validate(wcif), [wcif]);
  const validation = useMemo(() => validateContents && CSVContents && validateContents(CSVContents), [validateContents, CSVContents]);

  console.log(validation);

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
            console.log(results);
            setCSVContents(results);
          },
        });
      };

      fileReader.readAsText(file);
    }
  };


  return (
    <Grid container direction="column">
      <Grid item sx={{ padding: '1em' }}>
        <Typography variant="h3">Instructions</Typography>
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
        <Typography>Import data from CSV</Typography>
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
              </Alert>
            ))}
          </Grid>
          <br />
          <Divider />
          <br />
          <Grid>
            <Accordion>
              <AccordionSummary>Preview</AccordionSummary>
              <AccordionDetails style={{
                display: 'flex',
                flexDirection: 'row',
                overflowX: 'auto',
                width: '80vw'
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {CSVContents.meta.fields.map((field) => (
                        <TableCell key={field}>{field}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CSVContents.data.slice(0, 5).map((row) => (
                      <TableRow key={row.email}>
                        {CSVContents.meta.fields.map((field) => (
                          <TableCell key={field}>{row[field]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Divider />
          <Grid item sx={{ padding: '1em' }}>
            <Typography>Confirm data</Typography>
            <Typography>
              Please confirm that the data you have uploaded is correct.
              <br />
              If it is, click the button below to import it into delegate dashboard.
            </Typography>
            <Typography>
              {CSVContents.data.length} people found
            </Typography>
            <Button variant="contained" disabled={validation.some((check) => !check.passed)}>IMPORT DATA</Button>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default ImportPage;
