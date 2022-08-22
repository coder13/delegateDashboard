import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Button } from '@mui/material';
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
import ImportPage from '../Competition/Import';

const Home = ({ signIn }) => (
  <div style={{ padding: '1em' }}>
    <p>Sign in to view comps!</p>
    <Button onClick={() => signIn()} variant="outlined">
      Sign In
    </Button>
  </div>
);

const AuthenticatedRoute = () => {
  const { signIn, signedIn } = useAuth();

  if (!signedIn()) {
    signIn();
    return;
  }

  return <Outlet />;
};

const Navigation = () => {
  const { signedIn, signIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route
          index
          element={signedIn() ? <CompetitionList /> : <Home signIn={() => signIn()} />}
        />

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
            <Route path="import" element={<ImportPage />} />
          </Route>
        </Route>
        {/* <Redirect to="/"/> */}
      </Route>
    </Routes>
  );
};

export default Navigation;
