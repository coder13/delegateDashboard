import '@cubing/icons';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Collapse } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { activityById, groupActivitiesByRound, parseActivityCode } from '../../../lib/activities';
import { eventNameById } from '../../../lib/events';
import { personsShouldBeInRound } from '../../../lib/persons';
import { pluralize } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';

function RoundListItem({ round, selected, ...props }) {
  const ref = useRef();
  const wcif = useSelector((state) => state.wcif);
  const realGroups = groupActivitiesByRound(wcif, round.id);
  const groupsData = getExtensionData('groups', round);

  const { eventId, roundNumber } = parseActivityCode(round.id);

  const _personsShouldBeInRound = personsShouldBeInRound(wcif, round)?.length;

  const personsAssigned = wcif.persons.filter((p) =>
    p.assignments.find((a) => {
      const activity = activityById(wcif, a.activityId);
      return (
        activity.activityCode.split('-')[0] === round.id.split('-')[0] &&
        activity.activityCode.split('-')[1] === round.id.split('-')[1]
      );
    })
  ).length;

  const realGroupsGeneratedText =
    realGroups?.length && `${pluralize(realGroups.length, 'group', 'groups')} generated`;
  const configuredGroupsText = groupsData?.groups
    ? `${pluralize(groupsData?.groups, 'group', 'groups')} configured`
    : 'No Groups Configured';

  const textToShow = [
    realGroups?.length ? realGroupsGeneratedText : configuredGroupsText,
    `${pluralize(personsAssigned, 'person', 'people')} assigned of ${
      _personsShouldBeInRound || '???'
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
