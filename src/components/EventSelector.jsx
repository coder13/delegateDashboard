import clsx from 'clsx';
import PropTypes from 'prop-types';
import { IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';

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

/**
 * Shows a list of events and allows the user to checkbox select the events
 *
 * @component
 */
const EventSelector = ({ eventIds, value, onChange, styleOverrides }) => {
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

EventSelector.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.oneOf([
      '333',
      '222',
      '444',
      '555',
      '666',
      '777',
      '333bf',
      '333fm',
      '333oh',
      'minx',
      'pyram',
      'clock',
      'skewb',
      'sq1',
      '444bf',
      '555bf',
      '333mbf',
    ])
  ),
};

export default EventSelector;
