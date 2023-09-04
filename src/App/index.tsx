import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../providers/AuthProvider';
import { fetchCompetitions } from '../store/actions';
import Navigation from './Navigation';

const App = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      dispatch(fetchCompetitions());
    }
  }, [dispatch, user]);

  return <Navigation />;
};

export default App;
