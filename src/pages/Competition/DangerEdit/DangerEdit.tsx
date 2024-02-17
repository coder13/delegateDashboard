import useDebounce from '../../../hooks/useDebounce';
import { useAppSelector } from '../../../store';
import { updateRawObj } from '../../../store/actions';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export default function DangerEdit() {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();

  const [personsData, setPersonsData] = useState<{ value: string; changed: boolean }>({
    value: JSON.stringify(wcif?.persons || {}, null, 2),
    changed: false,
  });

  const [eventsData, setEventsData] = useState<{ value: string; changed: boolean }>({
    value: JSON.stringify(wcif?.events || {}, null, 2),
    changed: false,
  });

  const [scheduleData, setScheduleData] = useState<{ value: string; changed: boolean }>({
    value: JSON.stringify(wcif?.schedule || {}, null, 2),
    changed: false,
  });

  useEffect(() => {
    setPersonsData({
      value: JSON.stringify(wcif?.persons || {}, null, 2),
      changed: false,
    });

    setEventsData({
      value: JSON.stringify(wcif?.events || {}, null, 2),
      changed: false,
    });

    setScheduleData({
      value: JSON.stringify(wcif?.schedule || {}, null, 2),
      changed: false,
    });
  }, [wcif]);

  const debouncedPersonsData = useDebounce(personsData.value, 3000);
  const debouncedEventsData = useDebounce(eventsData.value, 3000);
  const debouncedScheduleData = useDebounce(scheduleData.value, 3000);

  useEffect(() => {
    if (personsData.changed) {
      dispatch(updateRawObj('persons', JSON.parse(debouncedPersonsData)));
    }

    if (eventsData.changed) {
      dispatch(updateRawObj('events', JSON.parse(debouncedEventsData)));
    }

    if (scheduleData.changed) {
      dispatch(updateRawObj('schedule', JSON.parse(debouncedScheduleData)));
    }
  }, [debouncedPersonsData]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        overflow: 'hidden',
      }}>
      <h2
        style={{
          ...(personsData.changed && {
            color: 'red',
          }),
        }}>
        persons
      </h2>
      <CodeMirror
        value={personsData.value}
        extensions={[json()]}
        height="50vh"
        onChange={(value) => {
          setPersonsData({ value, changed: true });
        }}
      />

      <h2
        style={{
          ...(eventsData.changed && {
            color: 'red',
          }),
        }}>
        Events
      </h2>
      <CodeMirror
        value={eventsData.value}
        extensions={[json()]}
        height="50vh"
        onChange={(value) => {
          setEventsData({ value, changed: true });
        }}
      />

      <h2
        style={{
          ...(scheduleData.changed && {
            color: 'red',
          }),
        }}>
        Schedule
      </h2>
      <CodeMirror
        value={scheduleData.value}
        extensions={[json()]}
        height="50vh"
        onChange={(value) => {
          setScheduleData({ value, changed: true });
        }}
      />
    </div>
  );
}
