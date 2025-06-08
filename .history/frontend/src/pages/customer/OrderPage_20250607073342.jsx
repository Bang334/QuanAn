import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  EventNote as OrderIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OrderPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { cartItems, tableId, updateCartItem, removeFromCart, getCartTotal, clearCart } = useCart();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/orders/table/${tableId}`);
        setOrders(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [tableId, navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
      
      // Cập nhật danh sách đơn hàng
      const updatedOrdersResponse = await axios.get(`${API_URL}/api/orders/table/${tableId}`);
      setOrders(updatedOrdersResponse.data);
      
      // Chuyển sang tab đơn hàng
      setActiveTab(1);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Đặt hàng thất bại');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Đặt hàng thất bại',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = (order) => {
    setCurrentOrder(order);
    setDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('vi-VN', options);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Đang chờ', color: 'warning' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', color: 'info' };
      case 'PREPARING':
        return { label: 'Đang chuẩn bị', color: 'info' };
      case 'READY':
        return { label: 'Sẵn sàng phục vụ', color: 'success' };
      case 'SERVED':
        return { label: 'Đã phục vụ', color: 'success' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', color: 'success' };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'error' };
      default:
        return { label: 'Không xác định', color: 'default' };
    }
  };

  if (!tableId) {
    return (
      <Box textAlign="center" py={4} px={2}>
        <Typography variant="h5" gutterBottom>
          Vui lòng chọn bàn trước khi xem đơn hàng
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

  const renderCartTab = () => (
    <Box sx={{ width: '100%', mt: 2 }}>
      {cartItems.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <CartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
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
            <List sx={{ width: '100%' }}>
              {cartItems.map((item) => (
                <Box key={item.id}>
                  <ListItem 
                    sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      py: { xs: 2, sm: 1 },
                    }}
                  >
                    <Box sx={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: { xs: 1, sm: 0 }
                    }}>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {item.name}
                          </Typography>
                        }
                        secondary={formatPrice(item.price)}
                      />
                      <Typography variant="body2" sx={{ display: { xs: 'block', sm: 'none' } }}>
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'space-between', sm: 'flex-end' }
                    }}>
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
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 0, sm: 2 } }}>
                        <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
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
                      </Box>
                    </Box>
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
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2
              }}>
                <Box>
                  <Typography variant="subtitle1">Tổng tiền:</Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {formatPrice(getCartTotal())}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/menu')}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    startIcon={<BackIcon />}
                  >
                    Tiếp tục đặt món
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCheckout}
                    disabled={loading}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    startIcon={loading ? <CircularProgress size={24} /> : <OrderIcon />}
                  >
                    Đặt món
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );

  const renderOrdersTab = () => (
    <Box sx={{ width: '100%', mt: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <OrderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Chưa có đơn hàng nào
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Hãy đặt món để tạo đơn hàng mới
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setActiveTab(0)}
          >
            Đến giỏ hàng
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => {
            const { label, color } = getStatusLabel(order.status);
            return (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        Đơn #{order.id}
                      </Typography>
                      <Chip
                        label={label}
                        color={color}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatDate(order.createdAt)}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <List dense>
                      {order.items.slice(0, 3).map((item) => (
                        <ListItem key={item.id} disablePadding sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={`${item.quantity}x ${item.menuItem?.name || 'Món đã xóa'}`}
                            secondary={formatPrice(item.price)}
                          />
                        </ListItem>
                      ))}
                      
                      {order.items.length > 3 && (
                        <ListItem disablePadding sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={`Và ${order.items.length - 3} món khác...`}
                          />
                        </ListItem>
                      )}
                    </List>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="subtitle2">Tổng cộng:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(order.items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<InfoIcon />}
                      onClick={() => handleViewOrderDetails(order)}
                    >
                      Chi tiết
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Đơn hàng - Bàn {tableId}
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={isMobile ? "Giỏ hàng" : "Giỏ hàng hiện tại"}
            icon={isMobile ? <CartIcon /> : null}
            iconPosition="start"
          />
          <Tab
            label={isMobile ? "Đơn hàng" : "Lịch sử đơn hàng"}
            icon={isMobile ? <OrderIcon /> : null}
            iconPosition="start"
          />
        </Tabs>
        
        {activeTab === 0 && renderCartTab()}
        {activeTab === 1 && renderOrdersTab()}
      </Paper>
      
      {/* Dialog xác nhận đặt món */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="confirm-order-dialog-title"
      >
        <DialogTitle id="confirm-order-dialog-title">
          Xác nhận đặt món
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn đặt {cartItems.length} món với tổng giá trị {formatPrice(getCartTotal())}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmOrder} 
            color="primary" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={24} /> : null}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog chi tiết đơn hàng */}
      <Dialog
        open={detailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        {currentOrder && (
          <>
            <DialogTitle>
              Chi tiết đơn hàng #{currentOrder.id}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Trạng thái:</Typography>
                  <Chip
                    label={getStatusLabel(currentOrder.status).label}
                    color={getStatusLabel(currentOrder.status).color}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" gutterBottom>
                  Thời gian đặt: {formatDate(currentOrder.createdAt)}
                </Typography>
                {currentOrder.notes && (
                  <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'background.default' }}>
                    <Typography variant="body2" color="text.secondary">
                      Ghi chú: {currentOrder.notes}
                    </Typography>
                  </Paper>
                )}
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Các món đã đặt
              </Typography>
              
              <List>
                {currentOrder.items.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {item.quantity}x {item.menuItem?.name || 'Món đã xóa'}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {formatPrice(item.price)} / món
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              Ghi chú: {item.notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="subtitle2">
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">Tổng tiền:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatPrice(currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailsDialog} color="primary">
                Đóng
              </Button>
              <Button 
                onClick={() => {
                  handleCloseDetailsDialog();
                  navigate(`/status/${currentOrder.id}`);
                }} 
                color="primary" 
                variant="contained"
              >
                Xem trạng thái
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderPage;
