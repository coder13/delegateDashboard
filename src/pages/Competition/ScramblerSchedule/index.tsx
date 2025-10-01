import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../../store/initialState';
import { Person } from '@wca/helpers';
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
import MaterialLink from '../../../components/MaterialLink';
import {
  activityCodeToName,
  findAllActivities,
  findAllRoundActivities,
  parseActivityCode,
  findRooms,
} from '../../../lib/activities';
import { flatMap, groupBy } from '../../../lib/utils';

const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScramblerSchedule() {
  const wcif = useSelector((state: AppState) => state.wcif);

  if (!wcif) return null;

  const mapNames = (array: Person[]) =>
    array.length
      ? array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ registrantId, name }) => (
            <MaterialLink
              key={registrantId}
              to={`/competitions/${wcif.id}/persons/${registrantId}`}>
              {name}
            </MaterialLink>
          ))
          .reduce((a: any, b: any) => (
            <>
              {a}, {b}
            </>
          ))
      : null;

  const _rooms = findRooms(wcif);

  const [roomSelector, setRoomSelector] = useState<number>(_rooms[0].id);

  const _allRoundActivities = useMemo(
    () =>
      findAllRoundActivities(wcif)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .filter((activity) => activity.childActivities.length !== 0)
        .filter((activity) => activity.room.id === roomSelector),
    [roomSelector, wcif]
  );
  const _allActivities = useMemo(() => findAllActivities(wcif), [wcif]);

  const getActivity = useCallback(
    (assignment: any) => _allActivities.find(({ id }) => id === assignment.activityId),
    [_allActivities]
  );

  const assignments = useMemo(
    () =>
      flatMap(wcif.persons, (person: Person) =>
        (person.assignments || [])
          .filter((assignment) => assignment.assignmentCode === 'staff-scrambler')
          .map((assignment) => ({
            ...assignment,
            name: person.name,
            registrantId: person.registrantId,
            activity: getActivity(assignment),
          }))
      ),
    [getActivity, wcif.persons]
  );

  const activitiesSplitAcrossDates: any = groupBy(
    _allRoundActivities.map((activity) => ({
      ...activity,
      date: DaysOfWeek[new Date(activity.startTime).getDay()],
    })),
    (x: any) => x.date
  );

  return (
    <div>
      <FormControl>
        <FormLabel>Room</FormLabel>
        <RadioGroup value={roomSelector} onChange={(e) => setRoomSelector(Number(e.target.value))}>
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
          {Object.entries(activitiesSplitAcrossDates).map(([date, activities]: [string, any]) => (
            <>
              <TableRow key={date}>
                <TableCell colSpan={2} style={{ textAlign: 'center' }}>
                  {date}
                </TableCell>
              </TableRow>
              {(activities as any[]).map((activity: any) => (
                <>
                  <TableRow key={activity.id}>
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
                  {activity.childActivities.map((childActivity: any) => (
                    <TableRow key={childActivity.id}>
                      <TableCell>
                        {activityCodeToName(childActivity.activityCode).split(', ')[2]}
                      </TableCell>
                      <TableCell>
                        {mapNames(assignments.filter((a: any) => a.activityId === childActivity.id))}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
