import { blue, deepPurple, green, grey, pink, purple, red, yellow } from '@mui/material/colors';

const Assignments = [
  {
    id: 'competitor',
    name: 'Competitor',
    color: green,
    key: 'c',
    letter: 'C',
  },
  {
    id: 'staff-scrambler',
    name: 'Scrambler',
    color: yellow,
    key: 's',
    letter: 'S',
  },
  {
    id: 'staff-runner',
    name: 'Runner',
    color: red,
    key: 'r',
    letter: 'R',
  },
  {
    id: 'staff-judge',
    name: 'Judge',
    color: blue,
    key: 'j',
    letter: 'J',
  },
  {
    id: 'staff-delegate',
    name: 'Delegate',
    color: purple,
    key: 'd',
    letter: 'D',
  },
  {
    id: 'staff-stage-lead',
    name: 'Stage Lead',
    color: deepPurple,
    key: 'l',
    letter: 'L',
  },
  {
    id: 'staff-announcer',
    name: 'Announcer',
    color: pink,
    key: 'a',
    letter: 'A',
  },
  {
    id: 'staff-dataentry',
    name: 'Data Entry',
    color: grey,
    key: 'e',
    letter: 'DA',
  },
  {
    id: 'staff-other',
    name: 'Other',
    color: grey,
    key: 'o',
    letter: 'O',
  },
];

export const AssignmentsMap = Assignments.reduce(
  (map, assignment) => ({
    ...map,
    [assignment.id]: assignment,
  }),
  {}
);

export default Assignments;
