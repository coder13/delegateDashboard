interface Extension {
  id: string;
  specUrl: string;
  data: unknown;
}

interface WcifEntity {
  extensions: Extension[];
  [key: string]: unknown;
}

interface GroupsExtensionData {
  spreadGroupsAcrossAllStages: boolean;
  groups: number;
}

interface DefaultExtensionData {
  groups: GroupsExtensionData;
  [key: string]: unknown;
}

const DDNamespace = 'delegateDashboard';

const extensionId = (extensionName: string, namespace: string): string =>
  `${namespace}.${extensionName}`;

export const buildExtension = (
  extensionName: string,
  data: unknown,
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
export const setExtensionData = <T extends WcifEntity>(
  extensionName: string,
  wcifEntity: T,
  data: unknown,
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

export const getExtensionData = (
  extensionName: string,
  wcifEntity: WcifEntity,
  namespace: string = DDNamespace
): unknown => {
  const extension = wcifEntity.extensions.find(
    (extension) => extension.id === extensionId(extensionName, namespace)
  );
  const defaultData = defaultExtensionData[extensionName];
  if (!defaultData) return extension && extension.data;
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

interface GroupData {
  groups: number;
  source: string;
}

export const getGroupData = (roundActivity: WcifEntity): GroupData | null => {
  // Start off with using groupifier and then build own version. Makes compatible with groupifier.
  const activityConfigExt = roundActivity.extensions.find(
    ({ id }) => id === extensionId('activityConfig', DDNamespace)
  );
  
  if (activityConfigExt) {
    const activityConfig = activityConfigExt.data;
    return {
      groups: activityConfig.groupCount,
      source: 'Delegate Dashboard',
    };
  } else if (roundActivity.extensions.find(({ id }) => id === 'groupifier.ActivityConfig')) {
    const activityConfig = roundActivity.extensions.find(
      ({ id }) => id === 'groupifier.ActivityConfig'
    )!.data;
    return {
      groups: activityConfig.groups,
      source: 'Groupifier',
    };
  } else {
    // Tells app we need to create a group config
    return null;
  }
};
