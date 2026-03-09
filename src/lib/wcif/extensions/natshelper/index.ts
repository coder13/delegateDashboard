export {
  NATS_HELPER_NAMESPACE,
  getRoomExtensionData,
  setRoomExtensionData,
  getGroupExtensionData,
  setGroupExtensionData,
} from './natshelper';

export { isRoomExtensionData, isGroupExtensionData } from './guards';

export type { RoomExtensionData, GroupExtensionData } from './types';
