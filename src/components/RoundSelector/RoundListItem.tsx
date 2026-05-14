import {
  cumulativeGroupCount,
  findGroupActivitiesByRound,
  parseActivityCode,
} from '../../lib/domain/activities';
import { pluralize } from '../../lib/utils';
import { useAppSelector } from '../../store';
import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
  selectPersonsShouldBeInRound,
} from '../../store/selectors';
import '@cubing/icons';
import { Collapse, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { activityCodeToName, type Round } from '@wca/helpers';
import { useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { AppState } from '../../store/initialState';

interface RoundListItemProps {
  activityCode: string;
  round: Round;
  selected: boolean;
  nestingLevel?: number;
  in?: boolean;
}

function RoundListItem({
  activityCode,
  round,
  selected,
  nestingLevel = 0,
  ...props
}: RoundListItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const wcif = useAppSelector((state) => state.wcif);
  const realGroups = wcif ? findGroupActivitiesByRound(wcif, activityCode) : [];

  const { eventId } = parseActivityCode(activityCode);

  const personsSelector = useAppSelector(selectPersonsShouldBeInRound);
  const personsShouldBeInRoundCount = personsSelector(round).length;

  const personsAssignedCount = useAppSelector((state: AppState) =>
    selectPersonsAssignedForRound(state, round.id)
  ).length;

  const personsAssignedWithCompetitorAssignmentCount = useAppSelector((state: AppState) =>
    selectPersonsHavingCompetitorAssignmentsForRound(state, round.id)
  ).length;

  const _cumulativeGroupCount = cumulativeGroupCount(round);

  const realGroupsGeneratedText =
    realGroups?.length && `${pluralize(realGroups.length, 'group', 'groups')} generated`;
  const configuredGroupsText =
    _cumulativeGroupCount > 0
      ? `${pluralize(_cumulativeGroupCount, 'group', 'groups')} configured`
      : 'No Groups Configured';

  const textToShow = [
    realGroups?.length ? realGroupsGeneratedText : configuredGroupsText,
    `${pluralize(personsAssignedCount, 'person', 'people')} assigned of ${
      personsShouldBeInRoundCount || '???'
    }`,
    `${pluralize(
      personsAssignedWithCompetitorAssignmentCount,
      'person',
      'people'
    )} competitors assigned of ${personsShouldBeInRoundCount || '???'}`,
  ].join(' | ');

  useEffect(() => {
    if (selected && ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected]);

  return (
    <Collapse in={props.in}>
      <ListItemButton
        component={RouterLink}
        to={`/competitions/${wcif?.id}/events/${activityCode}`}
        selected={selected}
        sx={{ pl: 2 + nestingLevel * 4 }}
        ref={ref}>
        <ListItemAvatar>
          <span className={`cubing-icon event-${eventId}`} />
        </ListItemAvatar>
        <ListItemText primary={activityCodeToName(activityCode)} secondary={textToShow} />
      </ListItemButton>
    </Collapse>
  );
}

export default RoundListItem;
