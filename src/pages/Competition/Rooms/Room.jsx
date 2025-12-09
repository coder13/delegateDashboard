import { generateNextChildActivityId, parseActivityCode } from '../../../lib/domain/activities';
import { advancingCompetitors } from '../../../lib/domain/formulas';
import { acceptedRegistrations } from '../../../lib/domain/persons';
import { getGroupData } from '../../../lib/wcif/extensions/wcif-extensions';
import { useAppSelector } from '../../../store';
import {
  updateRoundChildActivities,
  updateGroupCount,
  updateRoundActivities,
} from '../../../store/actions';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Button, MenuItem, TextField } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { makeStyles } from '@mui/styles';
import { useConfirm } from 'material-ui-confirm';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

const useStyles = makeStyles(() => ({
  card: ({ room }) => ({
    border: room ? `2px solid ${room.color}` : 'none',
  }),
  field: {
    marginRight: '1em',
  },
  bold: {
    fontWeight: 600,
  },
}));

// TODO: Redesign this data import flow
const Room = ({ room }) => {
  const classes = useStyles({ room });
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const wcif = useAppSelector((state) => state.wcif);
  const [anchorEl, setAnchorEl] = React.useState(null);
  // const [configureStagesDialogOpen, setConfigureStagesDialogOpen] = React.useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // const openConfigureStagesDialog = () => {
  //   handleMenuClose();
  //   setConfigureStagesDialogOpen(true);
  // };

  const eventRegistrationCounts = useMemo(() => {
    const _eventRegistrationCounts = {};

    acceptedRegistrations(wcif.persons).forEach((person) => {
      if (!person.registration) {
        return;
      }

      person.registration.eventIds.forEach((eventId) => {
        if (_eventRegistrationCounts[eventId]) {
          _eventRegistrationCounts[eventId]++;
        } else {
          _eventRegistrationCounts[eventId] = 1;
        }
      });
    });

    return _eventRegistrationCounts;
  }, [wcif.persons]);

  // const onCreateAllGroups = () => {
  // TODO
  // };

  const onResetAllGroups = () => {
    handleMenuClose();
    confirm({
      description: `This button should *only* be used to reset group data if another software messed up or you want to completely start over.\nTechnically speaking: it resets the child activities and extension data.`,
    })
      .then(() => {
        dispatch(
          updateRoundActivities(
            room.activities.map((activity) => ({
              ...activity,
              childActivities: [],
              extensions: [],
            }))
          )
        );
        // TODO: follow up with prompt to clear competitor assignments (highly recommended)
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return (
    <Card className={classes.card}>
      <Menu
        id="room-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        {/* <MenuItem disabled onClick={onCreateAllGroups}>Create All Groups</MenuItem> */}
        <MenuItem onClick={onResetAllGroups}>Reset All Groups</MenuItem>
      </Menu>
      <CardHeader
        action={
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        }
        title={room.name}
      />
      <CardContent>
        <TableContainer key={room.id}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell className={classes.bold}>Event</TableCell>
                <TableCell className={classes.bold}>Round</TableCell>
                <TableCell className={classes.bold}>Estimated Competitors</TableCell>
                <TableCell className={classes.bold}>Scramble Set Count</TableCell>
                <TableCell className={classes.bold}>Estimated Groups</TableCell>
                <TableCell className={classes.bold}>Estimated Max Group Size</TableCell>
                <TableCell className={classes.bold}>Competitors In Round</TableCell>
                <TableCell className={classes.bold}>Groups</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {room.activities
                .filter((activity) => activity.activityCode.split('-')[0] !== 'other')
                .map((activity) => {
                  const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
                  const event = wcif.events.find((i) => i.id === eventId);
                  const round = event.rounds[roundNumber - 1];

                  const previousRound = roundNumber > 1 ? event.rounds[roundNumber - 2] : null;
                  const advancementCondition = previousRound?.advancementCondition;

                  const estimatedCompetitors =
                    roundNumber === 1
                      ? eventRegistrationCounts[eventId]
                      : advancingCompetitors(
                          advancementCondition,
                          eventRegistrationCounts[eventId]
                        );
                  const actualCompetitors = round.results.length;

                  const groupData = getGroupData(activity);

                  // true if we are looking at a first round or we have results for that round
                  const canCreateGroups =
                    ((roundNumber === 1 && estimatedCompetitors > 0) ||
                      (roundNumber > 1 && round.results.length > 0)) &&
                    groupData?.groups;

                  const handleGroupCountChange = (e) => {
                    dispatch(
                      updateGroupCount(
                        activity.id,
                        Math.max(1, parseInt(e.currentTarget.value, 10))
                      )
                    );
                  };

                  const handleGenerateGroupActitivites = () => {
                    if (!groupData?.groups) {
                      return;
                    }

                    const childActivities = [];
                    const startActivityId = generateNextChildActivityId(wcif);

                    for (let i = 0; i < groupData?.groups; i++) {
                      childActivities.push({
                        id: startActivityId + i,
                        name: `${activity.name}, Group ${i + 1}`,
                        activityCode: `${activity.activityCode}-g${i + 1}`,
                        startTime: activity.startTime, // spread across groups
                        endTime: activity.endTime,
                        childActivities: [],
                      });
                    }

                    dispatch(updateRoundChildActivities(activity.id, childActivities));
                  };

                  return (
                    <TableRow key={activity.id}>
                      <TableCell>{eventId}</TableCell>
                      <TableCell>{roundNumber}</TableCell>
                      <TableCell>{estimatedCompetitors || '-'}</TableCell>
                      <TableCell>{round.scrambleSetCount}</TableCell>
                      <TableCell>
                        <TextField
                          id=""
                          type="number"
                          variant="outlined"
                          size="small"
                          defaultValue={1}
                          value={groupData?.groups}
                          onChange={handleGroupCountChange}
                          style={{ maxWidth: '5em' }}
                        />
                      </TableCell>
                      <TableCell>
                        {estimatedCompetitors && groupData?.groups
                          ? Math.ceil(estimatedCompetitors / groupData.groups)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {actualCompetitors || (roundNumber === 1 && estimatedCompetitors) || '-'}
                      </TableCell>
                      <TableCell>
                        {activity.childActivities.length !==
                        (groupData?.groups || round.scrambleSetCount) ? (
                          <Button
                            variant="contained"
                            disabled={!canCreateGroups}
                            size="small"
                            onClick={handleGenerateGroupActitivites}>
                            Create
                          </Button>
                        ) : (
                          activity.childActivities.length
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default Room;
