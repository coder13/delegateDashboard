import { RoundActionButtons } from '../RoundActionButtons';
import { renderWithProviders } from '../../test-utils';
import { describe, expect, it, vi } from 'vitest';

const baseProps = {
  groups: [],
  personsAssignedToCompete: [],
  personsShouldBeInRound: [],
  activityCode: '333fm-r1',
  onConfigureAssignments: vi.fn(),
  onGenerateAssignments: vi.fn(),
  onAssignToRoundAttempt: vi.fn(),
  onResetAttemptAssignments: vi.fn(),
  onConfigureStationNumbers: vi.fn(),
  onConfigureGroups: vi.fn(),
  onResetAll: vi.fn(),
  onResetNonScrambling: vi.fn(),
  onConfigureGroupCounts: vi.fn(),
};

describe('RoundActionButtons', () => {
  it('shows distributed round-level attempt actions', () => {
    const { getByText, queryByText } = renderWithProviders(
      <RoundActionButtons {...baseProps} isDistributedAttemptRoundLevel />
    );

    expect(getByText('Configure Round Attempt Assignments')).toBeInTheDocument();
    expect(getByText('Assign Competitors to Round (All Attempts)')).toBeInTheDocument();
    expect(getByText('Clear Round Attempt Assignments')).toBeInTheDocument();
    expect(queryByText('Configure Group Counts')).not.toBeInTheDocument();
  });
});
