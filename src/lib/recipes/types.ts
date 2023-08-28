export interface StepDefinition {
  id: string;
  name: string;
  description: string;
  defaults: Omit<Step, 'id'>;
}

export interface ClusterFilter {
  key: string;
  value: string | number | boolean;
}

export interface ClusterDefinition {
  base: string;
  filters: ClusterFilter[];
}

export interface Step {
  id: string;
  generator: string;
  assignmentCode: string;
  cluster: ClusterDefinition;
  activities: {
    base: 'all' | 'even' | 'odd';
    options?: any;
    activityIds?: number[];
  };
  constraints: any[];
  options?: any;
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
