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
} from '@mui/material';
import axios from 'axios';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Giả lập dữ liệu đơn hàng - trong thực tế sẽ lấy từ API
    const mockOrders = [
      {
        id: 1,
        tableId: 3,
        status: 'ready',
        items: [
          { id: 1, name: 'Phở bò', quantity: 2, status: 'completed' },
          { id: 2, name: 'Chả giò', quantity: 1, status: 'completed' },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        tableId: 5,
        status: 'processing',
        items: [
          { id: 3, name: 'Bún chả', quantity: 1, status: 'completed' },
          { id: 4, name: 'Gỏi cuốn', quantity: 2, status: 'processing' },
        ],
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: 3,
        tableId: 7,
        status: 'payment_requested',
        items: [
          { id: 5, name: 'Cơm tấm', quantity: 1, status: 'completed' },
          { id: 6, name: 'Nước chanh', quantity: 1, status: 'completed' },
        ],
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
    ];

    setOrders(mockOrders);
    setLoading(false);
  }, []);

  const handleServeOrder = (orderId) => {
    // Trong thực tế sẽ gọi API để cập nhật trạng thái
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'served' } 
          : order
      )
    );
  };

  const handleConfirmPayment = (orderId) => {
    // Trong thực tế sẽ gọi API để cập nhật trạng thái
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'completed' } 
          : order
      )
    );
  };

  if (loading) {
    return <Typography>Đang tải...</Typography>;
  }

  if (error) {
    return <Typography color="error">Lỗi: {error}</Typography>;
  }

  const getStatusLabel = (status) => {
    switch (status) {
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
      case 'processing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'success';
      case 'payment_requested': return 'error';
      case 'completed': return 'success';
      default: return 'default';
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
                
                {order.items.map((item) => (
                  <Box key={item.id} sx={{ mb: 1 }}>
                    <Typography variant="body1">
                      {item.name} x{item.quantity}
                      {item.status === 'completed' && 
                        <Chip 
                          size="small" 
                          label="Sẵn sàng" 
                          color="success" 
                          sx={{ ml: 1 }} 
                        />
                      }
                    </Typography>
                  </Box>
                ))}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {order.status === 'ready' && (
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleServeOrder(order.id)}
                    >
                      Phục vụ
                    </Button>
                  )}
                  
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