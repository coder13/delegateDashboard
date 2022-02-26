import React, { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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

const CompetitionLayout = () => {
  const dispatch = useDispatch();

  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const errors = useSelector((state) => state.errors);
  const wcif = useSelector((state) => state.wcif);

  const { competitionId } = useParams();

  useEffect(() => {
    dispatch(fetchWCIF(competitionId))
  }, [dispatch, competitionId]);

  if (fetchingWCIF) {
    return (<div><p>Loading...</p></div>)
  }

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

  // XXX: this never actually happens
  if (!wcif) {
    return 'No WCIF';
  }

  return (
    <>
      { needToSave && (<Alert severity="error">This is an error alert — check it out!</Alert>) }
      <Outlet />
    </>
  );
}

export default CompetitionLayout;
