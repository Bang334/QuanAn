import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Paper,
  ClickAwayListener,
  Stack,
  Grow,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  ExitToApp as LogoutIcon,
  AttachMoney as SalaryIcon,
  Inventory as InventoryIcon,
  AddCircleOutline as ProposalIcon,
  AccessTime as AttendanceIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const drawerWidth = 240;

const KitchenLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in or not kitchen staff
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'kitchen') {
      navigate(`/${currentUser.role}`);
    }
  }, [currentUser, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuToggle = () => {
    setMenuOpen((prevOpen) => !prevOpen);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Đơn hàng cần xử lý', icon: <DashboardIcon />, path: '/kitchen' },
    { text: 'Quản lý kho', icon: <InventoryIcon />, path: '/kitchen/inventory' },
    { text: 'Chấm công & Lịch làm việc', icon: <AttendanceIcon />, path: '/kitchen/attendance' },
    { text: 'Xem lương', icon: <SalaryIcon />, path: '/kitchen/salary' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Bếp
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  if (!currentUser || currentUser.role !== 'kitchen') {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
        component="nav"
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Quản lý Bếp
          </Typography>
          <div style={{ position: 'relative' }}>
            <IconButton
              ref={menuRef}
              size="large"
              aria-label="account of current user"
              aria-controls={menuOpen ? 'profile-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
              onClick={handleMenuToggle}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {currentUser?.name?.charAt(0) || 'K'}
              </Avatar>
            </IconButton>
            
            {/* Custom dropdown menu thay vì dùng Menu của MUI */}
            {menuOpen && (
              <ClickAwayListener onClickAway={handleMenuClose}>
                <Paper
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    mt: 1,
                    width: '20ch',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    zIndex: 1300
                  }}
                  elevation={8}
                >
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {currentUser?.name}
                    </Typography>
                  </Box>
                  <Divider />
                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Đăng xuất" />
                  </ListItemButton>
                </Paper>
              </ClickAwayListener>
            )}
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default KitchenLayout; 