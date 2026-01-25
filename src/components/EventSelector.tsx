import { IconButton } from '@mui/material';
import { type EventId } from '@wca/helpers';

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
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        ...styleOverrides?.root,
      }}>
      {eventIds.map((eventId) => (
        <IconButton
          key={eventId}
          className={`cubing-icon event-${eventId}`}
          style={{ fontSize: '1.5em' }}
          sx={(theme) => ({
            color:
              value.indexOf(eventId) > -1
                ? theme.palette.primary.main
                : theme.palette.text.disabled,
          })}
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
