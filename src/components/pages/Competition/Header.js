import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AppBar as MuiAppBar, Divider, IconButton, List, ListItem, ListItemText, styled, Toolbar, Typography } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu";

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
  );
}

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
          onClick={onMenuOpen}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {name}
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
