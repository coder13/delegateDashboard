import { createContext, useContext, useState } from 'react';

export interface Breadcrumb {
  text: string;
  to?: string;
}

const BreadcrumbsContext = createContext<{
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
}>({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export default function BreadcrumbsProvider({ children }) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export const useBreadcrumbs = () => useContext(BreadcrumbsContext);
