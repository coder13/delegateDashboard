import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Competition from '../Competition/'
import CompetitionHome from '../Competition/Home'
import RolesPage from '../Competition/Roles'
import RoomsPage from '../Competition/Rooms'
import RoundPage from '../Competition/Round'
import RoundSelectorPage from '../Competition/RoundSelector'
import PersonPage from '../Competition/Person'
import CompetitionList from '../CompetitionList'
import { useAuth } from '../providers/AuthProvider';
import App from './App';

const AuthenticatedRoute = () => {
  const { signIn, signedIn } = useAuth();

  if (!signedIn()) {
    signIn();
    return;
  }

  return <Outlet />;
}

const Navigation = () => {
  const { signedIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index
          element={(
            signedIn() ? <CompetitionList/> : <p>Sign in to view comps!</p>
          )}
        />

        <Route path="/competitions/" element={<AuthenticatedRoute />}>
          <Route path=":competitionId" element={<Competition />}>
            <Route index element={<CompetitionHome />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="events/:eventId-r:roundNumber" element={<RoundPage />} />
            <Route path="events" element={<RoundSelectorPage />} />
            <Route path="persons/:registrantId" element={<PersonPage />} />
          </Route>
        </Route>
        {/* <Redirect to="/"/> */}
      </Route>
    </Routes>
  );
}

export default Navigation;