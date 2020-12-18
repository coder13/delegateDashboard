const extensionId = extensionName => `delegateDashboard.${extensionName}`;

const buildExtension = (extensionName, data) => ({
  id: extensionId(extensionName),
  specUrl: `https://github.com/coder13/delegateDashboard/blob/master/public/${extensionName}.json`,
  data,
});

export const setExtensionData = (extensionName, wcifEntity, data) => {
  const otherExtensions = wcifEntity.extensions.filter(
    extension => extension.id !== extensionId(extensionName)
  );
  return {
    ...wcifEntity,
    extensions: [
      ...otherExtensions,
      buildExtension(extensionName, data),
    ],
  };
};

const defaultExtensionData = {};

export const getExtensionData = (extensionName, wcifEntity) => {
  const extension = wcifEntity.extensions.find(
    extension => extension.id === extensionId(extensionName)
  );
  const defaultData = defaultExtensionData[extensionName];
  if (defaultData === null) return extension && extension.data;
  return extension ? { ...defaultData, ...extension.data } : defaultData;
};

export const removeExtensionData = (extensionName, wcifEntity) => ({
  ...wcifEntity,
  extensions: wcifEntity.extensions.filter(
    extension => extension.id !== extensionId(extensionName)
  ),
});
