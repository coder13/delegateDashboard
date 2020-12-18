import React from 'react';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader'
import Table from '@material-ui/core/Table';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert'
import ConfigureStagesDialog from './ConfigureStagesDialog';
import { parseActivityCode } from '../../../lib/activities';
import { advancingCompetitors } from '../../../lib/formulas';
import { updateStages } from '../../../store/actions';

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

const Room = ({ wcif, venue, room }) => {
  const dispatch = useDispatch();
  const classes = useStyles({ room });
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

  console.log(eventRegistrationCounts);

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

const mapStateToProps = (state) => ({
  wcif: state.wcif,
});

export default connect(mapStateToProps)(Room);
