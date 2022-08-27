import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Outlet } from 'react-router-dom';
import {
  Alert,
  Breadcrumbs,
  Button,
  Container,
  Divider,
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
import { getLocalStorage, setLocalStorage } from '../../../lib/localStorage';

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

  return (
    <Grid item>
      <Breadcrumbs aria-label="breadcrumbs">
        <MaterialLink to={`/`}>
          Competitions
        </MaterialLink>
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
  const { competitionId } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(getLocalStorage('drawer-open') === 'true');

  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const wcif = useSelector((state) => state.wcif);
  const errors = useSelector((state) => state.errors);

  useEffect(() => {
    dispatch(fetchWCIF(competitionId));
  }, [dispatch, competitionId]);

  useEffect(() => {
    setLocalStorage('drawer-open', drawerOpen);
  }, [drawerOpen])

  return (
    <>
      <Header open={drawerOpen} onMenuOpen={() => setDrawerOpen(!drawerOpen)} />
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
        <Divider />
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
                      onClick={() => dispatch(uploadCurrentWCIFChanges())}
                    >
                      SAVE
                    </Button>
                  }
                >
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
