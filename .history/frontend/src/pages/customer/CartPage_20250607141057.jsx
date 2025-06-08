import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  RestaurantMenu as RestaurantIcon,
  Receipt as ReceiptIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const CartPage = () => {
  const theme = useTheme();
  const { cartItems, tableId, updateCartItem, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [menuItemDetails, setMenuItemDetails] = useState({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const navigate = useNavigate();
  
  // Fetch menu item details for images and descriptions
  useEffect(() => {
    const fetchMenuItemDetails = async () => {
      if (cartItems.length === 0) return;
      
      setLoadingItems(true);
      try {
        const response = await axios.get(`${API_URL}/api/menu`);
        
        if (response.data && Array.isArray(response.data)) {
          const menuItemsMap = {};
          response.data.forEach(item => {
            menuItemsMap[item.id] = item;
          });
          setMenuItemDetails(menuItemsMap);
        }
      } catch (err) {
        console.error('Error fetching menu item details:', err);
      } finally {
        setLoadingItems(false);
      }
    };
    
    fetchMenuItemDetails();
  }, [cartItems]);

  const handleQuantityChange = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      updateCartItem(id, { quantity });
    }
  };

  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Giỏ hàng trống',
        severity: 'error',
      });
      return;
    }
    
    if (!tableId) {
      navigate('/');
      return;
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    
    try {
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        tableId,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: ''
        })),
        notes
      };
      
      // Gửi đơn hàng đến API
      const response = await axios.post(`${API_URL}/api/orders`, orderData);
      
      // Lấy ID đơn hàng từ response
      const newOrderId = response.data.id;
      
      // Đặt ID đơn hàng và đánh dấu thành công
      setOrderId(newOrderId);
      setOrderSuccess(true);
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: 'Đặt món thành công!',
        severity: 'success',
      });
      
      // Xóa giỏ hàng
      clearCart();
      
      // Đóng hộp thoại
      setOpenDialog(false);
      
      // Chuyển hướng đến trang trạng thái đơn hàng
      navigate(`/status/${newOrderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Đặt hàng thất bại');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Đặt hàng thất bại',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (!tableId) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h5" gutterBottom>
          Vui lòng chọn bàn trước khi xem giỏ hàng
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Chọn bàn
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Giỏ hàng - Bàn {tableId}
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      {cartItems.length === 0 ? (
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.secondary.light, 0.1)})`,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Giỏ hàng trống
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Hãy thêm món ăn vào giỏ hàng để bắt đầu đặt món
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => navigate('/menu')}
              startIcon={<RestaurantIcon />}
              sx={{ 
                mt: 2, 
                borderRadius: 2,
                px: 3,
                boxShadow: 2
              }}
            >
              Xem thực đơn
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              bgcolor: theme.palette.primary.main, 
              color: 'white',
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center'
            }}>
              <ShoppingCartIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Món đã chọn
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {cartItems.map((item) => {
                const itemDetails = menuItemDetails[item.id] || {};
                const itemImage = itemDetails.image || `https://via.placeholder.com/100?text=${encodeURIComponent(item.name)}`;
                
                return (
                  <Box key={item.id}>
                    <ListItem sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={3} sm={2}>
                          <Box
                            component="img"
                            src={itemImage}
                            alt={item.name}
                            sx={{
                              width: '100%',
                              height: { xs: 60, sm: 80 },
                              objectFit: 'cover',
                              borderRadius: 1,
                              boxShadow: 1
                            }}
                          />
                        </Grid>
                        <Grid item xs={5} sm={6}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {formatPrice(item.price)} / món
                          </Typography>
                          {itemDetails.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                display: { xs: 'none', sm: 'block' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}
                            >
                              {itemDetails.description}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={4} sm={2}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1,
                            p: 0.5
                          }}>
                            <IconButton 
                              size="small"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ 
                              mx: 1, 
                              minWidth: '24px', 
                              textAlign: 'center',
                              fontWeight: 'bold'
                            }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={2} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight="bold"
                            color="primary.main"
                            sx={{ display: { sm: 'none' } }}
                          >
                            Thành tiền:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="bold"
                              color="primary.main"
                              sx={{ mr: 1 }}
                            >
                              {formatPrice(item.price * item.quantity)}
                            </Typography>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => removeFromCart(item.id)}
                              size="small"
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </ListItem>
                    <Divider />
                  </Box>
                );
              })}
            </List>
            
            <Box sx={{ px: 3, py: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Ghi chú và thanh toán
              </Typography>
              
              <TextField
                label="Ghi chú đặc biệt"
                placeholder="Ví dụ: Không hành, ít cay..."
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                value={notes}
                onChange={handleNotesChange}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white'
                  }
                }}
              />
              
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  mb: 3,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    Tạm tính:
                  </Typography>
                  <Typography variant="body1">
                    {formatPrice(getTotalPrice())}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Tổng tiền:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatPrice(getTotalPrice())}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Paper>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 2
          }}>
            <Button 
              variant="outlined"
              onClick={() => navigate('/menu')}
              startIcon={<RestaurantIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1
              }}
            >
              Tiếp tục đặt món
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCheckout}
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1,
                boxShadow: 2
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Xác nhận đặt món'}
            </Button>
          </Box>
        </>
      )}
      
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <ShoppingCartIcon sx={{ mr: 1 }} />
          Xác nhận đặt món
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn đặt {cartItems.length} món ăn với tổng số tiền:
          </DialogContentText>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 1
          }}>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              {formatPrice(getTotalPrice())}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Món ăn sẽ được chuẩn bị ngay sau khi bạn xác nhận
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Vui lòng thanh toán khi nhân viên mang hóa đơn đến bàn {tableId}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmOrder} 
            variant="contained" 
            color="primary" 
            autoFocus
            sx={{ borderRadius: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Xác nhận đặt món'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={orderSuccess}
        onClose={() => navigate(`/status/${orderId}`)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'success.main', 
          color: 'white',
          textAlign: 'center',
          py: 2
        }}>
          Đặt món thành công
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 70, 
                height: 70, 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: 'success.main',
                mx: 'auto',
                mb: 2
              }}
            >
              <CheckIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h6" gutterBottom>
              Đơn hàng của bạn đã được gửi đến nhà bếp
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 2
            }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                Mã đơn hàng:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {orderId}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Nhà bếp sẽ chuẩn bị món ăn của bạn trong thời gian sớm nhất
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => navigate('/menu')} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Tiếp tục đặt món
          </Button>
          <Button 
            onClick={() => navigate(`/status/${orderId}`)} 
            variant="contained" 
            color="primary" 
            autoFocus
            sx={{ borderRadius: 2 }}
          >
            Xem trạng thái đơn hàng
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CartPage; 