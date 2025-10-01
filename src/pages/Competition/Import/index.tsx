import { useEffect, useMemo, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../store/initialState';
import { EventId } from '@wca/helpers';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import {
  validate,
  generateAssignments,
  determineMissingGroupActivities,
  upsertCompetitorAssignments,
  generateMissingGroupActivities,
  determineStageForAssignments,
  balanceStartAndEndTimes,
} from '../../../lib/import';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { partialUpdateWCIF } from '../../../store/actions';
import CSVPreview from './CSVPreview';

// Define types for the CSV data
interface CSVMeta {
  fields: string[];
  delimiter: string;
  linebreak: string;
  aborted: boolean;
  truncated: boolean;
  cursor: number;
}

interface CSVRow {
  email: string;
  [key: string]: string;
}

interface CSVData {
  meta: CSVMeta;
  data: CSVRow[];
  errors: any[];
}

interface Assignment {
  registrantId: number;
  eventId: EventId;
  groupNumber: number;
  activityCode: string;
  assignmentCode: string;
  roomId?: number;
  roundNumber?: number;
}

interface MissingActivity {
  activityCode: string;
  groupNumber: number;
  eventId: EventId;
  roundNumber: number;
  roomId: number;
}

interface ValidationCheck {
  key: string;
  passed: boolean;
  message: string;
  data?: any;
}

const mapCSVFieldToData = (necessaryFields: string[]) => (field: string): string | null => {
  if (necessaryFields.indexOf(field) > -1) {
    return field;
  }

  return null;
};

const ImportPage = () => {
  const wcif = useSelector((state: AppState) => state.wcif);
  const eventIds = wcif?.events.map((e) => e.id) || [];
  const necessaryFields = ['email', ...eventIds, ...eventIds.map((e) => `${e}-staff`)];
  const dispatch = useDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { readString } = usePapaParse();
  const [file, setFile] = useState<File | undefined>();
  const [CSVContents, setCSVContents] = useState<CSVData | undefined>();
  const [CSVColumnMap, setCSVColumnMap] = useState<Record<string, string> | undefined>();
  const [competitorAssignments, setCompetitorAssignments] = useState<Assignment[] | undefined>();
  const [missingGroupActivities, setMissingGroupActivities] = useState<MissingActivity[] | undefined>();
  const [assignmentGenerationError, setAssignmentGenerationError] = useState<Error | null>();
  const validateContents = useMemo(() => wcif && validate(wcif), [wcif]);
  const validation = useMemo(
    () => validateContents && CSVContents && validateContents(CSVContents),
    [validateContents, CSVContents]
  );

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Import',
      },
    ]);
  }, [setBreadcrumbs]);

  const fileReader = new FileReader();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (file) {
      fileReader.onload = function (event) {
        const csvOutput = event.target?.result;
        if (typeof csvOutput === 'string') {
          readString(csvOutput, {
            worker: false as any,
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim().toLowerCase(),
            complete: (results: any) => {
              const columnMap: Record<string, string> = {};
              if (results.meta.fields) {
                results.meta.fields.forEach((field: string) => {
                  const mappedField = mapCSVFieldToData(necessaryFields)(field);
                  if (mappedField) {
                    columnMap[field] = mappedField;
                  }
                });
              }

              setCSVColumnMap(columnMap);

              setCSVContents({
                ...results,
                meta: {
                  ...results.meta,
                  fields: [...new Set(results.meta.fields || [])],
                },
              });
            },
          });
        }
      };

      fileReader.readAsText(file);
    }
  };

  const onGenerateCompetitorAssignments = () => {
    if (!wcif || !CSVContents) return;
    
    try {
      const assignments = generateAssignments(wcif, CSVContents);
      setCompetitorAssignments(assignments);

      const missingGroupActivities = determineMissingGroupActivities(wcif, assignments);
      setMissingGroupActivities(missingGroupActivities);

      setAssignmentGenerationError(null);
    } catch (e) {
      console.error(e);
      setAssignmentGenerationError(e as Error);
    }
  };

  const onGenerateMissingGroupActivities = () => {
    if (!wcif || !missingGroupActivities) return;
    
    try {
      dispatch(
        partialUpdateWCIF({
          schedule: balanceStartAndEndTimes(
            generateMissingGroupActivities(wcif, missingGroupActivities),
            missingGroupActivities
          ).schedule,
        })
      );

      setMissingGroupActivities(undefined);
    } catch (e) {
      console.error(e);
      setAssignmentGenerationError(e as Error);
    }
  };

  const onImportCompetitorAssignments = () => {
    if (!wcif || !competitorAssignments) return;
    
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

  console.log(CSVColumnMap);

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
              You must also have a column for each event containing a competitor's competing group.
              <br />
              If you wish to specify staffing assignments, you will also include those. This column
              name can have any format so long as it includes the event Id but is not only the
              eventId. A perfectly fine format would be '{'{'}eventId{'}'}-staff'
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
        <form>
          <input type="file" accept=".csv" onChange={handleOnChange} />
          <Button variant="contained" onClick={handleOnSubmit} style={{ marginLeft: '1em' }}>
            IMPORT CSV
          </Button>
        </form>
      </Grid>
      {CSVContents && validation && (
        <>
          <Divider />
          <br />
          <Grid>
            <Typography variant="h5">Checks</Typography>
            {validation.map((check: ValidationCheck, index: number) => (
              <Alert key={check.key + index} severity={check.passed ? 'success' : 'error'}>
                {check.message}
                <br />
                {check.data &&
                  check.key === 'has-all-competing-event-column' &&
                  check.data.map((i: CSVRow) => i.email).join(', ')}
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
                !!competitorAssignments?.length || validation.some((check: ValidationCheck) => !check.passed)
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
              disabled={
                (missingGroupActivities && missingGroupActivities.length > 0) ||
                !competitorAssignments?.length
              }
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
