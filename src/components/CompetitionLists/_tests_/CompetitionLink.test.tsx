import { describe, expect, it } from 'vitest';
import { CompetitionLink } from '../CompetitionLink';
import { renderWithProviders } from '../../../test-utils';

describe('CompetitionLink', () => {
  it('renders competition name and date range', () => {
    const { getByRole, getByText } = renderWithProviders(
      <CompetitionLink
        comp={{
          id: 'TestComp',
          name: 'Test Competition',
          country_iso2: 'US',
          start_date: '2024-02-01',
          end_date: '2024-02-03',
        }}
      />
    );

    expect(getByRole('link', { name: /Test Competition/ })).toHaveAttribute(
      'href',
      '/competitions/TestComp'
    );
    expect(getByText('Feb 1 - 3, 2024')).toBeInTheDocument();
  });
});
