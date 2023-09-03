export interface ClusterFilter {
  key: string;
  value: string | string[] | number | boolean;
}

export interface ClusterDefinition {
  base: string;
  filters: ClusterFilter[];
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
    activities: {
      base: 'all' | 'even' | 'odd';
      options?: any;
      activityIds?: number[];
    };
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
  defaults: Omit<Step, 'id'>;
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
