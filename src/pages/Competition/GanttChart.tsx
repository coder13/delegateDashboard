import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmojiPeople } from '@mui/icons-material';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import Assignments from '../../config/assignments';
import { findRooms } from '../../lib/activities';
import { acceptedRegistration } from '../../lib/persons';
import { byName, uniq } from '../../lib/utils';
import { useAppSelector } from '../../store';

export default function GanttChart() {
  const wcif = useAppSelector((state) => state.wcif);
  const persons = wcif?.persons.filter(acceptedRegistration).sort(byName) ?? [];
  const [selectedRounds, setSelectedRounds] = useState<string[]>([]);

  console.log(18, selectedRounds);

  const roundActivities =
    wcif &&
    findRooms(wcif)
      .flatMap((room) => room.activities)
      .filter((activity) => activity.childActivities.length > 0)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const groups = roundActivities?.flatMap((roundActivity) => roundActivity.childActivities);

  const roundActivityCodes = useMemo(
    () =>
      [...new Set(roundActivities?.map((activity) => activity.activityCode) ?? [])].filter(
        (activityCode) => !activityCode.startsWith('other')
      ),
    [wcif]
  );

  useEffect(() => {
    setSelectedRounds(
      roundActivityCodes.filter((roundActivityCode) => {
        return (
          persons.filter((person) =>
            person?.assignments?.some((assignment) => {
              const group = groups?.find((g) => g.id === assignment.activityId);
              return group?.activityCode.startsWith(roundActivityCode);
            })
          ).length > 0
        );
      })
    );
  }, [roundActivityCodes]);

  const toggleRound = useCallback(
    (roundId) => () => {
      if (selectedRounds.includes(roundId)) {
        setSelectedRounds(selectedRounds.filter((round) => round !== roundId));
      } else {
        setSelectedRounds([...selectedRounds, roundId]);
      }
    },
    [selectedRounds]
  );

  const groupActivityCodes: string[] = useMemo(() => {
    return uniq(
      roundActivities?.flatMap((ra) => ra.childActivities.map((ca) => ca.activityCode)) ?? []
    );
  }, []);

  return (
    <Grid container>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Rounds</FormLabel>
          <FormGroup aria-label="position" row>
            {roundActivityCodes.map((activityCode) => (
              <FormControlLabel
                key={activityCode}
                value={activityCode}
                control={
                  <Checkbox
                    checked={selectedRounds.includes(activityCode)}
                    onClick={toggleRound(activityCode)}
                  />
                }
                label={activityCode}
                labelPlacement="bottom"
              />
            ))}
          </FormGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TableContainer>
          <Table padding="checkbox" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell />
                {roundActivityCodes
                  .filter((rac) => selectedRounds.some((roundId) => rac === roundId))
                  .map((roundId) => (
                    <TableCell
                      key={roundId}
                      align="center"
                      colSpan={groupActivityCodes.filter((gac) => gac.startsWith(roundId)).length}>
                      {roundId}
                    </TableCell>
                  ))}
              </TableRow>
              <TableRow>
                <TableCell>Name</TableCell>
                {groupActivityCodes
                  .filter((gac) => selectedRounds.some((roundId) => gac.startsWith(roundId)))
                  .map((groupActivityCode) => (
                    <TableCell
                      key={groupActivityCode}
                      sx={{
                        textAlign: 'center',
                      }}>
                      {groupActivityCode.split('-')[2]}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {persons.map((person) => (
                <TableRow key={person.registrantId}>
                  <TableCell>
                    {person.name}{' '}
                    {!person.wcaId && (
                      <Tooltip title="newcomer">
                        <EmojiPeople />
                      </Tooltip>
                    )}
                  </TableCell>
                  {groupActivityCodes
                    .filter((gac) => selectedRounds.some((roundId) => gac.startsWith(roundId)))
                    .map((groupActivityCode) => {
                      const possibleAssignment = person.assignments?.find((assignment) => {
                        const group = groups?.find((g) => g.id === assignment.activityId);
                        return group?.activityCode === groupActivityCode;
                      });

                      if (!possibleAssignment) {
                        return (
                          <TableCell
                            sx={(theme) => ({
                              width: '1em',
                              height: '1em',
                              fontSize: '1em',
                              textAlign: 'center',
                              padding: 0,
                              borderLeft: `1px dashed ${theme.palette.divider}`,
                              borderRight: `1px dashed ${theme.palette.divider}`,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                            })}
                          />
                        );
                      }

                      const assignment = Assignments.find(
                        (a) => a.id === possibleAssignment.assignmentCode
                      );

                      return (
                        <TableCell
                          key={groupActivityCode}
                          sx={(theme) => ({
                            width: '1em',
                            height: '1em',
                            fontSize: '1em',
                            textAlign: 'center',
                            padding: 0,
                            backgroundColor: assignment?.color[200],
                            borderLeft: `1px dashed ${theme.palette.divider}`,
                            borderRight: `1px dashed ${theme.palette.divider}`,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          })}>
                          {assignment?.letter}
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
