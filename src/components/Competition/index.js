import React, { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { fetchWCIF } from '../../store/actions';

// const useStyles = makeStyles((theme) => ({
//   root: {
//     display: 'flex',
//     flexDirection: 'Column',
//     flex: 1,
//     width: '100%',
//   },
//   paper: {
//     width: '100%',
//     padding: theme.spacing(2),
//   },
// }));

const Errors = () => {
  const errors = useSelector((state) => state.errors);

  if (errors.length) {
    return (
      <div>
        Errors!
        <ul>
          {errors.map(err => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      </div>
    )
  }

  return false;
}

const CompetitionLayout = () => {
  const dispatch = useDispatch();

  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const wcif = useSelector((state) => state.wcif);

  const { competitionId } = useParams();

  useEffect(() => {
    dispatch(fetchWCIF(competitionId))
  }, [dispatch, competitionId]);

  console.log(34, fetchingWCIF);

  return (
    <Container>
      { needToSave && (<Alert severity="error">Don't Forget to save changes!</Alert>) }
      <Errors />
      { !fetchingWCIF && wcif && wcif.id && wcif.name && (
        <Outlet />
      )}
    </Container>
  );
}

export default CompetitionLayout;
