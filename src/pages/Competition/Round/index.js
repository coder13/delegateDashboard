import { useConfirm } from 'material-ui-confirm';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { MoreVert } from '@mui/icons-material';
import {
  AppBar,
  Card,
  CardActions,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListSubheader,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import PersonsAssignmentsDialog from '../../../components/PersonsAssignmentsDialog';
import PersonsDialog from '../../../components/PersonsDialog';
import { EditRecipeDialog } from '../../../components/RecipeEditor';
import {
  activityCodeToName,
  findAllActivities,
  byGroupNumber,
  findGroupActivitiesByRound,
  roomByActivity,
  cumulativeGroupCount,
} from '../../../lib/activities';
import { Recipes, fromRecipeDefinition, hydrateStep } from '../../../lib/recipes';
import { byName } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import {
  bulkRemovePersonAssignments,
  generateAssignments,
  updateRoundChildActivities,
} from '../../../store/actions';
import {
  selectPersonsAssignedForRound,
  selectPersonsShouldBeInRound,
  selectRoundById,
} from '../../../store/selectors';
import ConfigureAssignmentsDialog from './ConfigureAssignmentsDialog';
import ConfigureGroupCountsDialog from './ConfigureGroupCountsDialog';
import ConfigureStationNumbersDialog from './ConfigureStationNumbersDialog.js';
import GroupCard from './GroupCard';

/**
 * I want some visualization of who's competing / staffing what for this particular round
 * If no one has been assigned, I want to generate assignments
 * I want to view a mini psych sheet so that I can pick scramblers
 * I want DOB so that I know who really not to bother assigning
 *
 */

/**
 * Handles multiple activities across multiple rooms under 1 round activity code
 */
const RoundPage = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { roundId: activityCode } = useParams();
  const [configureRecipeDialog, setConfigureRecipeDialog] = useState(false);
  const [configureAssignmentsDialog, setConfigureAssignmentsDialog] = useState(false);
  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] = useState(false);
  const [configureStationNumbersDialog, setConfigureStationNumbersDialog] = useState(false);
  const [showPersonsDialog, setShowPersonsDialog] = useState({
    open: false,
    title: undefined,
    persons: [],
  });
  const [showPersonsAssignmentsDialog, setShowPersonsAssignmentsDialog] = useState(false);

  const wcif = useSelector((state) => state.wcif);
  const round = useSelector((state) => selectRoundById(state)(activityCode));
  const personsShouldBeInRound = useSelector((state) => selectPersonsShouldBeInRound(state)(round));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: round.id,
      },
    ]);
  }, [setBreadcrumbs, round.id]);

  const _allActivities = findAllActivities(wcif);

  // list of each stage's round activity
  const roundActivities = _allActivities
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

  const recipe = useMemo(() => getExtensionData('recipe', round), [round]);
  // The data is either stored in the wcif or defaultss are used
  const recipeConfig = useMemo(() => {
    if (!recipe) {
      return Recipes[0];
    }

    if (recipe.data) {
      return recipe.data;
    }

    const recipeData = Recipes.find((r) => r.id === recipe.id);
    if (!recipeData) {
      throw Error`Recipe ${recipe.id} not found`;
    }

    return {
      ...fromRecipeDefinition(recipeData),
      name: `${recipeData.name} (defaults)`,
    };
  }, [recipe]);

  console.log(105, recipe, recipeConfig);

  const groups = findGroupActivitiesByRound(wcif, activityCode);

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        return (
          byGroupNumber(groupA, groupB) ||
          groupA?.parent?.room?.name?.localeCompare(groupB?.parent?.room?.name)
        );
      }),
    [groups]
  );

  const personsAssigned = useSelector((state) => selectPersonsAssignedForRound(state, round.id));

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned.filter((p) => p.assignments.some((a) => a.assignmentCode === 'competitor')),
    [personsAssigned]
  );

  /**
   * Fills in assignment gaps. Everyone should end up having a competitor assignment and staff assignment
   * 1. Start with giving out competitor assignments.
   *   1a Start with assigning competitor assignments to people who are already assigned to staff
   *   1b Assign organizers and delegates their competing assignments, don't assign  staff assignments
   *   1c Then hand out competitor assignments to people who are not assigned to staff
   *
   * 2. Then give out judging assignments to competitors without staff assignments
   */
  const onGenerateGroupActitivites = () => {
    if (!recipeConfig) {
      console.error('No recipe config found');
      return;
    }

    dispatch(generateAssignments(round.id, recipeConfig));
  };

  const onResetGroupActitivites = () => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(
          bulkRemovePersonAssignments([
            ...groups.map((group) => ({
              activityId: group.id,
            })),
          ])
        );

        roundActivities.forEach((roundActivity) => {
          dispatch(updateRoundChildActivities(roundActivity.id, []));
        });
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const onResetGroupNonScramblingActitivites = () => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(
          bulkRemovePersonAssignments([
            ...groups.map((group) => ({
              activityId: group.id,
              assignmentCode: 'staff-judge',
            })),
            ...groups.map((group) => ({
              activityId: group.id,
              assignmentCode: 'competitor',
            })),
          ])
        );
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const onConfigureAssignments = () => {
    setConfigureAssignmentsDialog(true);
  };

  if (roundActivities.length === 0) {
    return (
      <div>
        No Group Activities found. <br />
        If you're viewing 3x3 fewest moves, there's likely not much to do here yet.
      </div>
    );
  }

  const actionButtons = () => {
    if (groups.length === 0) {
      return (
        <>
          <Button onClick={() => setConfigureGroupCountsDialog(true)}>
            Configure Group Counts
          </Button>
        </>
      );
    } else if (
      groups.length > 0 &&
      personsAssignedToCompete.length < personsShouldBeInRound.length
    ) {
      return (
        <>
          <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
          <Button onClick={onGenerateGroupActitivites}>
            Assign Competitor and Judging Assignments
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetGroupActitivites}>
            Reset Group Activities
          </Button>
        </>
      );
    } else if (personsAssignedToCompete.length > 0) {
      return (
        <>
          <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
          <Button onClick={() => setConfigureStationNumbersDialog(activityCode)}>
            Configure Station Numbers
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetGroupNonScramblingActitivites}>
            Reset Competitor and Judging Assignments
          </Button>
        </>
      );
    } else {
      console.log({
        groupCount: groups,
        personsAssignedToCompete: personsAssignedToCompete,
        personsShouldBeInRound: personsShouldBeInRound,
      });

      return (
        <>
          <Button onClick={() => setConfigureGroupCountsDialog(true)}>
            Configure Group Counts
          </Button>
          <Typography>No one in round to assign! Double check registrations.</Typography>
        </>
      );
    }
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Card>
          <CardHeader title={activityCodeToName(activityCode)} />
          <List dense subheader={<ListSubheader id="stages">Stages</ListSubheader>}>
            {roundActivities.map(({ id, startTime, endTime, room }) => (
              <ListItemButton key={id}>
                {room.name}: {new Date(startTime).toLocaleDateString()}{' '}
                {new Date(startTime).toLocaleTimeString()} -{' '}
                {new Date(endTime).toLocaleTimeString()} (
                {(new Date(endTime) - new Date(startTime)) / 1000 / 60} Minutes)
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: 'center' }}>Round Size</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  Persons In Round
                  <br />
                  <Typography variant="caption">Based on WCA-Live data</Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Assigned Persons</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  Groups Configured <br />
                  (per stage)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={() =>
                    setShowPersonsDialog({
                      open: true,
                      persons: personsShouldBeInRound?.sort(byName) || [],
                      title: 'People who should be in the round',
                    })
                  }>
                  {personsShouldBeInRound?.length || '???'}
                </TableCell>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={() =>
                    setShowPersonsDialog({
                      open: round.results.length > 0,
                      persons:
                        round.results
                          .map(({ personId }) =>
                            wcif.persons.find(({ registrantId }) => registrantId === personId)
                          )
                          .sort(byName) || [],
                      title: 'People in the round according to wca-live',
                    })
                  }>
                  {round.results.length}
                </TableCell>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={() => setShowPersonsAssignmentsDialog(true)}>
                  {personsAssigned.length}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{cumulativeGroupCount(round)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <CardActions>{actionButtons()}</CardActions>
        </Card>
      </Grid>

      <Grid item>
        <AppBar position="sticky" color="secondary" sx={{ top: '480px' }}>
          <Toolbar component={Paper}>
            <Typography>Recipe: {recipeConfig.name}</Typography>
            <div style={{ display: 'flex', flex: 1 }} />
            <Button onClick={onGenerateGroupActitivites}>Run Recipe</Button>
            <IconButton edge="end" onClick={() => setConfigureRecipeDialog(true)}>
              <MoreVert />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Grid>

      <Grid item>
        <Divider />
        {sortedGroups.map((group) => (
          <GroupCard key={group.id} groupActivity={group} />
        ))}
      </Grid>
      <ConfigureAssignmentsDialog
        open={configureAssignmentsDialog}
        onClose={() => setConfigureAssignmentsDialog(false)}
        round={round}
        activityCode={activityCode}
        groups={groups}
      />
      <ConfigureGroupCountsDialog
        open={configureGroupCountsDialog}
        onClose={() => setConfigureGroupCountsDialog(false)}
        activityCode={activityCode}
        round={round}
        roundActivities={roundActivities}
      />
      {configureStationNumbersDialog && (
        <ConfigureStationNumbersDialog
          open={Boolean(configureStationNumbersDialog)}
          onClose={() => setConfigureStationNumbersDialog(false)}
          activityCode={configureStationNumbersDialog}
        />
      )}
      {configureRecipeDialog && (
        <EditRecipeDialog
          open={configureRecipeDialog}
          onClose={() => setConfigureRecipeDialog(false)}
          recipeConfig={recipeConfig}
          round={round}
        />
      )}
      <PersonsDialog
        open={showPersonsDialog?.open}
        persons={showPersonsDialog?.persons}
        title={showPersonsDialog?.title}
        onClose={() =>
          setShowPersonsDialog({
            open: false,
            title: undefined,
            persons: [],
          })
        }
      />
      <PersonsAssignmentsDialog
        open={showPersonsAssignmentsDialog}
        persons={personsShouldBeInRound}
        roundId={round.id}
        onClose={() => setShowPersonsAssignmentsDialog(false)}
      />
    </Grid>
  );
};

export default RoundPage;
