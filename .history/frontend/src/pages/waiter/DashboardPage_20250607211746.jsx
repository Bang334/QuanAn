import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import orderService from '../../services/orderService';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter orders that have at least one ready item or are in payment_requested status
      const filteredOrders = response.data.filter(order => 
        order.status === 'payment_requested' || 
        order.OrderItems.some(item => item.status === 'ready')
      );
      
      setOrders(filteredOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn hàng');
      setLoading(false);
    }
  };

  const handleServeItem = async (orderId, itemId) => {
    try {
      await orderService.serveOrderItem(itemId);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            // Update the specific item status
            const updatedItems = order.OrderItems.map(item => 
              item.id === itemId ? { ...item, status: 'served' } : item
            );
            
            // Check if all items are served
            const allServed = updatedItems.every(item => 
              item.status === 'served' || item.status === 'cancelled'
            );
            
            // Update order status if all items are served
            return {
              ...order,
              OrderItems: updatedItems,
              status: allServed ? 'served' : order.status
            };
          }
          return order;
        })
      );
    } catch (err) {
      console.error('Error serving item:', err);
      setError('Không thể cập nhật trạng thái món ăn');
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await orderService.processPayment(orderId, 'cash');
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Không thể xác nhận thanh toán');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'payment_requested': return 'Yêu cầu thanh toán';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'processing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'success';
      case 'payment_requested': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getItemStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ chế biến';
      case 'cooking': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Đơn hàng cần phục vụ
      </Typography>
      
      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Không có đơn hàng nào cần phục vụ</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} md={6} key={order.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Bàn {order.tableId} - Đơn #{order.id}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status)}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Thời gian: {new Date(order.createdAt).toLocaleTimeString()}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {order.OrderItems.map((item) => (
                  <Box key={item.id} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1">
                        {item.MenuItem.name} x{item.quantity}
                        <Chip 
                          size="small" 
                          label={getItemStatusLabel(item.status)} 
                          color={getStatusColor(item.status)} 
                          sx={{ ml: 1 }} 
                        />
                      </Typography>
                    </Box>
                    
                    {item.status === 'ready' && (
                      <Button 
                        size="small"
                        variant="contained" 
                        color="primary"
                        onClick={() => handleServeItem(order.id, item.id)}
                      >
                        Phục vụ
                      </Button>
                    )}
                  </Box>
                ))}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {order.status === 'payment_requested' && (
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => handleConfirmPayment(order.id)}
                    >
                      Xác nhận thanh toán
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage; 