import { Competition } from '@wca/helpers';

export interface ClusterFilter {
  key: string;
  value: string | string[] | number | boolean;
}

export interface ClusterDefinition {
  base: string;
  filters: ClusterFilter[];
}

export interface ActivitiesDefinition {
  base: 'all' | 'even' | 'odd';
  options?: any;
  /**
   * Source of truth for activities. If provided, overrides `base` and `options`.
   */
  activityIds?: number[];
}

export interface ConstraintProps {
  constraint: string;
  weight: number;
  options?: any;
}

export interface AssignmentStep {
  id: string;
  type: 'assignments';
  props: {
    generator: string;
    assignmentCode: string;
    cluster: ClusterDefinition;
    activities: ActivitiesDefinition;
    constraints: ConstraintProps[];
    options?: any;
  };
}

export interface GroupStep {
  id: string;
  type: 'groups';
  props: {
    count: number;
  };
}

export type Step = GroupStep | AssignmentStep;

export interface StepDefinition {
  id: string;
  name: string;
  description: string;
  defaults: (wcif: Competition, roundId: string) => Omit<Step, 'id'>;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  defaultSteps: Array<StepDefinition>;
}

export interface RecipeConfig {
  id: string;
  name: string;
  description: string;
  steps: Array<Step>;
}
