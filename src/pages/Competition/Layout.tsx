import { Errors } from '../../components/Errors';
import { DrawerHeader, DrawerLinks, drawerWidth, Header } from '../../components/Header';
import MaterialLink from '../../components/MaterialLink';
import { getLocalStorage, setLocalStorage } from '../../lib/api';
import BreadcrumbsProvider, { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchWCIF, uploadCurrentWCIFChanges } from '../../store/actions';
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
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';

const BreadCrumbsGridItem = () => {
  const { breadcrumbs } = useBreadcrumbs();
  const wcif = useAppSelector((state) => state.wcif);
  const { competitionId } = useParams<{ competitionId: string }>();

  return (
    <Grid item>
      <Breadcrumbs aria-label="breadcrumbs">
        <MaterialLink to={`/`}>Competitions</MaterialLink>
        <MaterialLink to={`/competitions/${competitionId}`}>
          {wcif?.name || competitionId}
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

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
  ...(open && {
    transition: 'margin 195ms cubic-bezier(0, 0, 0.2, 1) 0ms',
    marginLeft: `${drawerWidth}px`,
  }),
  overflowY: 'auto',
}));

const CompetitionLayout = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { competitionId } = useParams<{ competitionId: string }>();
  const [drawerOpen, setDrawerOpen] = useState(getLocalStorage('drawer-open') === 'true');

  const fetchingWCIF = useAppSelector((state) => state.fetchingWCIF);
  const needToSave = useAppSelector((state) => state.needToSave);
  const wcif = useAppSelector((state) => state.wcif);
  const errors = useAppSelector((state) => state.errors);

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
    if (wcif) {
      document.title = 'Delegate Dashboard - ' + wcif.name;
    }
  }, [wcif]);

  useEffect(() => {
    if (competitionId) {
      dispatch(fetchWCIF(competitionId));
    }
  }, [dispatch, competitionId]);

  useEffect(() => {
    setLocalStorage('drawer-open', drawerOpen.toString());
  }, [drawerOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
                  {"Don't Forget to save changes!"}
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
