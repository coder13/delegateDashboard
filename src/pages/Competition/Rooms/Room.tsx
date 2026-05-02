import { generateNextChildActivityId, parseActivityCode } from '../../../lib/domain/activities';
import { advancingCompetitors } from '../../../lib/domain/formulas';
import { acceptedRegistrations } from '../../../lib/domain/persons';
import { getGroupData } from '../../../lib/wcif/extensions';
import { getParticipationRuleset } from '../../../lib/wcif/rounds';
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
import { useConfirm } from 'material-ui-confirm';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { Activity, Room as WcifRoom } from '@wca/helpers';

// TODO: Redesign this data import flow
interface RoomProps {
  room: WcifRoom;
}

const Room = ({ room }: RoomProps) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const wcif = useAppSelector((state) => state.wcif);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  // const [configureStagesDialogOpen, setConfigureStagesDialogOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
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
    if (!wcif) {
      return {} as Record<string, number>;
    }
    const _eventRegistrationCounts: Record<string, number> = {};

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
  }, [wcif]);

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
            room.activities.map((activity: Activity) => ({
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

  if (!wcif) {
    return null;
  }

  return (
    <Card sx={{ border: room ? `2px solid ${room.color}` : 'none' }}>
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
                <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Round</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estimated Competitors</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Scramble Set Count</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estimated Groups</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estimated Max Group Size</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Competitors In Round</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Groups</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {room.activities
                .filter((activity) => activity.activityCode.split('-')[0] !== 'other')
                .map((activity: Activity) => {
                  const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
                  const event = wcif.events.find((i) => i.id === eventId);

                  if (!event || !roundNumber) {
                    return null;
                  }

                  const round = event.rounds[roundNumber - 1];
                  if (!round) {
                    return null;
                  }

                  const participationSource = getParticipationRuleset(round)?.participationSource;

                  const estimatedCompetitors =
                    participationSource?.type === 'registrations' || roundNumber === 1
                      ? (eventRegistrationCounts[eventId] ?? 0)
                      : participationSource?.type === 'linkedRounds' &&
                          (participationSource.resultCondition.type === 'percent' ||
                            participationSource.resultCondition.type === 'ranking')
                        ? advancingCompetitors(
                            {
                              type: participationSource.resultCondition.type,
                              level: participationSource.resultCondition.value,
                            },
                            eventRegistrationCounts[eventId] ?? 0
                          )
                        : 0;
                  const actualCompetitors = round.results.length;

                  const groupData = getGroupData(activity);

                  // true if we are looking at a first round or we have results for that round
                  const canCreateGroups =
                    ((roundNumber === 1 && estimatedCompetitors > 0) ||
                      (roundNumber > 1 && round.results.length > 0)) &&
                    groupData?.groups;

                  const handleGroupCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

                    const childActivities: Activity[] = [];
                    const startActivityId = generateNextChildActivityId(wcif);

                    for (let i = 0; i < groupData?.groups; i++) {
                      childActivities.push({
                        id: startActivityId + i,
                        name: `${activity.name}, Group ${i + 1}`,
                        activityCode: `${activity.activityCode}-g${i + 1}`,
                        startTime: activity.startTime, // spread across groups
                        endTime: activity.endTime,
                        childActivities: [],
                        extensions: [],
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
