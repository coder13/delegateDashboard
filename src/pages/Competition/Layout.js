import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Outlet } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import {
  Alert,
  Backdrop,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import { Errors } from '../../components/Errors';
import MaterialLink from '../../components/MaterialLink';
import { getLocalStorage, setLocalStorage } from '../../lib/localStorage';
import BreadcrumbsProvider, { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import { fetchWCIF, uploadCurrentWCIFChanges } from '../../store/actions';
import { DrawerHeader, DrawerLinks, drawerWidth, Header } from './Header';

const BreadCrumbsGridItem = () => {
  const { breadcrumbs } = useBreadcrumbs();
  const wcif = useSelector((state) => state.wcif);
  const { competitionId } = useParams();

  return (
    <Grid item>
      <Breadcrumbs aria-label="breadcrumbs">
        <MaterialLink to={`/`}>Competitions</MaterialLink>
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
  })
);

const CompetitionLayout = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { competitionId } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(getLocalStorage('drawer-open') === 'true');

  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const wcif = useSelector((state) => state.wcif);
  const errors = useSelector((state) => state.errors);

  const handleSaveChanges = useCallback(() => {
    dispatch(
      uploadCurrentWCIFChanges((e) => {
        if (e) {
          enqueueSnackbar('Error saving changes', { variant: 'error' });
        } else {
          enqueueSnackbar('Saved!', { variant: 'success' });
        }
      })
    );
  }, [dispatch, enqueueSnackbar]);

  useEffect(() => {
    dispatch(fetchWCIF(competitionId));
  }, [dispatch, competitionId]);

  useEffect(() => {
    setLocalStorage('drawer-open', drawerOpen);
  }, [drawerOpen]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!event) {
        return;
      }

      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSaveChanges();
      }
    },
    [handleSaveChanges]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
        }}>
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
                    <Button color="inherit" size="small" onClick={handleSaveChanges}>
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
              {fetchingWCIF && (
                <Backdrop
                  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                  open={fetchingWCIF}>
                  <CircularProgress color="inherit" />
                </Backdrop>
              )}
              <Grid item>{wcif?.id && wcif?.name && <Outlet />}</Grid>
            </Grid>
          </Container>
        </BreadcrumbsProvider>
      </Main>
    </>
  );
};

export default CompetitionLayout;
