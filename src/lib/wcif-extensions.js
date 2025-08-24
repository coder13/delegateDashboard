const DDNamespace = 'delegateDashboard';

const extensionId = (extensionName, namespace) => `${namespace}.${extensionName}`;

export const buildExtension = (extensionName, data, namespace = DDNamespace, specUrl) => ({
  id: extensionId(extensionName, namespace),
  specUrl:
    specUrl ??
    `https://github.com/coder13/delegateDashboard/blob/main/public/wcif-extensions/${extensionName}.json`,
  data,
});

/**
 * Updates the extension data inside the wcifEntity and returns it
 */
export const setExtensionData = (
  extensionName,
  wcifEntity,
  data,
  namespace = DDNamespace,
  specUrl
) => {
  const otherExtensions = wcifEntity.extensions.filter(
    (extension) => extension.id !== extensionId(extensionName, namespace)
  );
  return {
    ...wcifEntity,
    extensions: [...otherExtensions, buildExtension(extensionName, data, namespace, specUrl)],
  };
};

const defaultExtensionData = {
  groups: {
    spreadGroupsAcrossAllStages: true,
    groups: 1,
  },
};

export const getExtensionData = (extensionName, wcifEntity, namespace = DDNamespace) => {
  const extension = wcifEntity.extensions.find(
    (extension) => extension.id === extensionId(extensionName, namespace)
  );
  const defaultData = defaultExtensionData[extensionName];
  if (!defaultData) return extension && extension.data;
  return extension ? { ...defaultData, ...extension.data } : defaultData;
};

export const removeExtensionData = (extensionName, wcifEntity, namespace) => ({
  ...wcifEntity,
  extensions: wcifEntity.extensions.filter(
    (extension) => extension.id !== extensionId(extensionName, namespace)
  ),
});

export const getGroupData = (roundActivity) => {
  // Start off with using groupifier and then build own version. Makes compatible with groupifier.
  if (roundActivity.extensions.find(({ id }) => id === extensionId(activityConfig))) {
    const activityConfig = roundActivity.extensions.find(
      ({ id }) => id === extensionId(activityConfig)
    ).data;
    return {
      groups: activityConfig.groupCount,
      source: 'Delegate Dashboard',
    };
  } else if (roundActivity.extensions.find(({ id }) => id === 'groupifier.ActivityConfig')) {
    const activityConfig = roundActivity.extensions.find(
      ({ id }) => id === 'groupifier.ActivityConfig'
    ).data;
    return {
      groups: activityConfig.groups,
      source: 'Groupifier',
    };
  } else {
    // Tells app we need to create a group config
    return null;
  }
};
