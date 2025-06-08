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
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';

const DashboardPage = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/orders/kitchen/view`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setOrders(response.data);
      filterOrdersByTab(response.data, tabValue);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu đơn hàng');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Cập nhật dữ liệu mỗi 30 giây
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    filterOrdersByTab(orders, tabValue);
  }, [tabValue]);
  
  const filterOrdersByTab = (orders, tabIndex) => {
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    switch (tabIndex) {
      case 0: // Tất cả đơn hàng
        setFilteredOrders(orders);
        break;
      case 1: // Đơn hàng đang chờ
        setFilteredOrders(orders.filter(order => 
          order.status === 'pending' || 
          order.OrderItems.some(item => item.status === 'pending')
        ));
        break;
      case 2: // Đơn hàng đang xử lý
        setFilteredOrders(orders.filter(order => 
          order.status === 'processing' || 
          order.OrderItems.some(item => item.status === 'cooking')
        ));
        break;
      case 3: // Đơn hàng hoàn thành
        setFilteredOrders(orders.filter(order => 
          order.status === 'completed' || order.status === 'ready'
        ));
        break;
      default:
        setFilteredOrders(orders);
    }
  };

  const handleUpdateItemStatus = async (orderId, itemId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/orders/items/${itemId}/status`, 
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Cập nhật state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedItems = order.OrderItems.map(item => 
              item.id === itemId ? { ...item, status } : item
            );
            
            // Kiểm tra trạng thái của tất cả các món
            const allCompleted = updatedItems.every(item => item.status === 'completed');
            const allReady = updatedItems.every(item => item.status === 'completed' || item.status === 'ready');
            
            let newStatus = order.status;
            if (allCompleted) {
              newStatus = 'completed';
            } else if (allReady) {
              newStatus = 'ready';
            } else if (updatedItems.some(item => item.status === 'cooking')) {
              newStatus = 'processing';
            }
            
            return {
              ...order,
              OrderItems: updatedItems,
              status: newStatus
            };
          }
          return order;
        })
      );
      
      // Cập nhật lại danh sách lọc
      filterOrdersByTab(orders, tabValue);
      
    } catch (err) {
      console.error('Error updating item status:', err);
      setError('Không thể cập nhật trạng thái món ăn');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'processing': return 'Đang xử lý';
      case 'cooking': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'payment_requested': return 'Yêu cầu thanh toán';
      case 'paid': return 'Đã thanh toán';
      default: return status;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'cooking': return 'info';
      case 'ready': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'payment_requested': return 'secondary';
      case 'paid': return 'success';
      default: return 'default';
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const getPendingCount = () => {
    return orders.filter(order => 
      order.status === 'pending' || 
      order.OrderItems.some(item => item.status === 'pending')
    ).length;
  };
  
  const getProcessingCount = () => {
    return orders.filter(order => 
      order.status === 'processing' || 
      order.OrderItems.some(item => item.status === 'cooking')
    ).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản lý đơn hàng - Bếp
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tất cả đơn hàng" />
          <Tab 
            label={
              <Badge badgeContent={getPendingCount()} color="error">
                Đơn hàng đang chờ
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getProcessingCount()} color="warning">
                Đơn hàng đang xử lý
              </Badge>
            } 
          />
          <Tab label="Đơn hàng hoàn thành" />
        </Tabs>
      </Box>
      
      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Không có đơn hàng nào</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} md={6} key={order.id}>
              <Paper 
                sx={{ 
                  p: 2,
                  borderTop: `4px solid ${theme.palette[getStatusColor(order.status)].main}`,
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Bàn {order.Table?.name || order.tableId} - Đơn #{order.id}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status)}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Thời gian: {new Date(order.createdAt).toLocaleString()}
                </Typography>
                
                {order.notes && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      p: 1, 
                      borderRadius: 1,
                      mb: 2
                    }}
                  >
                    <strong>Ghi chú:</strong> {order.notes}
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                {order.OrderItems?.map((item) => (
                  <Card key={item.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">
                          {item.MenuItem?.name || item.menuItemId} x{item.quantity}
                        </Typography>
                        <Chip 
                          size="small"
                          label={getStatusLabel(item.status)}
                          color={getStatusColor(item.status)}
                        />
                      </Box>
                      {item.notes && (
                        <Typography variant="body2" color="text.secondary">
                          Ghi chú: {item.notes}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      {item.status === 'pending' && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          onClick={() => handleUpdateItemStatus(order.id, item.id, 'cooking')}
                        >
                          Bắt đầu chế biến
                        </Button>
                      )}
                      
                      {item.status === 'cooking' && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => handleUpdateItemStatus(order.id, item.id, 'completed')}
                        >
                          Hoàn thành
                        </Button>
                      )}
                      
                      {item.status === 'completed' && (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="warning"
                          onClick={() => handleUpdateItemStatus(order.id, item.id, 'cooking')}
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