import { Activity, Competition, Event } from '@wca/helpers';
import { findRoundActivitiesById, parseActivityCode } from '../activities';
import { InProgressAssignmment, missingCompetitorAssignments } from '../assignments';
import { createGroupAssignment } from '../groups';
import { byPROrResult, isOrganizerOrDelegate, personsShouldBeInRound } from '../persons';
import { byName } from '../utils';

export const generateGroupAssignmentsForDelegatesAndOrganizers = (
  wcif: Competition,
  roundActivityCode: string
) => {
  const { roundNumber } = parseActivityCode(roundActivityCode);
  const event = wcif.events?.find((e) => roundActivityCode.startsWith(e.id)) as Event;
  const round = event.rounds?.find((r) => r.id === roundActivityCode);

  if (!event || !round || !roundNumber) {
    // Likely shouldn't popup but need this check to make typescript happy
    return;
  }

  const roundActivities = findRoundActivitiesById(wcif, roundActivityCode);
  const groupsByRoom = roundActivities.map((ra) => ra.childActivities || []);
  const groups = groupsByRoom.flat();
  const groupIds = groups.map((g) => g.id);

  const uniqueGroupNumbers = Array.from(
    new Set<number>(
      groups.map((a) => parseActivityCode(a.activityCode)?.groupNumber).filter(Boolean) as number[]
    )
  ).sort((a, b) => b - a);

  const persons = personsShouldBeInRound(round)(wcif.persons)
    .filter(missingCompetitorAssignments({ groupIds }))
    .filter(isOrganizerOrDelegate)
    .sort(byName)
    .sort(byPROrResult(event, roundNumber));

  if (!persons.length) {
    return;
  }

  return (): InProgressAssignmment[] => {
    // eslint-disable-next-line
    console.log(
      `Generating Competing assignments for ${persons.length} organizers & delegates`,
      persons
    );

    return Array(Math.min(uniqueGroupNumbers.length, persons.length))
      .fill(undefined)
      .map((_, index) => {
        // By definition, there should always be a person and group number

        const person = persons[index];
        const groupNumber = uniqueGroupNumbers[index];
        const group = groups.find(
          (g) => parseActivityCode(g.activityCode)?.groupNumber === groupNumber
        ) as Activity;

        return createGroupAssignment(person.registrantId, group.id, 'competitor');
      });
  };
};
