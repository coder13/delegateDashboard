import type { Breadcrumb } from './types';
import { createContext, useContext } from 'react';

export const BreadcrumbsContext = createContext<{
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
}>({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export const useBreadcrumbs = () => useContext(BreadcrumbsContext);
