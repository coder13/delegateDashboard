import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Outlet } from 'react-router-dom';
import {
  Alert,
  Breadcrumbs,
  Button,
  Container,
  Grid,
  List,
  ListItem,
  Typography,
} from '@mui/material';
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
      <Typography>Errors!</Typography>
      <List>
        {errors.map((err) => (
          <ListItem key={err}>{err}</ListItem>
        ))}
      </List>
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
        {breadcrumbs.map((breadcrumb) =>
          breadcrumb.to ? (
            <MaterialLink key={breadcrumb.text} to={breadcrumb.to}>
              {breadcrumb.text}
            </MaterialLink>
          ) : (
            <Typography key={breadcrumb.text} color="textPrimary">
              {breadcrumb.text}
            </Typography>
          )
        )}
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
    dispatch(fetchWCIF(competitionId));
  }, [dispatch, competitionId]);

  return (
    <BreadcrumbsProvider>
      <Container>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Alert
              severity={needToSave ? 'error' : 'warning'}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => dispatch(uploadCurrentWCIFChanges())}>
                  SAVE
                </Button>
              }>
              Don't Forget to save changes!
            </Alert>
          </Grid>
          <BreadCrumbsGridItem />
          {errors.length > 0 && (
            <Grid item>
              <Errors errors={errors} />
            </Grid>
          )}
          <Grid item>{!fetchingWCIF && wcif && wcif.id && wcif.name && <Outlet />}</Grid>
        </Grid>
      </Container>
    </BreadcrumbsProvider>
  );
};

export default CompetitionLayout;
