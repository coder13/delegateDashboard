import { useAuth } from '../../providers/AuthProvider';
import PeopleIcon from '@mui/icons-material/People';
import { Avatar, Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user, signIn, signOut } = useAuth();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex' }}>
            <PeopleIcon sx={{ fontSize: '1.5em', verticalAlign: 'middle', mr: 1 }} />
            Delegate Dashboard
          </Link>
        </Typography>
        {user ? (
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user.name} src={user.avatar?.thumb_url} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}>
              <MenuItem onClick={signOut}>
                <Typography textAlign="center">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button color="inherit" onClick={signIn}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
