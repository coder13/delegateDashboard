import { styled } from '@material-ui/core';
import { Round } from '@wca/helpers';
import { useEffect, useState } from 'react';
import { Constraints } from 'wca-group-generators';
import { ArrowForwardIosSharp, CheckBox, Delete, ExpandMore } from '@mui/icons-material';
import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  AccordionProps,
  AccordionSummaryProps,
  Box,
  Autocomplete,
  TextField,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import Assignments from '../../config/assignments';
import { Filters, Step, StepLibrary } from '../../lib/recipes';
import { useAppSelector } from '../../store';

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(() => ({
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

interface EditStepDialogProps {
  onClose: () => void;
  step?: Step;
  round: Round;
}

export const EditStepDialog = ({ onClose, step, round }: EditStepDialogProps) => {
  const [assignmentCode, setAssignmentCode] = useState<Step['props']['assignmentCode'] | undefined>(
    step?.props?.assignmentCode
  );
  const [selectedGenerator, setSelectedGenerator] = useState<Step['generator'] | undefined>(
    step?.generator
  );
  const wcif = useAppSelector((state) => state.wcif);

  useEffect(() => {
    setSelectedGenerator(step?.generator);
    setAssignmentCode(step?.props?.assignmentCode);
  }, [step]);

  const rooms = wcif?.schedule?.venues
    ?.flatMap((venue) => venue.rooms)
    .filter((room) => room.activities.some((a) => a.activityCode.startsWith(round.id)));
  const activityCodes = [
    ...new Set(
      rooms?.flatMap((room) =>
        room.activities
          .flatMap((activity) => activity.childActivities)
          .filter((ca) => ca.activityCode.startsWith(round.id))
          .map((ca) => ca.activityCode)
      )
    ),
  ];

  const stepDefinition = step && StepLibrary[step?.id];
  console.log(24, step);
  return (
    <Dialog open={!!step} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Editing Step {stepDefinition?.name} for {round.id}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Box sx={{ py: 1 }}>
            <Typography>{stepDefinition?.description}</Typography>
          </Box>

          <Autocomplete
            freeSolo
            value={assignmentCode}
            options={Assignments.map((assignment) => assignment.id)}
            renderInput={(params) => <TextField {...params} label="Assignment" />}
          />

          <FormControl variant="outlined" fullWidth sx={{ m: 1 }}>
            <InputLabel id="generator-label">Generator</InputLabel>
            <Select
              labelId="generator-label"
              id="generator-input"
              label="Generator"
              value={selectedGenerator}
              onChange={(e) => setSelectedGenerator(e.target.value)}>
              <MenuItem value="assignEveryone">Assign Everyone</MenuItem>
              <MenuItem value="assignXPerActivity">Assign X per Group</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Accordion expanded sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>Cluster</AccordionSummary>
          <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={1}>
              <FormControl size="small" variant="outlined" sx={{ flex: 1 }}>
                <InputLabel id="cluster-label">Cluster</InputLabel>
                <Select
                  labelId="cluster-label"
                  id="cluster-base-input"
                  label="Cluster"
                  value={step?.props?.cluster?.base}>
                  <MenuItem value="personsInRound">Everyone In Round</MenuItem>
                </Select>
              </FormControl>
              <Divider />
              {step?.props?.cluster?.filters.map((filter, index) => (
                <Stack direction="row" spacing={1} key={filter.key} sx={{ py: 1 }}>
                  <FormControl size="small" variant="outlined" sx={{ flex: 0.5 }}>
                    <InputLabel id={`filter-${index}-label`}>Filter</InputLabel>
                    <Select
                      labelId={`filter-${index}-label`}
                      id={`filter-${index}-input`}
                      label="Filter"
                      value={filter.key}>
                      {Filters.map((filterDef) => (
                        <MenuItem key={filterDef.key} value={filterDef.key}>
                          {filterDef.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" variant="outlined" sx={{ flex: 1 }}>
                    <InputLabel id={`filter-${index}-label`}>Filter</InputLabel>
                    <Select
                      labelId={`filter-${index}-label`}
                      id={`filter-${index}-input`}
                      label="Filter"
                      value={filter.key}
                    />
                  </FormControl>
                  <IconButton>
                    <Delete color="error" />
                  </IconButton>
                </Stack>
              ))}

              <Button>Add Filter</Button>

              {/* <FormControl size="small" variant="outlined" sx={{ flex: 1 }}>
                <InputLabel id="firstTimer-label">First Timer</InputLabel>
                <Select
                  labelId="firstTimer-label"
                  label="First Timer"
                  id="cluster-first-timer-input"
                  value={step?.options?.clusterOptions?.firstTimer ?? 'ignore'}>
                  <MenuItem value="ignore">Ignore</MenuItem>
                  <MenuItem value="isFirstTimer">Is First Timer</MenuItem>
                  <MenuItem value="isNotFirstTimer">Is Not First Timer</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" variant="outlined" sx={{ flex: 2, width: 400 }}>
                <InputLabel id="roles-label">Roles</InputLabel>
                <Select
                  labelId="roles-label"
                  label="Roles"
                  id="cluster-roles-input"
                  multiple
                  value={step?.options?.clusterOptions?.roles ?? ['staff-all']}>
                  <MenuItem value="staff-all">Staff</MenuItem>
                  <MenuItem value="staff-delegate">Delegate</MenuItem>
                  <MenuItem value="staff-trainee-delegate">Trainee Delegate</MenuItem>
                  <MenuItem value="staff-organizer">Organizer</MenuItem>
                </Select>
              </FormControl> */}
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>Activities</AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ p: 1 }}>
              <FormControl variant="outlined" sx={{ flex: 1 }} fullWidth>
                <InputLabel id="activities-base--label">Base</InputLabel>
                <Select
                  labelId="activities-base-label"
                  id="activities-base-input"
                  label="Base"
                  value={step?.props?.activities?.base}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="odd">Odd</MenuItem>
                  <MenuItem value="even">Even</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Room</TableCell>
                  {activityCodes.map((code) => {
                    return <TableCell key={code}>{code}</TableCell>;
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms?.map((room) => {
                  const groups = room.activities
                    .flatMap((activity) => activity.childActivities)
                    .filter((ca) => ca.activityCode.startsWith(round.id + '-'));

                  return (
                    <TableRow key={room.id}>
                      <TableCell>{room.name}</TableCell>
                      {groups.map((group) => (
                        <TableCell key={group.id}>
                          <CheckBox />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>Constraints</AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Constraint</TableCell>
                  <TableCell>Weight</TableCell>
                  <TableCell>Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {step?.props?.constraints.map(({ constraint, weight }) => {
                  const constraintDef = Constraints[constraint];
                  console.log(constraintDef);
                  return (
                    <TableRow key={constraint}>
                      <TableCell>{constraintDef?.name}</TableCell>
                      <TableCell>{weight}</TableCell>
                      <TableCell>{constraint.options}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={onClose}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};
