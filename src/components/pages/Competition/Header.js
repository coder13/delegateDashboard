import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  AppBar as MuiAppBar,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  styled,
  Toolbar,
  Typography,
} from '@mui/material';
import { uploadCurrentWCIFChanges } from '../../../store/actions';

export const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export const DrawerLinks = () => {
  const competitionId = useSelector((state) => state.wcif.id);

  return (
    <List style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ListItem button component={Link} to={`/competitions/${competitionId}`}>
        <ListItemIcon>
          <HomeIcon />
        </ListItemIcon>
        <ListItemText primary={'Competition Home'} />
      </ListItem>
      <ListItem button component={Link} to={`/competitions/${competitionId}/roles`}>
        <ListItemIcon>
          <PeopleIcon />
        </ListItemIcon>
        <ListItemText primary={'Configure Staff'} />
      </ListItem>
      <ListItem button component={Link} to={`/competitions/${competitionId}/scrambler-schedule`}>
        <ListItemIcon>
          <ScheduleIcon />
        </ListItemIcon>
        <ListItemText primary={'Scrambler Schedule'} />
      </ListItem>
      <Divider />
      <ListItem button component={Link} to={`/competitions/${competitionId}/import`}>
        <ListItemIcon>
          <FileUploadIcon />
        </ListItemIcon>
        <ListItemText primary={'Import Data'} />
      </ListItem>
      <ListItem button component={Link} to={`/competitions/${competitionId}/export`}>
        <ListItemIcon>
          <FileDownloadIcon />
        </ListItemIcon>
        <ListItemText primary={'Export Data'} />
      </ListItem>
      <Divider />
      <div style={{ display: 'flex', flex: 1 }} />
      <Divider />
      <ListSubheader>Debug</ListSubheader>
      <ListItem button component={Link} to={`/competitions/${competitionId}/assignments`}>
        <ListItemIcon>
          <ViewListIcon />
        </ListItemIcon>
        <ListItemText primary={'View All Assignments'} />
      </ListItem>
    </List>
  );
};

export const Header = ({ open, onMenuOpen }) => {
  const { name } = useSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const handleSaveChanges = () => {
    dispatch(
      uploadCurrentWCIFChanges((e) => {
        if (e) {
          enqueueSnackbar('Error saving changes', { variant: 'error' });
        } else {
          enqueueSnackbar('Saved!', { variant: 'success' });
        }
      })
    );
  };

  return (
    <AppBar position="static" open={open}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={onMenuOpen}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {name}
        </Typography>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <Button color="inherit" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </Toolbar>
    </AppBar>
  );
};
