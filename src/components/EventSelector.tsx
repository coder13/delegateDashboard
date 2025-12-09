import { IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { type EventId } from '@wca/helpers';
import clsx from 'clsx';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconButtonOn: {
    color: 'blue',
  },
  iconButtonOff: {
    color: 'gray',
  },
}));

interface EventSelectorProps {
  eventIds: EventId[];
  value: EventId[];
  onChange: (eventIds: EventId[]) => void;
  styleOverrides?: {
    root?: React.CSSProperties;
  };
}

/**
 * Shows a list of events and allows the user to checkbox select the events
 */
const EventSelector = ({ eventIds, value, onChange, styleOverrides }: EventSelectorProps) => {
  const classes = useStyles();
  return (
    <div className={classes.root} style={styleOverrides?.root}>
      {eventIds.map((eventId) => (
        <IconButton
          key={eventId}
          className={clsx(
            `cubing-icon event-${eventId}`,
            value.indexOf(eventId) > -1 ? classes.iconButtonOn : classes.iconButtonOff
          )}
          style={{ fontSize: '1.5em' }}
          onClick={() => {
            if (value.indexOf(eventId) > -1) {
              // toggle off
              onChange(value.filter((e) => e !== eventId));
            } else {
              // toggle on
              onChange([...value, eventId]);
            }
          }}
        />
      ))}
    </div>
  );
};

export default EventSelector;
