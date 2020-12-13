import React, { createContext, useContext } from 'react';

const CompetitionContext = createContext({});

export const CompetitionProvider = ({ competition, children }) => {
  return (
    <CompetitionContext.Provider value={competition}>
      {children}
    </CompetitionContext.Provider>
  );
};

export const useCompetition = () => useContext(CompetitionContext);
