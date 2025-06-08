import { useState } from 'react';
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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const CartPage = () => {
  const { cartItems, tableId, updateCartItem, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const navigate = useNavigate();

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
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Giỏ hàng trống
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Hãy thêm món ăn vào giỏ hàng
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/menu')}
          >
            Xem thực đơn
          </Button>
        </Paper>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <List>
              {cartItems.map((item) => (
                <Box key={item.id}>
                  <ListItem>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={6} sm={6}>
                        <ListItemText
                          primary={item.name}
                          secondary={formatPrice(item.price)}
                        />
                      </Grid>
                      <Grid item xs={4} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1, minWidth: '24px', textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid item xs={2} sm={2} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">
                          {formatPrice(item.price * item.quantity)}
                        </Typography>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => removeFromCart(item.id)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
            
            <Box sx={{ p: 2 }}>
              <TextField
                label="Ghi chú đặc biệt"
                placeholder="Ví dụ: Không hành, ít cay..."
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                value={notes}
                onChange={handleNotesChange}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Tổng tiền:
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {formatPrice(getTotalPrice())}
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined"
              onClick={() => navigate('/menu')}
            >
              Tiếp tục đặt món
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đặt món'}
            </Button>
          </Box>
        </>
      )}
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Xác nhận đặt món</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn đặt {cartItems.length} món cho bàn {tableId}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmOrder} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Xác nhận'}
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