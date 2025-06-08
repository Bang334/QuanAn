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
        status: 'processing',
        items: [
          { id: 1, name: 'Phở bò', quantity: 2, note: 'Không hành' },
          { id: 2, name: 'Chả giò', quantity: 1, note: '' },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        tableId: 5,
        status: 'processing',
        items: [
          { id: 3, name: 'Bún chả', quantity: 1, note: 'Nhiều nước mắm' },
          { id: 4, name: 'Gỏi cuốn', quantity: 2, note: '' },
        ],
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ];

    setOrders(mockOrders);
    setLoading(false);
  }, []);

  const handleUpdateStatus = (orderId, itemId, status) => {
    // Trong thực tế sẽ gọi API để cập nhật trạng thái
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          );
          
          // Nếu tất cả items đã hoàn thành, cập nhật trạng thái đơn hàng
          const allCompleted = updatedItems.every(item => item.status === 'completed');
          
          return {
            ...order,
            items: updatedItems,
            status: allCompleted ? 'ready' : order.status
          };
        }
        return order;
      })
    );
  };

  if (loading) {
    return <Typography>Đang tải...</Typography>;
  }

  if (error) {
    return <Typography color="error">Lỗi: {error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Đơn hàng cần xử lý
      </Typography>
      
      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Không có đơn hàng nào cần xử lý</Typography>
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
                    label={
                      order.status === 'processing' ? 'Đang xử lý' : 
                      order.status === 'ready' ? 'Sẵn sàng phục vụ' : 'Hoàn thành'
                    }
                    color={
                      order.status === 'processing' ? 'warning' : 
                      order.status === 'ready' ? 'info' : 'success'
                    }
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Thời gian: {new Date(order.createdAt).toLocaleTimeString()}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {order.items.map((item) => (
                  <Card key={item.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">
                          {item.name} x{item.quantity}
                        </Typography>
                        <Chip 
                          size="small"
                          label={item.status === 'completed' ? 'Hoàn thành' : 'Đang chế biến'}
                          color={item.status === 'completed' ? 'success' : 'warning'}
                        />
                      </Box>
                      {item.note && (
                        <Typography variant="body2" color="text.secondary">
                          Ghi chú: {item.note}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      {!item.status || item.status !== 'completed' ? (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => handleUpdateStatus(order.id, item.id, 'completed')}
                        >
                          Hoàn thành
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="warning"
                          onClick={() => handleUpdateStatus(order.id, item.id, 'processing')}
                        >
                          Đánh dấu chưa hoàn thành
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage; 