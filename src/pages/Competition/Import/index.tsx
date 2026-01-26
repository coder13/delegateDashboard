import {
  validate,
  generateAssignments,
  determineMissingGroupActivities,
  upsertCompetitorAssignments,
  generateMissingGroupActivities,
  determineStageForAssignments,
  balanceStartAndEndTimes,
  type ImportData,
  type ParsedAssignment,
  type ValidationCheck,
} from '../../../lib/importExport';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppDispatch, useAppSelector } from '../../../store';
import { partialUpdateWCIF } from '../../../store/actions';
import CSVPreview from '../../../components/CSVPreview';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Divider,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useEffect, useMemo, useState } from 'react';
import { usePapaParse } from 'react-papaparse';

const mapCSVFieldToData = (necessaryFields: string[]) => (field: string) => {
  if (necessaryFields.indexOf(field) > -1) {
    return field;
  }

  return null;
};

const ImportPage = () => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useAppDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { readString } = usePapaParse();
  const [file, setFile] = useState<File | null>(null);
  const [CSVContents, setCSVContents] = useState<ImportData | null>(null);
  const [competitorAssignments, setCompetitorAssignments] = useState<ParsedAssignment[] | null>(
    null
  );
  const [missingGroupActivities, setMissingGroupActivities] = useState<
    { activityCode: string; roomId: number }[] | null
  >(null);
  const [assignmentGenerationError, setAssignmentGenerationError] = useState<Error | null>(null);
  const validateContents = useMemo<((data: ImportData) => ValidationCheck[]) | null>(
    () => (wcif ? validate(wcif) : null),
    [wcif]
  );
  const validation = useMemo<ValidationCheck[]>(
    () => (validateContents && CSVContents ? validateContents(CSVContents) : []),
    [validateContents, CSVContents]
  );

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Import',
      },
    ]);
  }, [setBreadcrumbs]);

  if (!wcif) {
    return null;
  }

  const eventIds = wcif.events.map((e) => e.id);
  const necessaryFields = ['email', ...eventIds, ...eventIds.map((e) => `${e}-staff`)];
  const fileReader = new FileReader();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (file) {
      fileReader.onload = function (event) {
        const csvOutput = event.target?.result;
        if (typeof csvOutput !== 'string') {
          return;
        }

        readString(csvOutput, {
          worker: false,
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase(),
          complete: (results) => {
            const columnMap: Record<string, string> = {};
            results.meta.fields?.forEach((field) => {
              const mappedField = mapCSVFieldToData(necessaryFields)(field);
              if (mappedField) {
                columnMap[field] = mappedField;
              }
            });

            setCSVContents({
              ...(results as ImportData),
              meta: {
                ...results.meta,
                fields: [...new Set(results.meta.fields ?? [])],
              },
            });
          },
        });
      };

      fileReader.readAsText(file);
    }
  };

  const onGenerateCompetitorAssignments = () => {
    try {
      if (!CSVContents) {
        return;
      }

      const assignments = generateAssignments(wcif, CSVContents);
      setCompetitorAssignments(assignments);

      const missingGroupActivities = determineMissingGroupActivities(wcif, assignments);
      setMissingGroupActivities(missingGroupActivities);

      setAssignmentGenerationError(null);
    } catch (error) {
      console.error(error);
      setAssignmentGenerationError(
        error instanceof Error ? error : new Error('Failed to generate assignments')
      );
    }
  };

  const onGenerateMissingGroupActivities = () => {
    try {
      if (!missingGroupActivities) {
        return;
      }

      dispatch(
        partialUpdateWCIF({
          schedule: balanceStartAndEndTimes(
            generateMissingGroupActivities(wcif, missingGroupActivities),
            missingGroupActivities
          ).schedule,
        })
      );

      setMissingGroupActivities(null);
    } catch (error) {
      console.error(error);
      setAssignmentGenerationError(
        error instanceof Error ? error : new Error('Failed to generate missing group activities')
      );
    }
  };

  const onImportCompetitorAssignments = () => {
    if (!competitorAssignments) {
      return;
    }

    const newWcif = upsertCompetitorAssignments(
      wcif,
      determineStageForAssignments(wcif, competitorAssignments)
    );

    dispatch(
      partialUpdateWCIF({
        persons: newWcif.persons,
        schedule: newWcif.schedule,
      })
    );
  };

  return (
    <Grid container direction="column">
      <Grid item sx={{ padding: '1em' }}>
        <Typography variant="h5">Instructions</Typography>
        <Accordion>
          <AccordionSummary>
            <Typography>Preliminary Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1">
              The following are instructions on how to properly format data to import it into
              delegate dashboard and thus, the WCA website.
              <br />
              The first item to note is that whatever CSV you upload must have 1 row per person,
              identified by their email.
              <br />
              You must also have a column for each event containing a competitor&aposs competing
              group.
              <br />
              {`If you wish to specify staffing assignments, you will also include those. This column
              name can have any format so long as it includes the event Id but is not only the
              eventId. A perfectly fine format would be '{eventId}-staff'`}
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary>
            <Typography>Competing group format</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              The competing group format is as follows:
              <br />
              {'<First letter of the stage><Number of the group>'}
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary>
            <Typography>Staffing group format</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              The Staffing group format column should contain values separated by a commad `,` or a
              semicolon `;` where each value specifies an assignment between running, scrambling, or
              judging.
              <br />
              Each staff group assignment format is as follows:
              <br />
              {'<R | J | S><Number of the group>'}
              <br />
              There is no way to pick which state a group assignment is on. They will be randomly
              distributed between the stages.
              <br />
              You have the ability to visit the page for a round and configure which stage a group
              assignment is on.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Divider />
      <Grid item sx={{ padding: '1em' }}>
        <Typography variant="h5">Import data from CSV</Typography>
        <form onSubmit={handleOnSubmit}>
          <input type="file" accept=".csv" onChange={handleOnChange} />
          <Button variant="contained" type="submit" style={{ marginLeft: '1em' }}>
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
            {validation.map((check, index) => (
              <Alert key={check.key + index} severity={check.passed ? 'success' : 'error'}>
                {check.message}
                <br />
                {check.key === 'has-all-competing-event-column' &&
                  Array.isArray(check.data) &&
                  (check.data as { email: string }[]).map((i) => i.email).join(', ')}
              </Alert>
            ))}
          </Grid>
          <br />
          <Divider />
          <br />
          <Grid>
            <CSVPreview CSVContents={CSVContents} />
          </Grid>
          <br />
          <Divider />
          {/* <Accordion>
            <AccordionSummary>Column Map</AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CSV</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {CSVContents.meta.fields.map((field) => (
                    <TableRow key={field}>
                      <TableCell>{field}</TableCell>
                      <TableCell>{CSVColumnMap && CSVColumnMap[field]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion> */}
          <Grid item sx={{ padding: '1em' }}>
            <Typography variant="h5">Confirm data</Typography>
            <Typography>
              Please confirm that the data you have uploaded is correct.
              <br />
              If it is, click the button below to import it into delegate dashboard.
            </Typography>
            <Typography>{CSVContents.data.length} people found</Typography>
            <Button
              variant="contained"
              disabled={
                !!competitorAssignments?.length || validation.some((check) => !check.passed)
              }
              onClick={onGenerateCompetitorAssignments}>
              GENERATE COMPETITOR ASSIGNMENTS
            </Button>
            <Typography>{competitorAssignments?.length || 0} generated assignments</Typography>
            <Typography>
              {missingGroupActivities ? missingGroupActivities.length : '???'} missing group
              activities
              {missingGroupActivities?.length
                ? `: (${missingGroupActivities
                    .map((a) => `${a.activityCode}:${a.roomId}`)
                    .join(', ')})`
                : ''}
            </Typography>
            {assignmentGenerationError && (
              <Alert severity="error">{assignmentGenerationError.message}</Alert>
            )}
            <Button
              variant="contained"
              disabled={!missingGroupActivities || missingGroupActivities.length === 0}
              onClick={onGenerateMissingGroupActivities}>
              GENERATE MISSING GROUP ACTIVITIES
            </Button>
            <br />
            <Button
              variant="contained"
              disabled={!!missingGroupActivities?.length || !competitorAssignments?.length}
              onClick={onImportCompetitorAssignments}>
              IMPORT COMPETITOR ASSIGNMENTS
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default ImportPage;
