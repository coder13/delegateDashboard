import MaterialLink from '../../../components/MaterialLink';
import {
  activityCodeToName,
  findAllActivities,
  findAllRoundActivities,
  parseActivityCode,
  findRooms,
} from '../../../lib/domain/activities';
import { useAppSelector } from '../../../store';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import type { Activity, Assignment } from '@wca/helpers';
import { flatMap, groupBy } from 'lodash';
import { Fragment, useCallback, useMemo, useState } from 'react';

const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScramblerSchedule() {
  const wcif = useAppSelector((state) => state.wcif);

  const mapNames = (array: { registrantId: number; name: string }[]) =>
    array.length
      ? array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ registrantId, name }) => (
            <MaterialLink
              key={registrantId}
              to={`/competitions/${wcif?.id}/persons/${registrantId}`}>
              {name}
            </MaterialLink>
          ))
          .reduce((a, b) => (
            <>
              {a}, {b}
            </>
          ))
      : null;

  const _rooms = wcif ? findRooms(wcif) : [];

  const [roomSelector, setRoomSelector] = useState<number>(_rooms[0]?.id ?? 0);

  const _allRoundActivities = useMemo<Activity[]>(
    () =>
      wcif
        ? findAllRoundActivities(wcif)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .filter((activity) => activity.childActivities.length !== 0)
            .filter((activity) => activity.room.id === roomSelector)
        : [],
    [roomSelector, wcif]
  );
  const _allActivities = useMemo<Activity[]>(() => (wcif ? findAllActivities(wcif) : []), [wcif]);

  const getActivity = useCallback(
    (assignment: Assignment) => _allActivities.find(({ id }) => id === assignment.activityId),
    [_allActivities]
  );

  const assignments = useMemo(
    () =>
      flatMap(wcif?.persons, (person) =>
        (person.assignments || [])
          .filter((assignment) => assignment.assignmentCode === 'staff-scrambler')
          .map((assignment) => ({
            ...assignment,
            name: person.name,
            registrantId: person.registrantId,
            activity: getActivity(assignment),
          }))
      ),
    [getActivity, wcif?.persons]
  );

  const activitiesSplitAcrossDates = groupBy(
    _allRoundActivities.map((activity) => ({
      ...activity,
      date: DaysOfWeek[new Date(activity.startTime).getDay()],
    })),
    (x) => x.date
  );

  if (!wcif) {
    return null;
  }

  return (
    <div>
      <FormControl>
        <FormLabel>Room</FormLabel>
        <RadioGroup
          value={roomSelector}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRoomSelector(parseInt(e.target.value, 10))
          }>
          {_rooms.map((room) => (
            <FormControlLabel key={room.id} value={room.id} control={<Radio />} label={room.name} />
          ))}
        </RadioGroup>
      </FormControl>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Event</TableCell>
            <TableCell>Scramblers</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(activitiesSplitAcrossDates).map(([date, activities]) => (
            <Fragment key={date}>
              <TableRow>
                <TableCell colSpan={2} style={{ textAlign: 'center' }}>
                  {date}
                </TableCell>
              </TableRow>
              {activities.map((activity) => (
                <Fragment key={activity.id}>
                  <TableRow>
                    <TableCell colSpan={2}>
                      {activity.activityCode && (
                        <span
                          className={`cubing-icon event-${
                            parseActivityCode(activity.activityCode).eventId
                          }`}
                          style={{ marginRight: '0.5em' }}
                        />
                      )}
                      {activityCodeToName(activity.activityCode)}
                    </TableCell>
                  </TableRow>
                  {activity.childActivities.map((childActivity) => (
                    <TableRow key={childActivity.id}>
                      <TableCell>
                        {activityCodeToName(childActivity.activityCode).split(', ')[2]}
                      </TableCell>
                      <TableCell>
                        {mapNames(assignments.filter((a) => a.activityId === childActivity.id))}
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
