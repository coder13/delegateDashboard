import { createContext, useContext, useState } from 'react';

export interface Breadcrumb {
  to?: string;
  text: string;
}

const BreadcrumbsContext = createContext<{
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
}>({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export default function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export const useBreadcrumbs = () => useContext(BreadcrumbsContext);
