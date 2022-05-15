import React, { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { Breadcrumbs, Button, Grid, Typography } from '@mui/material';
import { fetchWCIF, uploadCurrentWCIFChanges } from '../../store/actions';
import BreadcrumbsProvider, { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import MaterialLink from '../shared/MaterialLink';

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

const Errors = ({ errors }) => {
  return (
    <div>
      Errors!
      <ul>
        {errors.map(err => (
          <li key={err}>{err}</li>
        ))}
      </ul>
    </div>
  );
};

const BreadCrumbsGridItem = () => {
  const { breadcrumbs } = useBreadcrumbs();
  const wcif = useSelector((state) => state.wcif);
  const { competitionId } = useParams();

  if (breadcrumbs.length === 0) {
    return false;
  }

  return (
    <Grid item>
      <Breadcrumbs aria-label="breadcrumbs">
        <MaterialLink to={`/competitions/${competitionId}`}>
          {wcif.name || competitionId}
        </MaterialLink>
        {breadcrumbs.map((breadcrumb) => (
          breadcrumb.to
            ? (
              <MaterialLink to={breadcrumb.to}>
                {breadcrumb.text}
              </MaterialLink>
            )
            : (
              <Typography color="textPrimary">{breadcrumb.text}</Typography>
            )
        ))}
      </Breadcrumbs>
    </Grid>
  );
};

const CompetitionLayout = () => {
  const dispatch = useDispatch();

  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const wcif = useSelector((state) => state.wcif);
  const errors = useSelector((state) => state.errors);

  const { competitionId } = useParams();

  useEffect(() => {
    dispatch(fetchWCIF(competitionId))
  }, [dispatch, competitionId]);

  return (
    <BreadcrumbsProvider>
      <Container>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            {needToSave && (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => dispatch(uploadCurrentWCIFChanges())}>
                    SAVE
                  </Button>
                }
              >
                Don't Forget to save changes!
              </Alert>
            )}
          </Grid>
          <BreadCrumbsGridItem />
          {errors.length > 0 && (
            <Grid item>
              <Errors />
            </Grid>
          )}
          <Grid item>
            {!fetchingWCIF && wcif && wcif.id && wcif.name && (
              <Outlet />
            )}
          </Grid>
        </Grid>
      </Container>
    </BreadcrumbsProvider>
  );
}

export default CompetitionLayout;
