import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import {
  Layout as CompetitionLayout,
  Home as CompetitionHome,
  Roles as RolesPage,
  Rooms as RoomsPage,
  Round as RoundPage,
  RoundSelector as RoundSelectorPage,
  Person as PersonPage,
} from '../Competition';
import AssignmentsPage from '../Competition/Assignments';
import ExportPage from '../Competition/Export';
import CompetitionList from '../CompetitionList';
import { useAuth } from '../providers/AuthProvider';
import App from './App';

const AuthenticatedRoute = () => {
  const { signIn, signedIn } = useAuth();

  if (!signedIn()) {
    signIn();
    return;
  }

  return <Outlet />;
};

const Navigation = () => {
  const { signedIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={signedIn() ? <CompetitionList /> : <p>Sign in to view comps!</p>} />

        <Route path="/competitions/" element={<AuthenticatedRoute />}>
          <Route path=":competitionId" element={<CompetitionLayout />}>
            <Route index element={<CompetitionHome />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="events/:eventId-r:roundNumber" element={<RoundPage />} />
            <Route path="events" element={<RoundSelectorPage />} />
            <Route path="persons/:registrantId" element={<PersonPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="export" element={<ExportPage />} />
          </Route>
        </Route>
        {/* <Redirect to="/"/> */}
      </Route>
    </Routes>
  );
};

export default Navigation;
