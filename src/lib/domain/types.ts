import type { Activity, EventId, Room } from '@wca/helpers';

export interface ActivityCode {
  eventId: EventId;
  roundNumber?: number;
  groupNumber?: number;
  attemptNumber?: number;
}

export interface ActivityWithParent extends Activity {
  parent: ActivityWithRoom;
}

export interface ActivityWithRoom extends Activity {
  room: Room;
}
