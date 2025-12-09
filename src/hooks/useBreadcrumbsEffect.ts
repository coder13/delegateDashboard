import type { Breadcrumb } from '../providers/BreadcrumbsProvider';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import { useEffect } from 'react';

/**
 * Hook to set breadcrumbs on component mount
 * @param breadcrumbs - Array of breadcrumb objects to display
 */
export const useBreadcrumbsEffect = (breadcrumbs: Breadcrumb[]) => {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
  }, [setBreadcrumbs, breadcrumbs]);
};
