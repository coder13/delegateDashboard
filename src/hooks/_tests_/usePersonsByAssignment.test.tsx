import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { usePersonsByAssignment, type PersonWithAssignment } from '../usePersonsByAssignment';
import { buildPerson } from '../../store/reducers/_tests_/helpers';
import type { Assignment } from '@wca/helpers';

const AssignmentTester = ({
  persons,
  activityId,
}: {
  persons: PersonWithAssignment[];
  activityId: number;
}) => {
  const { competitors, staff, judges, scramblers, runners, other } = usePersonsByAssignment(
    persons,
    activityId
  );
  return (
    <div>
      <span data-testid="competitors">{competitors.length}</span>
      <span data-testid="staff">{staff.length}</span>
      <span data-testid="judges">{judges.length}</span>
      <span data-testid="scramblers">{scramblers.length}</span>
      <span data-testid="runners">{runners.length}</span>
      <span data-testid="other">{other.length}</span>
    </div>
  );
};

const buildAssignedPerson = (assignment: Assignment): PersonWithAssignment => ({
  ...buildPerson({ assignments: [assignment] }),
  assignedActivity: assignment,
});

describe('usePersonsByAssignment', () => {
  it('splits persons by assignment code for an activity', () => {
    const activityId = 12;
    const persons: PersonWithAssignment[] = [
      buildAssignedPerson({ activityId, assignmentCode: 'competitor', stationNumber: null }),
      buildAssignedPerson({ activityId, assignmentCode: 'staff-judge', stationNumber: null }),
      buildAssignedPerson({ activityId, assignmentCode: 'staff-scrambler', stationNumber: null }),
      buildAssignedPerson({ activityId, assignmentCode: 'staff-runner', stationNumber: null }),
      buildAssignedPerson({ activityId, assignmentCode: 'staff-mc', stationNumber: null }),
    ];

    const { getByTestId } = render(<AssignmentTester persons={persons} activityId={activityId} />);

    expect(getByTestId('competitors').textContent).toBe('1');
    expect(getByTestId('staff').textContent).toBe('4');
    expect(getByTestId('judges').textContent).toBe('1');
    expect(getByTestId('scramblers').textContent).toBe('1');
    expect(getByTestId('runners').textContent).toBe('1');
    expect(getByTestId('other').textContent).toBe('1');
  });
});
