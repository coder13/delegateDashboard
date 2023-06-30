import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  AppBar as MuiAppBar,
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

const MenuLink = ({ url, icon, text }) => (
  <ListItem button key={url} component={Link} to={url}>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText primary={text} />
  </ListItem>
);

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
  const menuLinks = useMemo(
    () => ({
      top: [
        {
          url: `/competitions/${competitionId}`,
          icon: <HomeIcon />,
          text: 'Home',
        },
        {
          url: `/competitions/${competitionId}/staff`,
          icon: <PeopleIcon />,
          text: 'Configure Staff',
        },
        {
          url: `/competitions/${competitionId}/scrambler-schedule`,
          icon: <ScheduleIcon />,
          text: 'Scrambler Schedule',
        },
        {
          type: 'divider',
        },
        {
          url: `/competitions/${competitionId}/import`,
          icon: <FileUploadIcon />,
          text: 'Import Data',
        },
        {
          url: `/competitions/${competitionId}/export`,
          icon: <FileDownloadIcon />,
          text: 'Export Data',
        },
        {
          type: 'divider',
        },
        {
          url: `/competitions/${competitionId}/checks/first-timers`,
          icon: <PersonSearchIcon />,
          text: 'Check First Timers',
        },
      ],
      debug: [
        {
          url: `/competitions/${competitionId}/assignments`,
          icon: <ViewListIcon />,
          text: 'Assignments',
        },
        {
          url: `/competitions/${competitionId}/query`,
          icon: <SearchIcon />,
          text: 'Query',
        },
      ],
    }),
    [competitionId]
  );

  const renderLinkOrDivider = (link, index) =>
    link.type === 'divider' ? (
      <Divider key={'divider' + index} />
    ) : (
      <MenuLink key={link.url} {...link} />
    );

  return (
    <List style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {menuLinks.top.map(renderLinkOrDivider)}
      <Divider />
      <div style={{ display: 'flex', flex: 1 }} />
      <Divider />
      <ListSubheader>Debug</ListSubheader>
      {menuLinks.debug.map(renderLinkOrDivider)}
    </List>
  );
};

export const Header = ({ open, onMenuOpen }) => {
  const { name } = useSelector((state) => state.wcif);

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
      </Toolbar>
    </AppBar>
  );
};
