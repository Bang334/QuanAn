import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Paper,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Fab,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  alpha
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  ShoppingCart as ShoppingCartIcon,
  Restaurant as RestaurantIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  LocalDining as LocalDiningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';

const CustomerLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { getItemCount, tableId } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Update bottom nav value based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setBottomNavValue(0);
    else if (path === '/menu') setBottomNavValue(1);
    else if (path === '/order') setBottomNavValue(2);
    else if (path === '/cart') setBottomNavValue(3);
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const menuItems = [
    { text: 'Trang chủ', icon: <HomeIcon />, path: '/' },
    { text: 'Thực đơn', icon: <RestaurantIcon />, path: '/menu' },
    { text: 'Đơn hàng', icon: <ReceiptIcon />, path: '/order' },
    { text: 'Giỏ hàng', icon: <ShoppingCartIcon />, path: '/cart' },
  ];

  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isMobile && (
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Nhà hàng XYZ {tableId && `- Bàn ${tableId}`}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/cart')}
            >
              <Badge badgeContent={getItemCount()} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      <SwipeableDrawer
        variant="temporary"
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={handleDrawerClose}
        disableBackdropTransition={!iOS}
        disableDiscovery={iOS}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            width: { xs: '80%', sm: 280 },
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: theme.palette.primary.main,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'white' }}>
              <RestaurantIcon color="primary" />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                Nhà hàng XYZ
              </Typography>
              {tableId && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Bàn số: {tableId}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleDrawerClose}
            sx={{ opacity: 0.9 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ pt: 0 }}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem 
                button 
                key={item.text} 
                component={RouterLink} 
                to={item.path}
                onClick={handleDrawerClose}
                sx={{ 
                  py: 1.5,
                  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  borderLeft: isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? theme.palette.primary.main : 'inherit',
                  minWidth: { xs: 40, sm: 50 }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? theme.palette.primary.main : 'inherit'
                  }}
                />
                {item.text === 'Giỏ hàng' && getItemCount() > 0 && (
                  <Badge 
                    badgeContent={getItemCount()} 
                    color="error" 
                    sx={{ mr: 1 }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Nhà hàng XYZ
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            Đặt món qua QR Code
          </Typography>
        </Box>
      </SwipeableDrawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: isMobile ? 0 : 8, 
          pb: isMobile ? 7 : 0, 
          minHeight: '100vh' 
        }}
      >
        <Outlet />
      </Box>

      {isMobile && (
        <>
          <AppBar 
            position="fixed" 
            color="primary" 
            sx={{ 
              top: 0, 
              bottom: 'auto',
              boxShadow: 1
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  {tableId ? `Bàn ${tableId}` : 'Nhà hàng XYZ'}
                </Typography>
              </Box>
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/cart')}
                edge="end"
              >
                <Badge badgeContent={getItemCount()} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Toolbar>
          </AppBar>

          <Paper 
            sx={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 1100,
              borderRadius: 0,
              boxShadow: '0 -1px 8px rgba(0,0,0,0.1)'
            }} 
            elevation={3}
          >
            <BottomNavigation
              value={bottomNavValue}
              onChange={(event, newValue) => {
                setBottomNavValue(newValue);
                navigate(menuItems[newValue].path);
              }}
              showLabels
              sx={{ 
                height: 60,
                '& .MuiBottomNavigationAction-root': {
                  py: 0.5,
                  minWidth: 'auto',
                  maxWidth: 'none',
                  fontSize: '0.7rem'
                }
              }}
            >
              <BottomNavigationAction 
                label="Trang chủ" 
                icon={<HomeIcon />} 
              />
              <BottomNavigationAction 
                label="Thực đơn" 
                icon={<RestaurantIcon />} 
              />
              <BottomNavigationAction 
                label="Đơn hàng" 
                icon={<ReceiptIcon />} 
              />
              <BottomNavigationAction 
                label="Giỏ hàng" 
                icon={
                  <Badge badgeContent={getItemCount()} color="error" max={9}>
                    <ShoppingCartIcon />
                  </Badge>
                } 
              />
            </BottomNavigation>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default CustomerLayout; 