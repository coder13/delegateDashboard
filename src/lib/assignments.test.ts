import {
  createGroupAssignment,
  isStaffAssignment,
  isCompetitorAssignment,
  isJudgeAssignment,
  hasAssignment,
  doesNotHaveAssignment,
  filterAssignments,
  hasStaffAssignment,
  hasJudgingAssignment,
  hasCompetitorAssignment,
  missingCompetitorAssignments,
  missingStaffAssignments,
  findCompetingAssignment,
} from './assignments';
import { Person, Assignment } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

describe('createGroupAssignment', () => {
  it('creates assignment with all fields', () => {
    const assignment = createGroupAssignment(123, 456, 'staff-judge', 5);
    expect(assignment).toEqual({
      registrantId: 123,
      assignment: {
        assignmentCode: 'staff-judge',
        activityId: 456,
        stationNumber: 5,
      },
    });
  });

  it('creates assignment with null station number by default', () => {
    const assignment = createGroupAssignment(123, 456, 'competitor');
    expect(assignment.assignment.stationNumber).toBeNull();
  });
});

describe('isStaffAssignment', () => {
  it('returns true for staff assignments', () => {
    expect(isStaffAssignment({ assignmentCode: 'staff-judge', activityId: 1 })).toBe(true);
    expect(isStaffAssignment({ assignmentCode: 'staff-scrambler', activityId: 1 })).toBe(true);
    expect(isStaffAssignment({ assignmentCode: 'staff-runner', activityId: 1 })).toBe(true);
  });

  it('returns false for non-staff assignments', () => {
    expect(isStaffAssignment({ assignmentCode: 'competitor', activityId: 1 })).toBe(false);
  });
});

describe('isCompetitorAssignment', () => {
  it('returns true for competitor assignment', () => {
    expect(isCompetitorAssignment({ assignmentCode: 'competitor', activityId: 1 })).toBe(true);
  });

  it('returns false for staff assignments', () => {
    expect(isCompetitorAssignment({ assignmentCode: 'staff-judge', activityId: 1 })).toBe(false);
  });
});

describe('isJudgeAssignment', () => {
  it('returns true for judge assignment', () => {
    expect(isJudgeAssignment({ assignmentCode: 'staff-judge', activityId: 1 })).toBe(true);
  });

  it('returns false for other assignments', () => {
    expect(isJudgeAssignment({ assignmentCode: 'staff-scrambler', activityId: 1 })).toBe(false);
    expect(isJudgeAssignment({ assignmentCode: 'competitor', activityId: 1 })).toBe(false);
  });
});

describe('hasAssignment', () => {
  const mockPerson: Person = {
    registrantId: 1,
    name: 'Test Person',
    wcaUserId: 1,
    wcaId: 'TEST2025',
    countryIso2: 'US',
    gender: 'm',
    birthdate: '2000-01-01',
    email: 'test@example.com',
    assignments: [
      { assignmentCode: 'competitor', activityId: 100 },
      { assignmentCode: 'staff-judge', activityId: 200 },
    ],
    avatar: null,
    roles: [],
    registration: null,
    personalBests: [],
  };

  it('checks person assignments when no filters provided', () => {
    const hasCompeting = hasAssignment(isCompetitorAssignment)({});
    expect(hasCompeting(mockPerson)).toBe(true);
  });

  it('filters by groupIds', () => {
    const hasCompetingInGroup100 = hasAssignment(isCompetitorAssignment)({ groupIds: [100] });
    expect(hasCompetingInGroup100(mockPerson)).toBe(true);

    const hasCompetingInGroup999 = hasAssignment(isCompetitorAssignment)({ groupIds: [999] });
    expect(hasCompetingInGroup999(mockPerson)).toBe(false);
  });

  it('checks in-progress assignments', () => {
    const inProgressAssignments = [
      createGroupAssignment(1, 300, 'staff-scrambler'),
      createGroupAssignment(2, 400, 'competitor'),
    ];

    const hasScrambler = hasAssignment((a) => a.assignmentCode === 'staff-scrambler')({
      assignments: inProgressAssignments,
    });

    expect(hasScrambler(mockPerson)).toBe(true);
  });

  it('returns false when person has no matching assignments', () => {
    const personWithoutStaff: Person = {
      ...mockPerson,
      assignments: [{ assignmentCode: 'competitor', activityId: 100 }],
    };

    const hasStaff = hasAssignment(isStaffAssignment)({});
    expect(hasStaff(personWithoutStaff)).toBe(false);
  });
});

describe('doesNotHaveAssignment', () => {
  const mockPerson: Person = {
    registrantId: 1,
    name: 'Test Person',
    wcaUserId: 1,
    wcaId: 'TEST2025',
    countryIso2: 'US',
    gender: 'm',
    birthdate: '2000-01-01',
    email: 'test@example.com',
    assignments: [{ assignmentCode: 'competitor', activityId: 100 }],
    avatar: null,
    roles: [],
    registration: null,
    personalBests: [],
  };

  it('returns true when person does not have assignment', () => {
    const missingStaff = doesNotHaveAssignment(isStaffAssignment)({});
    expect(missingStaff(mockPerson)).toBe(true);
  });

  it('returns false when person has assignment', () => {
    const missingCompetitor = doesNotHaveAssignment(isCompetitorAssignment)({});
    expect(missingCompetitor(mockPerson)).toBe(false);
  });
});

describe('filterAssignments', () => {
  const mockPerson: Person = {
    registrantId: 1,
    name: 'Test Person',
    wcaUserId: 1,
    wcaId: 'TEST2025',
    countryIso2: 'US',
    gender: 'm',
    birthdate: '2000-01-01',
    email: 'test@example.com',
    assignments: [
      { assignmentCode: 'competitor', activityId: 100 },
      { assignmentCode: 'staff-judge', activityId: 200 },
      { assignmentCode: 'staff-scrambler', activityId: 300 },
    ],
    avatar: null,
    roles: [],
    registration: null,
    personalBests: [],
  };

  it('filters person assignments by test', () => {
    const staffAssignments = filterAssignments(isStaffAssignment)({})(mockPerson);
    expect(staffAssignments).toHaveLength(2);
    expect(staffAssignments.every(isStaffAssignment)).toBe(true);
  });

  it('filters by groupIds', () => {
    const assignmentsInGroup100 = filterAssignments(isCompetitorAssignment)({
      groupIds: [100],
    })(mockPerson);
    expect(assignmentsInGroup100).toHaveLength(1);
    expect(assignmentsInGroup100[0].activityId).toBe(100);
  });

  it('includes in-progress assignments', () => {
    const inProgressAssignments = [
      createGroupAssignment(1, 400, 'staff-judge'),
      createGroupAssignment(1, 500, 'competitor'),
    ];

    const allJudging = filterAssignments(isJudgeAssignment)({
      assignments: inProgressAssignments,
    })(mockPerson);

    // Only one from in-progress assignments (the filterAssignments doesn't combine with person.assignments when assignments param is provided)
    expect(allJudging).toHaveLength(1);
    expect(allJudging[0].activityId).toBe(400);
  });

  it('returns empty array when person has no assignments', () => {
    const personWithoutAssignments: Person = {
      ...mockPerson,
      assignments: [],
    };

    const filtered = filterAssignments(isCompetitorAssignment)({})(personWithoutAssignments);
    expect(filtered).toEqual([]);
  });
});

describe('helper functions', () => {
  const mockPersonWithStaff: Person = {
    registrantId: 1,
    name: 'Test Person',
    wcaUserId: 1,
    wcaId: 'TEST2025',
    countryIso2: 'US',
    gender: 'm',
    birthdate: '2000-01-01',
    email: 'test@example.com',
    assignments: [
      { assignmentCode: 'competitor', activityId: 100 },
      { assignmentCode: 'staff-judge', activityId: 200 },
    ],
    avatar: null,
    roles: [],
    registration: null,
    personalBests: [],
  };

  const mockPersonCompetitorOnly: Person = {
    ...mockPersonWithStaff,
    registrantId: 2,
    assignments: [{ assignmentCode: 'competitor', activityId: 100 }],
  };

  describe('hasStaffAssignment', () => {
    it('returns true when person has staff assignment', () => {
      expect(hasStaffAssignment({})(mockPersonWithStaff)).toBe(true);
    });

    it('returns false when person has no staff assignment', () => {
      expect(hasStaffAssignment({})(mockPersonCompetitorOnly)).toBe(false);
    });
  });

  describe('hasJudgingAssignment', () => {
    it('returns true when person has judging assignment', () => {
      expect(hasJudgingAssignment({})(mockPersonWithStaff)).toBe(true);
    });

    it('returns false when person has no judging assignment', () => {
      expect(hasJudgingAssignment({})(mockPersonCompetitorOnly)).toBe(false);
    });
  });

  describe('hasCompetitorAssignment', () => {
    it('returns true when person has competitor assignment', () => {
      expect(hasCompetitorAssignment({})(mockPersonWithStaff)).toBe(true);
      expect(hasCompetitorAssignment({})(mockPersonCompetitorOnly)).toBe(true);
    });
  });

  describe('missingCompetitorAssignments', () => {
    it('returns false when person has competitor assignment', () => {
      expect(missingCompetitorAssignments({})(mockPersonWithStaff)).toBe(false);
    });

    it('returns true when person lacks competitor assignment', () => {
      const personNoCompeting: Person = {
        ...mockPersonWithStaff,
        assignments: [{ assignmentCode: 'staff-judge', activityId: 200 }],
      };
      expect(missingCompetitorAssignments({})(personNoCompeting)).toBe(true);
    });
  });

  describe('missingStaffAssignments', () => {
    it('returns false when person has staff assignment', () => {
      expect(missingStaffAssignments({})(mockPersonWithStaff)).toBe(false);
    });

    it('returns true when person lacks staff assignment', () => {
      expect(missingStaffAssignments({})(mockPersonCompetitorOnly)).toBe(true);
    });
  });

  describe('findCompetingAssignment', () => {
    it('finds all competing assignments', () => {
      const assignments = findCompetingAssignment({})(mockPersonWithStaff);
      expect(assignments).toHaveLength(1);
      expect(assignments[0].assignmentCode).toBe('competitor');
    });

    it('returns empty array when no competing assignments', () => {
      const personNoCompeting: Person = {
        ...mockPersonWithStaff,
        assignments: [{ assignmentCode: 'staff-judge', activityId: 200 }],
      };
      expect(findCompetingAssignment({})(personNoCompeting)).toEqual([]);
    });
  });
});
