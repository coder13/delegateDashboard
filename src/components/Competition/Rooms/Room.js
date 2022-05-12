import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { parseActivityCode } from '../../../lib/activities';
import { getGroupData } from '../../../lib/wcif-extensions';
import { advancingCompetitors } from '../../../lib/formulas';
import { Button, TextField } from '@mui/material';
import { acceptedRegistration, acceptedRegistrations } from '../../../lib/persons';
import { updateGroupCount } from '../../../store/actions';

const useStyles = makeStyles((theme) => ({
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
const Room = ({ venue, room }) => {
  const classes = useStyles({ room });
  const dispatch = useDispatch();
  const wcif = useSelector((state) => state.wcif);
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
      })
    });

    return _eventRegistrationCounts;
  }, [wcif.persons]);

  return (
    <Card
      className={classes.card}
    >
      <Menu
        id="room-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* <MenuItem onClick={openConfigureStagesDialog}>Configure Stages</MenuItem> */}
      </Menu>
      {/* <ConfigureStagesDialog
        open={configureStagesDialogOpen}
        handleClose={() => setConfigureStagesDialogOpen(false)}
        handleSaveStages={handleSaveStages}
        roomName={`${venue.name} / ${room.name}`}
        currentStages={currentStages}
      /> */}
      <CardHeader
        action={
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon/>
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
                <TableCell className={classes.bold}>Scramble Set Count</TableCell>
                <TableCell className={classes.bold}>Estimated Competitors</TableCell>
                <TableCell className={classes.bold}>Estimated Groups</TableCell>
                <TableCell className={classes.bold}>Competitors In Round</TableCell>
                <TableCell className={classes.bold}>Generated Groups</TableCell>
                <TableCell className={classes.bold}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {room.activities
                .filter((activity) => activity.activityCode.split('-')[0] !== 'other')
                .map((activity) => {
                  const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
                  const event = wcif.events.find(i => i.id === eventId);
                  const round = event.rounds[roundNumber - 1];

                  const previousRound = roundNumber > 1 ? event.rounds[roundNumber - 2] : null;
                  const advancementCondition = previousRound?.advancementCondition;

                  const estimatedCompetitors = roundNumber === 1
                      ? eventRegistrationCounts[eventId]
                      : advancingCompetitors(advancementCondition, eventRegistrationCounts[eventId]);
                  const actualCompetitors = round.results.length;

                  const groupData = getGroupData(activity);
                  console.log(122, round, groupData);

                  // true if we are looking at a first round or we have results
                  const canCreateGroups = (roundNumber === 1 && estimatedCompetitors > 0) || (roundNumber > 1 && previousRound.results.length > 0);

                  const handleGroupCountChange = (e) => {
                    console.log(e.currentTarget.value);
                    if (e.currentTarget.value > 0 && e.currentTarget.value < estimatedCompetitors) {
                      dispatch(updateGroupCount(activity.id, parseInt(e.currentTarget.value, 10)));
                    }
                  };

                  return (
                    <TableRow key={activity.id}>
                    <TableCell>{eventId}</TableCell>
                    <TableCell>{roundNumber}</TableCell>
                    <TableCell>{round.scrambleSetCount}</TableCell>
                    <TableCell>{estimatedCompetitors || '-'}</TableCell>
                    <TableCell>
                      <TextField
                        label="Groups"
                        type="number"
                        variant="outlined"
                        size="small"
                        value={groupData?.groups || round.scrambleSetCount}
                        onChange={handleGroupCountChange}
                        style={{ maxWidth: '5em'}}
                      />  
                    </TableCell>
                    <TableCell>{actualCompetitors || (roundNumber === 1 && estimatedCompetitors) || '-'}</TableCell>
                    <TableCell>{activity.childActivities.length}</TableCell>
                    <TableCell>{activity.childActivities.length === 0
                      ? (
                        <Button
                          variant="contained"
                          disabled={!canCreateGroups}
                          size="small"
                        >
                          Create Groups
                        </Button>
                      )
                      : activity.childActivities.length
                    }</TableCell>
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
