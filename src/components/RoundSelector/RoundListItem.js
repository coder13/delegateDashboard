import '@cubing/icons';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Collapse } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { groupActivitiesByRound, parseActivityCode } from '../../lib/activities';
import { eventNameById } from '../../lib/events';
import { pluralize } from '../../lib/utils';
import { getExtensionData } from '../../lib/wcif-extensions';
import { selectPersonsAssignedForRound, selectPersonsShouldBeInRound } from '../../store/selectors';

function RoundListItem({ round, selected, ...props }) {
  const ref = useRef();
  const wcif = useSelector((state) => state.wcif);
  const realGroups = groupActivitiesByRound(wcif, round.id);
  const groupsData = getExtensionData('groups', round);

  const { eventId, roundNumber } = parseActivityCode(round.id);

  const personsShouldBeInRoundCount = useSelector(
    (state) => selectPersonsShouldBeInRound(state)(round).length
  );

  const personsAssignedCount = useSelector(
    (state) => selectPersonsAssignedForRound(state, round.id).length
  );

  const realGroupsGeneratedText =
    realGroups?.length && `${pluralize(realGroups.length, 'group', 'groups')} generated`;
  const configuredGroupsText = groupsData?.groups
    ? `${pluralize(groupsData?.groups, 'group', 'groups')} configured`
    : 'No Groups Configured';

  const textToShow = [
    realGroups?.length ? realGroupsGeneratedText : configuredGroupsText,
    `${pluralize(personsAssignedCount, 'person', 'people')} assigned of ${
      personsShouldBeInRoundCount || '???'
    }`,
  ];

  useEffect(() => {
    if (selected && ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected]);

  return (
    <Collapse in={props.in}>
      <ListItem
        button
        component={RouterLink}
        to={`/competitions/${wcif.id}/events/${round.id}`}
        selected={selected}
        ref={ref}>
        <ListItemAvatar>
          <span className={`cubing-icon event-${eventId}`} />
        </ListItemAvatar>
        <ListItemText
          primary={`${eventNameById(eventId)} Round ${roundNumber}`}
          secondary={textToShow.join(' | ')}
        />
      </ListItem>
    </Collapse>
  );
}

export default RoundListItem;
