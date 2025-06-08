import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  TableBar as TableBarIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeUsers: 0,
    availableTables: 0,
    totalTables: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy thống kê từ API
        const statsResponse = await axios.get(`${API_URL}/api/orders/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Lấy đơn hàng gần đây
        const ordersResponse = await axios.get(`${API_URL}/api/orders?limit=5`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        setStats(statsResponse.data);
        
        // Format dữ liệu đơn hàng để hiển thị
        const formattedOrders = ordersResponse.data.map(order => ({
          id: order.id,
          tableId: order.tableId,
          status: order.status,
          total: order.totalAmount,
          items: order.OrderItems.length,
          time: new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }));
        
        setRecentOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({
          totalOrders: 0,
          todayOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          activeUsers: 0,
          availableTables: 0,
          totalTables: 0,
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'preparing': return 'warning.main';
      case 'ready': return 'info.main';
      case 'served': return 'success.main';
      case 'completed': return 'success.main';
      case 'cancelled': return 'error.main';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'served': return 'Đã phục vụ';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };
  
  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bảng điều khiển
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.totalOrders}</Typography>
                <Typography variant="body2" color="text.secondary">Tổng đơn hàng</Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
              +{stats.todayOrders} hôm nay
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RestaurantIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{formatPrice(stats.totalRevenue)}</Typography>
                <Typography variant="body2" color="text.secondary">Tổng doanh thu</Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
              +{formatPrice(stats.todayRevenue)} hôm nay
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.activeUsers}</Typography>
                <Typography variant="body2" color="text.secondary">Nhân viên hoạt động</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TableBarIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.availableTables}/{stats.totalTables}</Typography>
                <Typography variant="body2" color="text.secondary">Bàn trống</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Đơn hàng gần đây" />
            <Divider />
            <CardContent>
              <List>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <Box key={order.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" aria-label="view" onClick={() => handleViewOrder(order.id)}>
                            <VisibilityIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`Đơn #${order.id} - Bàn ${order.tableId}`}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" component="span">
                                {order.items} món - {formatPrice(order.total)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                component="span" 
                                sx={{ color: getStatusColor(order.status) }}
                              >
                                {getStatusText(order.status)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                    Không có đơn hàng gần đây
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Thống kê doanh thu" />
            <Divider />
            <CardContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Biểu đồ doanh thu sẽ được hiển thị ở đây
              </Typography>
              <Box sx={{ height: 300, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Đồ thị doanh thu theo thời gian
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage; 