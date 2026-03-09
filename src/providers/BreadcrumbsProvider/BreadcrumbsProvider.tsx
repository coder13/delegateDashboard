import { BreadcrumbsContext } from './BreadcrumbsContext';
import { type Breadcrumb } from './types';
import { useState } from 'react';

export default function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}
