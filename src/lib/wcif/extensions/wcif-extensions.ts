import { type Activity } from '@wca/helpers';
import { type Extension } from '@wca/helpers/lib/models/extension';

const DDNamespace = 'delegateDashboard';

interface WcifEntity {
  extensions: Extension[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface GroupsExtensionData {
  spreadGroupsAcrossAllStages?: boolean;
  groups?: number | Record<number, number>;
}

interface DefaultExtensionData {
  groups: GroupsExtensionData;
}

interface GroupData {
  groups: number;
  source: string;
}

const extensionId = (extensionName: string, namespace: string): string =>
  `${namespace}.${extensionName}`;

export const buildExtension = (
  extensionName: string,
  data: object,
  namespace: string = DDNamespace,
  specUrl?: string
): Extension => ({
  id: extensionId(extensionName, namespace),
  specUrl:
    specUrl ??
    `https://github.com/coder13/delegateDashboard/blob/main/public/wcif-extensions/${extensionName}.json`,
  data,
});

/**
 * Updates the extension data inside the wcifEntity and returns it
 */
export const setExtensionData = <T extends WcifEntity, U extends object>(
  extensionName: string,
  wcifEntity: T,
  data: U,
  namespace: string = DDNamespace,
  specUrl?: string
): T => {
  const otherExtensions = wcifEntity.extensions.filter(
    (extension) => extension.id !== extensionId(extensionName, namespace)
  );
  return {
    ...wcifEntity,
    extensions: [...otherExtensions, buildExtension(extensionName, data, namespace, specUrl)],
  };
};

const defaultExtensionData: DefaultExtensionData = {
  groups: {
    spreadGroupsAcrossAllStages: true,
    groups: 1,
  },
};

export const getExtensionData = <T = object>(
  extensionName: string,
  wcifEntity: WcifEntity,
  namespace: string = DDNamespace
): T | undefined => {
  const extension = wcifEntity.extensions.find(
    (extension) => extension.id === extensionId(extensionName, namespace)
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultData = (defaultExtensionData as any)[extensionName];
  if (!defaultData) return extension?.data as T | undefined;
  return extension ? { ...defaultData, ...extension.data } : defaultData;
};

export const removeExtensionData = <T extends WcifEntity>(
  extensionName: string,
  wcifEntity: T,
  namespace: string
): T => ({
  ...wcifEntity,
  extensions: wcifEntity.extensions.filter(
    (extension) => extension.id !== extensionId(extensionName, namespace)
  ),
});

export const getGroupData = (roundActivity: Activity): GroupData | null => {
  // Start off with using groupifier and then build own version. Makes compatible with groupifier.
  const ddExtension = roundActivity.extensions.find(
    ({ id }) => id === extensionId('groups', DDNamespace)
  );

  if (ddExtension) {
    const activityConfig = ddExtension.data as { groupCount?: number };
    return {
      groups: activityConfig.groupCount ?? 1,
      source: 'Delegate Dashboard',
    };
  }

  const groupifierExtension = roundActivity.extensions.find(
    ({ id }) => id === 'groupifier.ActivityConfig'
  );

  if (groupifierExtension) {
    const activityConfig = groupifierExtension.data as { groups?: number };
    return {
      groups: activityConfig.groups ?? 1,
      source: 'Groupifier',
    };
  }

  // Tells app we need to create a group config
  return null;
};
