import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import {
  Layout as CompetitionLayout,
  Home as CompetitionHomePage,
  Roles as RolesPage,
  Rooms as RoomsPage,
  Round as RoundPage,
  RoundSelector as RoundSelectorPage,
  Person as PersonPage,
  Assignments as AssignmentsPage,
  Export as ExportPage,
  Import as ImportPage,
  ScramblerSchedule as ScramblerSchedulePage,
} from '../pages/Competition';
import HomePage from '../pages/Home';
import { useAuth } from '../providers/AuthProvider';
import Layout from './Layout';

const AuthenticatedRoute = () => {
  const { signIn, signedIn } = useAuth();

  if (!signedIn()) {
    signIn();
    return;
  }

  return <Outlet />;
};

const Navigation = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="/competitions/" element={<AuthenticatedRoute />}>
          <Route path=":competitionId" element={<CompetitionLayout />}>
            <Route index element={<CompetitionHomePage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="events/:eventId-r:roundNumber" element={<RoundPage />} />
            <Route path="events" element={<RoundSelectorPage />} />
            <Route path="persons/:registrantId" element={<PersonPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="scrambler-schedule" element={<ScramblerSchedulePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default Navigation;
