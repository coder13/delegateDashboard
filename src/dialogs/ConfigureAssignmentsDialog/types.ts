import type { ActivityWithParent } from '../../lib/domain/activities';
import type { PersonWithRegistrantId } from '../../lib/domain/persons';
import type { ResultValue } from '@wca/helpers';

export type CompetitorSort = 'speed' | 'name';

export interface PersonWithSeedResult extends PersonWithRegistrantId {
  seedResult: {
    ranking: number;
    average?: ResultValue;
    single?: ResultValue;
  };
}

export interface Room {
  id: number;
  name: string;
  activities: Array<{
    id: number;
    activityCode: string;
    childActivities?: Array<{
      id: number;
      activityCode: string;
    }>;
  }>;
}

export interface AssignmentsToolbarProps {
  paintingAssignmentCode: string;
  setPaintingAssignmentCode: (code: string) => void;
  competitorSort: CompetitorSort;
  setCompetitorSort: (sort: CompetitorSort) => void;
  showAllCompetitors: boolean;
  setShowAllCompetitors: (show: boolean) => void;
  showCompetitorsNotInRound: boolean;
  setShowCompetitorsNotInRound: (show: boolean) => void;
  onResetAssignments: () => void;
}

export interface AssignmentsTableHeaderProps {
  groupsRooms: Room[];
  groups: ActivityWithParent[];
  activityCode: string;
}
