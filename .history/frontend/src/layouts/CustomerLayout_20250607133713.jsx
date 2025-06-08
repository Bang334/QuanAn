import { Outlet } from 'react-router-dom';
import { useState } from 'react';
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Paper,
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  ShoppingCart as ShoppingCartIcon,
  Restaurant as RestaurantIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  LocalDining as LocalDiningIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import ReviewReminder from '../components/ReviewReminder';

const CustomerLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { getItemCount, tableId } = useCart();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Trang chủ', icon: <HomeIcon />, path: '/' },
    { text: 'Thực đơn', icon: <RestaurantIcon />, path: '/menu' },
    { text: 'Đặt món', icon: <LocalDiningIcon />, path: '/order' },
    { text: 'Giỏ hàng', icon: <ShoppingCartIcon />, path: '/cart' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': { width: 240 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div">
            Nhà hàng XYZ
          </Typography>
          {tableId && (
            <Typography variant="subtitle1" color="text.secondary">
              Bàn số: {tableId}
            </Typography>
          )}
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItemButton 
              key={item.text} 
              component={RouterLink} 
              to={item.path}
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box marginTop={'50px'}>
        <Outlet />
      </Box>

      <ReviewReminder />

      <Box component="footer" sx={{ py: 2, bgcolor: 'background.paper', textAlign: 'center', width: '99%' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Nhà hàng XYZ. Đặt món qua QR Code.
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomerLayout; 