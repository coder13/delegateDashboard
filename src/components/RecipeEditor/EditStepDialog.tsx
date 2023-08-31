import { styled } from '@material-ui/core';
import { Round } from '@wca/helpers';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Constraints, Generators } from 'wca-group-generators';
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
  FormHelperText,
} from '@mui/material';
import Assignments from '../../config/assignments';
import { Filters, Step, StepLibrary } from '../../lib/recipes';
import { useAppSelector } from '../../store';
import { updateStep } from '../../store/actions';

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
  const dispatch = useDispatch();

  const [assignmentCode, setAssignmentCode] = useState<Step['props']['assignmentCode'] | undefined>(
    step?.props?.assignmentCode
  );
  const [selectedGenerator, setSelectedGenerator] = useState<Step['generator'] | undefined>(
    step?.generator
  );
  const [generatorOptions, setGeneratorOptions] = useState<Step['props']['options']>(
    step?.props?.options ?? {}
  );
  const [editingCluster, setEditingCluster] = useState<Step['props']['cluster']>(
    step?.props?.cluster || {
      base: 'personsInRound',
      filters: [],
    }
  );

  const dirty = useMemo(() => {
    return (
      step?.props?.assignmentCode !== assignmentCode ||
      step?.generator !== selectedGenerator ||
      JSON.stringify(step?.props?.options) !== JSON.stringify(generatorOptions) ||
      step?.props?.cluster.base !== editingCluster.base ||
      step?.props?.cluster.filters.some(
        (f, i) =>
          f.key !== editingCluster.filters?.[i]?.key &&
          f.value !== editingCluster.filters?.[i]?.value
      )
    );
  }, [
    assignmentCode,
    editingCluster.base,
    editingCluster.filters,
    generatorOptions,
    selectedGenerator,
    step?.generator,
    step?.props?.assignmentCode,
    step?.props?.cluster.base,
    step?.props?.cluster.filters,
    step?.props?.options,
  ]);

  const wcif = useAppSelector((state) => state.wcif);

  useEffect(() => {
    setSelectedGenerator(step?.generator);
    setAssignmentCode(step?.props?.assignmentCode);
    setEditingCluster(step?.props?.cluster ?? { base: 'personsInRound', filters: [] });
    setGeneratorOptions(step?.props?.options ?? {});
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

  const onSave = () => {
    dispatch(
      updateStep(round, step?.id, {
        ...step,
        generator: selectedGenerator,
        props: {
          ...step?.props,
          assignmentCode,
          cluster: editingCluster,
          options: generatorOptions,
        },
      })
    );
    onClose();
  };

  const generatorDef = selectedGenerator && Generators[selectedGenerator];

  const stepDefinition = step && StepLibrary[step?.id];

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
            onChange={(_, value) => setAssignmentCode(value ?? undefined)}
            options={Assignments.map((assignment) => assignment.id)}
            renderInput={(params) => <TextField {...params} label="Assignment" />}
          />

          <Stack direction="row" spacing={1} sx={{ py: 1 }}>
            <FormControl variant="outlined" sx={{ m: 1, flex: 1 }}>
              <InputLabel id="generator-label">Generator</InputLabel>
              <Select
                labelId="generator-label"
                id="generator-input"
                label="Generator"
                value={selectedGenerator}
                onChange={(e) => {
                  setSelectedGenerator(e.target.value);
                  setGeneratorOptions((prev) => ({
                    ...prev,
                    ...Generators[e.target.value]?.defaultOptions,
                  }));
                }}>
                <MenuItem value="assignEveryone">Assign Everyone</MenuItem>
                <MenuItem value="assignXPerActivity">Assign X per Group</MenuItem>
              </Select>
              <FormHelperText>{generatorDef?.description ?? ''}</FormHelperText>
            </FormControl>
            {Object.keys(generatorDef?.optionsDef ?? {}).map((optionKey) => (
              <FormControl variant="outlined" sx={{ m: 1, flex: 1 }}>
                <InputLabel id={`generator-${optionKey}-label`}>{optionKey}</InputLabel>
                {generatorDef.optionsDef[optionKey].type === 'select' && (
                  <Select
                    labelId={`generator-${optionKey}-label`}
                    id={`generator-${optionKey}-input`}
                    label={optionKey}
                    value={generatorOptions[optionKey]}
                    onChange={(e) =>
                      setGeneratorOptions((prev) => ({
                        ...prev,
                        [optionKey]: e.target.value,
                      }))
                    }>
                    {generatorDef.optionsDef[optionKey].values.map((option) => (
                      <MenuItem value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                )}
                {generatorDef.optionsDef[optionKey].type === 'number' && (
                  <TextField
                    label={optionKey}
                    type="number"
                    value={generatorOptions[optionKey]}
                    onChange={(e) =>
                      setGeneratorOptions((prev) => ({
                        ...prev,
                        [optionKey]: e.target.value,
                      }))
                    }
                  />
                )}
                <FormHelperText>{generatorDef.optionsDef[optionKey].description}</FormHelperText>
              </FormControl>
            ))}
          </Stack>
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
                  onChange={(e) => {
                    setEditingCluster((prev) => ({
                      ...prev,
                      base: e.target.value as Step['props']['cluster']['base'],
                    }));
                  }}
                  value={editingCluster?.base}>
                  <MenuItem value="personsInRound">Everyone In Round</MenuItem>
                </Select>
              </FormControl>
              <Divider />
              {editingCluster?.filters.map((filter, index) => (
                <Stack direction="row" spacing={1} key={filter.key + filter.value} sx={{ py: 1 }}>
                  <FormControl size="small" variant="outlined" sx={{ flex: 0.5 }}>
                    <InputLabel id={`cluster-filter-name-${index}-label`}>Filter</InputLabel>
                    <Select
                      labelId={`cluster-filter-name-${index}-label`}
                      id={`cluster-filter-name-${index}-input`}
                      label="Filter"
                      onChange={(e) =>
                        setEditingCluster((prev) => ({
                          ...prev,
                          filters: prev.filters.map((f, i) =>
                            i === index ? { ...f, key: e.target.value } : f
                          ),
                        }))
                      }
                      value={filter.key}>
                      {Filters.map((filterDef) => (
                        <MenuItem key={filterDef.key} value={filterDef.key}>
                          {filterDef.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" variant="outlined" sx={{ flex: 1 }}>
                    <InputLabel id={`cluster-filter-value-${index}-label`}>Filter Value</InputLabel>
                    <Select
                      labelId={`cluster-filter-value-${index}-label`}
                      id={`cluster-filter-value-${index}-input`}
                      label="Filte Valuer"
                      onChange={(e) =>
                        setEditingCluster((prev) => ({
                          ...prev,
                          filters: prev.filters.map((f, i) =>
                            i === index ? { ...f, value: e.target.value } : f
                          ),
                        }))
                      }
                      value={filter.value}>
                      {Filters.find((f) => f.key === filter.key)?.options?.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={() => {
                      setEditingCluster((prev) => ({
                        ...prev,
                        filters: prev.filters.filter((_, i) => i !== index),
                      }));
                    }}>
                    <Delete color="error" />
                  </IconButton>
                </Stack>
              ))}

              <Button
                onClick={() => {
                  setEditingCluster((prev) => ({
                    ...prev,
                    filters: [...prev.filters, { key: '', value: '' }],
                  }));
                }}>
                Add Filter
              </Button>
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
        <Button onClick={onSave} disabled={!dirty}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
