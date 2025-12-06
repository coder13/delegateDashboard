import { useAuth } from '../providers/AuthProvider';
import { useAppDispatch } from '../store';
import { fetchCompetitions } from '../store/actions';
import Navigation from './Navigation';
import { useEffect } from 'react';

const App = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      dispatch(fetchCompetitions());
    }
  }, [dispatch, user]);

  return <Navigation />;
};

export default App;
