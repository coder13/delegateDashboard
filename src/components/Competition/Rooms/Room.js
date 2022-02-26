import React from 'react';
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
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ConfigureStagesDialog from './ConfigureStagesDialog';
import { parseActivityCode } from '../../../lib/activities';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { advancingCompetitors } from '../../../lib/formulas';
import { updateStages, uploadCurrentWCIFChanges } from '../../../store/actions';

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
  const [configureStagesDialogOpen, setConfigureStagesDialogOpen] = React.useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openConfigureStagesDialog = () => {
    handleMenuClose();
    setConfigureStagesDialogOpen(true);
  };

  const handleSaveStages = (stages) => {
    dispatch(updateStages(venue.id, room.id, stages));
    dispatch(uploadCurrentWCIFChanges(['schedule']));
  }

  const eventRegistrationCounts = {};
  wcif.persons.forEach((person) => {
    if (!person.registration) {
      return;
    }

    person.registration.eventIds.forEach((eventId) => {
      if (eventRegistrationCounts[eventId]) {
        eventRegistrationCounts[eventId]++;
      } else {
        eventRegistrationCounts[eventId] = 1;
      }
    })
  });

  const { stages: currentStages } = getExtensionData('stages', room) || [];

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
        <MenuItem onClick={openConfigureStagesDialog}>Configure Stages</MenuItem>
      </Menu>
      <ConfigureStagesDialog
        open={configureStagesDialogOpen}
        handleClose={() => setConfigureStagesDialogOpen(false)}
        handleSaveStages={handleSaveStages}
        roomName={`${venue.name} / ${room.name}`}
        currentStages={currentStages}
      />
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
                <TableCell className={classes.bold}>Name</TableCell>
                <TableCell className={classes.bold}>Competitors</TableCell>
                <TableCell className={classes.bold}>Groups</TableCell>
                <TableCell className={classes.bold}>Competitors per group</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {room.activities
                .filter((activity) => activity.activityCode.split('-')[0] !== 'other')
                .map((activity) => {
                const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
                const event = wcif.events.find(i => i.id === eventId);
                const round = roundNumber > 1 ? event.rounds[roundNumber - 2] : {};
                const competitors = roundNumber === 1 ?
                      eventRegistrationCounts[eventId]
                    : advancingCompetitors(round.advancementCondition, eventRegistrationCounts[eventId]);
                console.log(advancingCompetitors);

                return (
                  <TableRow key={activity.id}>
                  <TableCell>{eventId}</TableCell>
                  <TableCell>{roundNumber}</TableCell>
                  <TableCell>{activity.name}</TableCell>
                  <TableCell>{competitors || 0}</TableCell>
                  <TableCell>{activity.childActivities.length}</TableCell>
                  <TableCell>{activity.childActivities.length && competitors / activity.childActivities.length}</TableCell>
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
