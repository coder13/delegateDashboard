import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BreadcrumbsContext } from '../../providers/BreadcrumbsProvider/BreadcrumbsContext';
import { useBreadcrumbsEffect } from '../useBreadcrumbsEffect';
import type { Breadcrumb } from '../../providers/BreadcrumbsProvider';

const BreadcrumbsTester = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) => {
  useBreadcrumbsEffect(breadcrumbs);
  return null;
};

describe('useBreadcrumbsEffect', () => {
  it('sets breadcrumbs on mount and when they change', () => {
    const setBreadcrumbs = vi.fn();
    const initial = [{ text: 'Home', to: '/' }];
    const updated = [
      { text: 'Home', to: '/' },
      { text: 'Competition', to: '/competition' },
    ];

    const { rerender } = render(
      <BreadcrumbsContext.Provider value={{ breadcrumbs: [], setBreadcrumbs }}>
        <BreadcrumbsTester breadcrumbs={initial} />
      </BreadcrumbsContext.Provider>
    );

    expect(setBreadcrumbs).toHaveBeenCalledWith(initial);

    rerender(
      <BreadcrumbsContext.Provider value={{ breadcrumbs: [], setBreadcrumbs }}>
        <BreadcrumbsTester breadcrumbs={updated} />
      </BreadcrumbsContext.Provider>
    );

    expect(setBreadcrumbs).toHaveBeenCalledWith(updated);
  });
});
