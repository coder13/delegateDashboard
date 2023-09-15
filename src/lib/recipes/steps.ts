import { ActivityCode, Competition } from '@wca/helpers';
import { getActivities } from './activities';
import { getCluster } from './clusters';
import * as core from './steps/core';
import * as mca from './steps/mca';
import * as pnw from './steps/pnw';
import { AssignmentStep, StepDefinition } from './types';

export const StepLibrary: Record<string, StepDefinition> = {
  GenerateSingleGroup: core.GenerateSingleGroup,
  SpreadDelegates: core.SpreadDelegates,
  BalancedCompetitorAssignmentsForEveryone: core.BalancedCompetitorAssignmentsForEveryone,
  GenerateCompetitorAssignmentsForStaff: pnw.GenerateCompetitorAssignmentsForStaff,
  GenerateCompetitorAssignmentsForFirstTimers: pnw.GenerateCompetitorAssignmentsForFirstTimers,
  GenerateCompetitorAssignments: pnw.GenerateCompetitorAssignments,
  GenerateJudgeAssignmentsForCompetitors: pnw.GenerateJudgeAssignmentsForCompetitors,
  GenerateFirstTimersInSameGroup: mca.GenerateFirstTimersInSameGroup,
  SpreadStaffAcrossGroups: mca.SpreadStaffAcrossGroups,
};

export const Steps = Object.keys(StepLibrary).reduce((acc, key) => {
  return [...acc, StepLibrary[key]];
}, []);

export const fromDefaults = (
  step: StepDefinition,
  { wcif, activityCode }: { wcif: Competition; activityCode: ActivityCode }
) => ({
  id: step.id,
  ...step.defaults(wcif, activityCode),
});

export const hydrateStep = (wcif: Competition, roundId: string, step: AssignmentStep) => {
  return {
    ...step,
    props: {
      ...step.props,
      cluster: getCluster(wcif, step.props.cluster, roundId),
      activities: getActivities(wcif, step.props.activities, roundId),
    },
  };
};
