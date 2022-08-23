import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Outlet, Link } from 'react-router-dom';
import {
  Alert,
  Breadcrumbs,
  Button,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { fetchWCIF, uploadCurrentWCIFChanges } from '../../store/actions';
import BreadcrumbsProvider, { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import MaterialLink from '../shared/MaterialLink';

const Errors = ({ errors }) => {
  console.log(errors);
  return (
    <div>
      <Typography>Errors!</Typography>
      <List>
        {errors.map((err) => (
          <ListItem key={err}>
            <ListItemText primary={err.message} secondary={JSON.stringify(err.data)} />
          </ListItem>
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
      <Grid direction="row" style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
      }}>
        <Grid item style={{
          width: '30%',
          height: '100%',
          display: 'flex',
        }}>
          <Paper square style={{ width: '100%' }}>
            <List style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ListItem button component={Link} to={`/competitions/${competitionId}`}>
                <ListItemText primary={'Competition Home'} />
              </ListItem>
              <ListItem button component={Link} to={`/competitions/${competitionId}/roles`}>
                <ListItemText primary={'Configure Staff'} />
              </ListItem>
              <ListItem button component={Link} to={`/competitions/${competitionId}/assignments`}>
                <ListItemText primary={'View All Assignments Data'} />
              </ListItem>
              <Divider />
              <div style={{ display: 'flex', flex: 1 }} />
              <Divider />
              <ListItem button component={Link} to={`/competitions/${competitionId}/export`}>
                <ListItemText primary={'Export Data'} />
              </ListItem>
              <ListItem button component={Link} to={`/competitions/${competitionId}/import`}>
                <ListItemText primary={'Import Data'} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item style={{ display: 'flex', width: '100%', overflowY: 'auto' }}>
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
        </Grid>
      </Grid>
    </BreadcrumbsProvider>
  );
};

export default CompetitionLayout;
