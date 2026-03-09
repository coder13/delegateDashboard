import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { usePersonSorter, useSortedPersons } from '../usePersonSorter';
import { buildPerson } from '../../store/reducers/_tests_/helpers';
import type { Person } from '@wca/helpers';

const SortedPersonsTester = ({
  persons,
  sortBy,
}: {
  persons: Person[];
  sortBy: 'name' | 'wcaId' | 'dob';
}) => {
  const sorted = useSortedPersons(persons, sortBy);
  return <div data-testid="names">{sorted.map((person) => person.name).join(',')}</div>;
};

const SorterTester = ({ persons }: { persons: Person[] }) => {
  const sorter = usePersonSorter('name');
  const sorted = [...persons].sort(sorter);
  return <div data-testid="names">{sorted.map((person) => person.name).join(',')}</div>;
};

describe('usePersonSorter hooks', () => {
  it('sorts persons by name using useSortedPersons', () => {
    const persons = [
      buildPerson({ name: 'Charlie' }),
      buildPerson({ name: 'Alice' }),
      buildPerson({ name: 'Bob' }),
    ];

    const { getByTestId } = render(<SortedPersonsTester persons={persons} sortBy="name" />);

    expect(getByTestId('names').textContent).toBe('Alice,Bob,Charlie');
  });

  it('sorts persons by wcaId when requested', () => {
    const persons = [
      buildPerson({ name: 'One', wcaId: '2024TEST02' }),
      buildPerson({ name: 'Two', wcaId: '2024TEST01' }),
    ];

    const { getByTestId } = render(<SortedPersonsTester persons={persons} sortBy="wcaId" />);

    expect(getByTestId('names').textContent).toBe('Two,One');
  });

  it('exposes a comparator via usePersonSorter', () => {
    const persons = [buildPerson({ name: 'Zed' }), buildPerson({ name: 'Ada' })];

    const { getByTestId } = render(<SorterTester persons={persons} />);

    expect(getByTestId('names').textContent).toBe('Ada,Zed');
  });
});
