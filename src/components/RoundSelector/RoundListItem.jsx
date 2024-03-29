import {
  cumulativeGroupCount,
  findGroupActivitiesByRound,
  parseActivityCode,
} from '../../lib/activities';
import { pluralize } from '../../lib/utils';
import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
  selectPersonsShouldBeInRound,
} from '../../store/selectors';
import '@cubing/icons';
import { Collapse, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { activityCodeToName } from '@wca/helpers';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';

function RoundListItem({ activityCode, round, selected, ...props }) {
  const ref = useRef();
  const wcif = useSelector((state) => state.wcif);
  const realGroups = findGroupActivitiesByRound(wcif, activityCode);

  const { eventId } = parseActivityCode(activityCode);

  const personsShouldBeInRoundCount = useSelector(
    (state) => selectPersonsShouldBeInRound(state)(round).length
  );

  const personsAssignedCount = useSelector(
    (state) => selectPersonsAssignedForRound(state, round.id).length
  );

  const personsAssignedWithCompetitorAssignmentCount = useSelector(
    (state) => selectPersonsHavingCompetitorAssignmentsForRound(state, round.id).length
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
        to={`/competitions/${wcif.id}/events/${activityCode}`}
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
