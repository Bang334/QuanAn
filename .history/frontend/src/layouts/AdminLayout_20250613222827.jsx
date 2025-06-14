import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  MenuItem,
  Collapse,
  Badge,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  TableBar as TableBarIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Payments as PaymentsIcon,
  LocalOffer as PromotionIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as SalaryIcon,
  Inventory as InventoryIcon,
  Assessment as ReportsIcon,
  MenuBook as RecipeIcon,
  ShoppingCart as ShoppingIcon,
  Security as SecurityIcon,
  RateReview as ReviewIcon,
  ExpandLess,
  ExpandMore,
  Store as StoreIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const drawerWidth = 260;

const AdminLayout = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for collapsible menu sections
  const [openMenus, setOpenMenus] = useState({
    inventory: true,
    staff: false,
    sales: false,
  });

  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'admin') {
      navigate(`/${currentUser.role}`);
    }
  }, [currentUser, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };
  
  const handleToggleMenu = (section) => {
    setOpenMenus(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Organize menu items into categories
  const inventoryMenuItems = [
    { text: 'Quản lý kho', icon: <InventoryIcon />, path: '/admin/inventory' },
    { text: 'Báo cáo kho', icon: <ReportsIcon />, path: '/admin/reports' },
    { text: 'Đơn đặt hàng', icon: <ShoppingIcon />, path: '/admin/shopping' },
    { text: 'Quản lý công thức', icon: <RecipeIcon />, path: '/admin/recipes' },
  ];
  
  const staffMenuItems = [
    { text: 'Quản lý nhân viên', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Quản lý lương', icon: <SalaryIcon />, path: '/admin/salaries' },
    { text: 'Quyền nhân viên bếp', icon: <SecurityIcon />, path: '/admin/kitchen-permissions' },
  ];
  
  const salesMenuItems = [
    { text: 'Quản lý đơn hàng', icon: <ReceiptIcon />, path: '/admin/orders' },
    { text: 'Quản lý thanh toán', icon: <PaymentsIcon />, path: '/admin/payments' },
    { text: 'Quản lý khuyến mãi', icon: <PromotionIcon />, path: '/admin/promotions' },
    { text: 'Phân tích doanh thu', icon: <AnalyticsIcon />, path: '/admin/analytics' },
  ];
  
  const otherMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Quản lý thực đơn', icon: <RestaurantIcon />, path: '/admin/menu' },
    { text: 'Quản lý bàn', icon: <TableBarIcon />, path: '/admin/tables' },
    { text: 'Quản lý đánh giá', icon: <ReviewIcon />, path: '/admin/reviews' },
  ];

  const renderMenuItems = (items) => {
    return items.map((item) => (
      <ListItemButton
        key={item.text}
        component={RouterLink}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        selected={isActive(item.path)}
        sx={{
          borderRadius: '8px',
          mx: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.25),
            },
            '& .MuiListItemIcon-root': {
              color: 'primary.main',
            },
            '& .MuiListItemText-primary': {
              fontWeight: 'bold',
              color: 'primary.main',
            },
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.text}
          primaryTypographyProps={{
            fontSize: '0.9rem',
            fontWeight: isActive(item.path) ? 'bold' : 'medium',
          }}
        />
      </ListItemButton>
    ));
  };

  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: theme.palette.background.default,
    }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        <StoreIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Quản lý nhà hàng
        </Typography>
      </Box>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1, py: 2 }}>
        <List component="nav" disablePadding>
          {/* Main menu items */}
          {renderMenuItems(otherMenuItems)}
          
          <Divider sx={{ my: 1.5, mx: 2 }} />
          
          {/* Inventory Section */}
          <ListItemButton 
            onClick={() => handleToggleMenu('inventory')}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              mb: 0.5,
              backgroundColor: openMenus.inventory ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <InventoryIcon color={openMenus.inventory ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Quản lý hàng hóa" 
              primaryTypographyProps={{ 
                fontWeight: 'medium',
                color: openMenus.inventory ? 'primary.main' : 'inherit',
              }}
            />
            {openMenus.inventory ? <ExpandLess color="primary" /> : <ExpandMore />}
          </ListItemButton>
          
          <Collapse in={openMenus.inventory} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {renderMenuItems(inventoryMenuItems)}
            </List>
          </Collapse>
          
          {/* Staff Section */}
          <ListItemButton 
            onClick={() => handleToggleMenu('staff')}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              mb: 0.5,
              backgroundColor: openMenus.staff ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PeopleIcon color={openMenus.staff ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Quản lý nhân sự" 
              primaryTypographyProps={{ 
                fontWeight: 'medium',
                color: openMenus.staff ? 'primary.main' : 'inherit',
              }}
            />
            {openMenus.staff ? <ExpandLess color="primary" /> : <ExpandMore />}
          </ListItemButton>
          
          <Collapse in={openMenus.staff} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {renderMenuItems(staffMenuItems)}
            </List>
          </Collapse>
          
          {/* Sales Section */}
          <ListItemButton 
            onClick={() => handleToggleMenu('sales')}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              mb: 0.5,
              backgroundColor: openMenus.sales ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ReceiptIcon color={openMenus.sales ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Quản lý bán hàng" 
              primaryTypographyProps={{ 
                fontWeight: 'medium',
                color: openMenus.sales ? 'primary.main' : 'inherit',
              }}
            />
            {openMenus.sales ? <ExpandLess color="primary" /> : <ExpandMore />}
          </ListItemButton>
          
          <Collapse in={openMenus.sales} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {renderMenuItems(salesMenuItems)}
            </List>
          </Collapse>
        </List>
      </Box>
      
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'primary.main',
              mr: 1.5,
            }}
          >
            {currentUser?.name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {currentUser?.name || 'Admin'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser?.email || 'admin@quanan.com'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          size="small"
          sx={{ mt: 1, borderRadius: '8px' }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Box>
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
        }}
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {location.pathname === '/admin' ? 'Dashboard' : 
             location.pathname.includes('/admin/menu') ? 'Quản lý thực đơn' :
             location.pathname.includes('/admin/recipes') ? 'Quản lý công thức' :
             location.pathname.includes('/admin/inventory') ? 'Quản lý kho' :
             location.pathname.includes('/admin/reports') ? 'Báo cáo kho' :
             location.pathname.includes('/admin/shopping') ? 'Đơn đặt hàng' :
             location.pathname.includes('/admin/tables') ? 'Quản lý bàn' :
             location.pathname.includes('/admin/users') ? 'Quản lý nhân viên' :
             location.pathname.includes('/admin/orders') ? 'Quản lý đơn hàng' :
             location.pathname.includes('/admin/reviews') ? 'Quản lý đánh giá' :
             location.pathname.includes('/admin/payments') ? 'Quản lý thanh toán' :
             location.pathname.includes('/admin/promotions') ? 'Quản lý khuyến mãi' :
             location.pathname.includes('/admin/salaries') ? 'Quản lý lương' :
             location.pathname.includes('/admin/analytics') ? 'Phân tích doanh thu' :
             location.pathname.includes('/admin/kitchen-permissions') ? 'Quyền nhân viên bếp' :
             'Quản lý nhà hàng'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Thông báo">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Cài đặt">
              <IconButton color="inherit" sx={{ mx: 1 }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={currentUser?.name || 'Admin'}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  {currentUser?.name?.charAt(0) || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">{currentUser?.name}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Đăng xuất" />
              </MenuItem>
            </Menu>
          </Box>
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
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              boxShadow: 3,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              boxShadow: 3,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 