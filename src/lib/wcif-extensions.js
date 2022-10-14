import CompetingAssignmentsForDelegatesAndOrganizers from './groupAssignments/CompetingAssignmentsForDelegatesAndOrganizers';
import CompetingAssignmentsForEveryoneGenerator from './groupAssignments/CompetingAssignmentsForEveryone';
import CompetingAssignmentsForStaffGenerator from './groupAssignments/CompetingAssignmentsFromStaffAssignments';
import JudgeAssignmentsFromCompetingAssignments from './groupAssignments/JudgeAssignmentsFromCompetingAssignments';

const extensionId = (extensionName) => `delegateDashboard.${extensionName}`;

export const buildExtension = (extensionName, data) => ({
  id: extensionId(extensionName),
  specUrl: `https://github.com/coder13/delegateDashboard/blob/master/public/${extensionName}.json`, // TODO: Change to production URL
  data,
});

/**
 * Updates the extension data inside the wcifEntity and returns it
 */
export const setExtensionData = (extensionName, wcifEntity, data) => {
  const otherExtensions = wcifEntity.extensions.filter(
    (extension) => extension.id !== extensionId(extensionName)
  );
  return {
    ...wcifEntity,
    extensions: [...otherExtensions, buildExtension(extensionName, data)],
  };
};

const defaultExtensionData = {
  groups: {
    spreadGroupsAcrossAllStages: true,
    groups: 1,
  },
  groupGenerators: {
    generators: [
      {
        id: CompetingAssignmentsForStaffGenerator.id,
        enabled: true,
        options: {},
      },
      {
        id: CompetingAssignmentsForDelegatesAndOrganizers.id,
        enabled: true,
        options: {},
      },
      {
        id: CompetingAssignmentsForEveryoneGenerator.id,
        enabled: true,
        options: {},
      },
      {
        id: JudgeAssignmentsFromCompetingAssignments.id,
        enabled: true,
        options: {},
      },
    ],
  },
};

/**
 *
 * @param {*} extensionName
 * @param {Round | undefined} wcifEntity
 * @returns
 */
export const getExtensionData = (extensionName, wcifEntity) => {
  const extension = wcifEntity.extensions.find(
    (extension) => extension.id === extensionId(extensionName)
  );
  const defaultData = defaultExtensionData[extensionName];
  if (defaultData === null) return extension && extension.data;
  return extension ? { ...defaultData, ...extension.data } : defaultData;
};

export const removeExtensionData = (extensionName, wcifEntity) => ({
  ...wcifEntity,
  extensions: wcifEntity.extensions.filter(
    (extension) => extension.id !== extensionId(extensionName)
  ),
});

export const getGroupData = (roundActivity) => {
  // Start off with using groupifier and then build own version. Makes compatible with groupifier.
  if (roundActivity.extensions.find(({ id }) => id === 'delegateDashboard.activityConfig')) {
    const activityConfig = roundActivity.extensions.find(
      ({ id }) => id === 'delegateDashboard.activityConfig'
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
