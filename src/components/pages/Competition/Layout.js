import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Outlet } from 'react-router-dom';
import {
  Alert,
  Breadcrumbs,
  Button,
  Container,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { fetchWCIF, uploadCurrentWCIFChanges } from '../../../store/actions';
import BreadcrumbsProvider, { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import MaterialLink from '../../shared/MaterialLink';
import { DrawerHeader, DrawerLinks, drawerWidth, Header } from './Header';
import { styled } from '@mui/system';

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

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: `${drawerWidth}px`,
    }),
    overflowY: 'auto',
  }),
);

const CompetitionLayout = () => {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const wcif = useSelector((state) => state.wcif);
  const errors = useSelector((state) => state.errors);

  const { competitionId } = useParams();

  useEffect(() => {
    dispatch(fetchWCIF(competitionId));
  }, [dispatch, competitionId]);

  console.log(106, drawerOpen);

  return (
    <>
      <Header open={drawerOpen} onMenuOpen={() => setDrawerOpen(!drawerOpen)} />
      {/* <Drawer open={drawerOpen} /> */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <DrawerHeader>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <DrawerLinks />
      </Drawer>
      <Main open={drawerOpen}>
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
              <Grid item>{!fetchingWCIF && wcif?.id && wcif?.name && <Outlet />}</Grid>
            </Grid>
          </Container>
        </BreadcrumbsProvider>
      </Main>
    </>
  );
};

export default CompetitionLayout;
