import type { Extension, WcifEntity } from '../types';
import { isRoomExtensionData, isGroupExtensionData } from './guards';
import type { RoomExtensionData, GroupExtensionData } from './types';

export const NATS_HELPER_NAMESPACE = 'org.cubingusa.natshelper.v1';

/**
 * Get the full extension ID for a Nats Helper extension
 */
function getExtensionId(extensionName: string): string {
  return `${NATS_HELPER_NAMESPACE}.${extensionName}`;
}

/**
 * Get room extension data from a WCIF entity
 */
export function getRoomExtensionData(wcifEntity: WcifEntity): RoomExtensionData | undefined {
  const extension = wcifEntity.extensions.find((ext) => ext.id === getExtensionId('Room'));

  if (!extension) {
    return undefined;
  }

  if (!isRoomExtensionData(extension.data)) {
    console.warn('Invalid Nats Helper Room extension data:', extension.data);
    return undefined;
  }

  return extension.data;
}

/**
 * Set room extension data on a WCIF entity
 */
export function setRoomExtensionData<T extends WcifEntity>(
  wcifEntity: T,
  data: RoomExtensionData
): T {
  const extensionId = getExtensionId('Room');
  const otherExtensions = wcifEntity.extensions.filter((ext) => ext.id !== extensionId);

  const newExtension: Extension = {
    id: extensionId,
    specUrl: 'https://github.com/cubingusa/natshelper',
    data,
  };

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, newExtension],
  };
}

/**
 * Get group extension data from a WCIF entity
 */
export function getGroupExtensionData<T extends WcifEntity>(
  wcifEntity: T
): GroupExtensionData | undefined {
  const extension = wcifEntity.extensions.find((ext) => ext.id === getExtensionId('Group'));

  if (!extension) {
    return undefined;
  }

  if (!isGroupExtensionData(extension.data)) {
    console.warn('Invalid Nats Helper Group extension data:', extension.data);
    return undefined;
  }

  return extension.data;
}

/**
 * Set group extension data on a WCIF entity
 */
export function setGroupExtensionData<T extends WcifEntity>(
  wcifEntity: T,
  data: GroupExtensionData
): T {
  const extensionId = getExtensionId('Group');
  const otherExtensions = wcifEntity.extensions.filter((ext) => ext.id !== extensionId);

  const newExtension: Extension = {
    id: extensionId,
    specUrl: 'https://github.com/cubingusa/natshelper',
    data,
  };

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, newExtension],
  };
}
