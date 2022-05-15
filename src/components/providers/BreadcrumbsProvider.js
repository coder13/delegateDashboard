import { createContext, useContext, useState } from "react";

const BreadcrumbsContext = createContext();

export default function BreadcrumbsProvider({ children }) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  return <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
    {children}
  </BreadcrumbsContext.Provider>
}

export const useBreadcrumbs = () => useContext(BreadcrumbsContext);
