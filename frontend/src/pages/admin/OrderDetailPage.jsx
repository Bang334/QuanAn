import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setOrder(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handleUpdateOrderStatus = async (newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/orders/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      setOrder({
        ...order,
        status: newStatus
      });
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const handleUpdatePayment = async (paymentStatus, paymentMethod) => {
    try {
      await axios.put(
        `${API_URL}/api/orders/${id}/payment`,
        {
          paymentStatus,
          paymentMethod
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      setOrder({
        ...order,
        paymentStatus,
        paymentMethod
      });
      
    } catch (error) {
      console.error('Error updating payment:', error);
      setError('Lỗi khi cập nhật thông tin thanh toán');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'payment_requested': return 'Yêu cầu thanh toán';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'preparing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'payment_requested': return 'secondary';
      default: return 'default';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ tín dụng/ghi nợ';
      case 'momo': return 'MoMo';
      case 'zalopay': return 'ZaloPay';
      case 'vnpay': return 'VNPay';
      default: return 'Chưa thanh toán';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/orders')}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/orders')}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>
        <Alert severity="warning">Không tìm thấy đơn hàng</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          color="primary" 
          onClick={() => navigate('/admin/orders')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Chi tiết đơn hàng #{order.id}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Thông tin đơn hàng</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Bàn:</strong> {order.tableId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thời gian tạo:</strong> {formatDate(order.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Trạng thái:</strong>{' '}
                    <Chip 
                      size="small" 
                      label={getStatusLabel(order.status)} 
                      color={getStatusColor(order.status)} 
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Thanh toán:</strong>{' '}
                    <Chip 
                      size="small" 
                      label={order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                      color={order.paymentStatus === 'paid' ? 'success' : 'default'} 
                    />
                  </Typography>
                  {order.paymentStatus === 'paid' && (
                    <Typography variant="body2">
                      <strong>Phương thức:</strong> {getPaymentMethodLabel(order.paymentMethod)}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Tổng tiền:</strong> <Typography component="span" color="primary.main" fontWeight="bold">{formatPrice(order.totalAmount)}</Typography>
                  </Typography>
                </Grid>
                {order.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Ghi chú:</strong> {order.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RestaurantMenuIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Danh sách món</Typography>
              </Box>
              <List>
                {order.OrderItems?.map((item, index) => (
                  <div key={item.id}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 2, width: 60, height: 60, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                          <img 
                            src={item.MenuItem?.image || `https://via.placeholder.com/60x60?text=${encodeURIComponent(item.MenuItem?.name || 'Món ăn')}`} 
                            alt={item.MenuItem?.name || 'Món ăn'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography>
                                {item.MenuItem?.name || 'Món #' + item.menuItemId} x{item.quantity}
                              </Typography>
                              <Typography fontWeight="bold">
                                {formatPrice(item.price * item.quantity)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formatPrice(item.price)} / món
                              </Typography>
                              {item.notes && (
                                <Typography variant="body2" color="text.secondary">
                                  Ghi chú: {item.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </Box>
                    </ListItem>
                    {index < order.OrderItems.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Typography variant="h6">
                  Tổng cộng: {formatPrice(order.totalAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventNoteIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Cập nhật trạng thái</Typography>
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                  value={order.status}
                  onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                  label="Trạng thái đơn hàng"
                >
                  <MenuItem value="pending">Chờ xác nhận</MenuItem>
                  <MenuItem value="preparing">Đang chuẩn bị</MenuItem>
                  <MenuItem value="ready">Sẵn sàng phục vụ</MenuItem>
                  <MenuItem value="served">Đã phục vụ</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>

              {order.paymentStatus !== 'paid' && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                    Cập nhật thanh toán
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Phương thức thanh toán</InputLabel>
                    <Select
                      defaultValue=""
                      label="Phương thức thanh toán"
                      onChange={(e) => handleUpdatePayment('paid', e.target.value)}
                    >
                      <MenuItem value="cash">Tiền mặt</MenuItem>
                      <MenuItem value="card">Thẻ tín dụng/ghi nợ</MenuItem>
                      <MenuItem value="momo">MoMo</MenuItem>
                      <MenuItem value="zalopay">ZaloPay</MenuItem>
                      <MenuItem value="vnpay">VNPay</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Thông tin bàn</Typography>
              </Box>
              <Typography variant="body2">
                <strong>Bàn số:</strong> {order.tableId}
              </Typography>
              <Typography variant="body2">
                <strong>Trạng thái bàn:</strong> {order.Table?.status === 'available' ? 'Trống' : 'Đang phục vụ'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={() => navigate(`/admin/tables`)}
                >
                  Xem quản lý bàn
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderDetailPage;
