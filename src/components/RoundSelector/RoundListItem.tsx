import {
  cumulativeGroupCount,
  findGroupActivitiesByRound,
  parseActivityCode,
} from '../../lib/activities';
import { pluralize } from '../../lib/utils';
import { AppState } from '../../store/initialState';
import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
  selectPersonsShouldBeInRound,
} from '../../store/selectors';
import '@cubing/icons';
import { Collapse, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { Round } from '@wca/helpers';
import { activityCodeToName } from '@wca/helpers';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';

export interface RoundListItemProps {
  activityCode: string;
  round: Round;
  selected?: boolean;
  in?: boolean;
}

function RoundListItem({ activityCode, round, selected, ...props }: RoundListItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const wcif = useSelector((state: AppState) => state.wcif);
  const realGroups = wcif && findGroupActivitiesByRound(wcif, activityCode);

  const { eventId } = parseActivityCode(activityCode);

  const personsShouldBeInRoundCount = useSelector(
    (state: AppState) => selectPersonsShouldBeInRound(state)(round).length
  );

  const personsAssignedCount = useSelector(
    // @ts-expect-error: TODO: Figure out how to call selectors with parameters and types
    (state: AppState) => selectPersonsAssignedForRound(state, round.id).length
  );

  const personsAssignedWithCompetitorAssignmentCount = useSelector(
    // @ts-expect-error: TODO: Figure out how to call selectors with parameters and types
    (state: AppState) => selectPersonsHavingCompetitorAssignmentsForRound(state, round.id).length
  );

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
