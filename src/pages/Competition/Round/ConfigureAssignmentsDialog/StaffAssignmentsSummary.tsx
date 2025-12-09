import Assignments from '../../../../config/assignments';
import { memo } from 'react';

interface StaffAssignmentsSummaryProps {
  totalStaffAssignments: Record<string, number>;
}

const StaffAssignmentsSummary = memo(({ totalStaffAssignments }: StaffAssignmentsSummaryProps) => {
  return (
    <>
      {Object.keys(totalStaffAssignments)
        .filter((key) => Assignments.find((a) => a.id === key))
        .sort((a, b) => a.localeCompare(b))
        .map((key, index, arry) => {
          const assignment = Assignments.find((a) => a.id === key);
          if (!assignment) return '';

          return (
            <div
              key={key}
              style={{
                marginRight: '0.25em',
                display: 'inline',
              }}>
              <b>{(totalStaffAssignments as Record<string, number>)[key]}</b>
              {assignment.letter}
              {index < arry.length - 1 ? ', ' : ''}
            </div>
          );
        })}
    </>
  );
});

StaffAssignmentsSummary.displayName = 'StaffAssignmentsSummary';

export default StaffAssignmentsSummary;
