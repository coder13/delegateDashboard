import { type Person } from '@wca/helpers';
import { useMemo } from 'react';

type SortField = 'name' | 'wcaId' | 'dob';

/**
 * Comparator functions for person sorting
 */
const personSorters: Record<SortField, (a: Person, b: Person) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  wcaId: (a, b) => (a.wcaId || '').localeCompare(b.wcaId || ''),
  dob: (a, b) => (a.birthdate || '').localeCompare(b.birthdate || ''),
};

/**
 * Hook to get a person sorter function
 * @param sortBy - Field to sort by ('name', 'wcaId', or 'dob')
 * @returns Memoized comparator function
 */
export const usePersonSorter = (sortBy: SortField = 'name') => {
  return useMemo(() => personSorters[sortBy] || personSorters.name, [sortBy]);
};

/**
 * Hook to sort an array of persons by a field
 * @param persons - Array of persons to sort
 * @param sortBy - Field to sort by
 * @returns Sorted array of persons
 */
export const useSortedPersons = (persons: Person[], sortBy: SortField = 'name') => {
  return useMemo(() => {
    const sorter = personSorters[sortBy] || personSorters.name;
    return [...persons].sort(sorter);
  }, [persons, sortBy]);
};
