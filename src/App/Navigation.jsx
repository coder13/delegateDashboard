import React, { useEffect } from 'react';
import { Routes, Route, Outlet, Navigate, useNavigate, useParams } from 'react-router-dom';
import usePageTracking from '../hooks/usePageTracking';
import {
  Layout as CompetitionLayout,
  Home as CompetitionHomePage,
  Staff as StaffPage,
  Rooms as RoomsPage,
  Round as RoundPage,
  Person as PersonPage,
  Assignments as AssignmentsPage,
  Export as ExportPage,
  Import as ImportPage,
  ScramblerSchedule as ScramblerSchedulePage,
} from '../pages/Competition';
import FirstTimers from '../pages/Competition/Checks/FirstTimers';
import { GroupifierPrintingConfig } from '../pages/Competition/External/GroupifierPrinting';
import QueryPage from '../pages/Competition/Query';
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

const Comp404 = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams();

  useEffect(() => {
    navigate(`/competitions/${competitionId}`, { replace: true });
  }, [competitionId, navigate]);

  return null;
};

const Navigation = () => {
  usePageTracking(import.meta.env.VITE_GA_MEASUREMENT_ID);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="/competitions/" element={<AuthenticatedRoute />}>
          <Route path=":competitionId" element={<CompetitionLayout />}>
            <Route index element={<CompetitionHomePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="events/:roundId" element={<RoundPage />} />
            <Route path="persons/:registrantId" element={<PersonPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="scrambler-schedule" element={<ScramblerSchedulePage />} />
            <Route path="query" element={<QueryPage />} />
            <Route path="checks/first-timers" element={<FirstTimers />} />
            <Route path="external/groupifier-printing" element={<GroupifierPrintingConfig />} />

            <Route path="*" element={<Comp404 />} />
          </Route>
        </Route>

        <Route path="*">
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default Navigation;
