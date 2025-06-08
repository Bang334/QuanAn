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
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocalDining as LocalDiningIcon,
  Receipt as ReceiptIcon,
  NotificationsActive as NotificationsActiveIcon,
  Restaurant as RestaurantIcon,
  RestaurantMenu as RestaurantMenuIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  DirectionsRun as DirectionsRunIcon,
  AccessTime as AccessTimeIcon,
  TableRestaurant as TableRestaurantIcon,
  Money as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import orderService from '../../services/orderService';
import { API_URL } from '../../config';

const DashboardPage = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({
    readyItems: 0,
    paymentRequests: 0,
    tablesOccupied: 0,
    tablesAvailable: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch orders from the last 24 hours
      const ordersResponse = await axios.get(`${API_URL}/api/orders?hours_ago=24`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch tables
      const tablesResponse = await axios.get(`${API_URL}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter orders that have at least one ready item or are in payment_requested status
      const filteredOrders = ordersResponse.data.filter(order => 
        order.status === 'payment_requested' || 
        order.OrderItems.some(item => item.status === 'ready') ||
        order.status === 'pending'
      );
      
      setOrders(filteredOrders);
      setTables(tablesResponse.data);
      
      // Calculate statistics
      const readyItems = filteredOrders.reduce(
        (count, order) => count + order.OrderItems.filter(item => item.status === 'ready').length, 
        0
      );
      
      const paymentRequests = filteredOrders.filter(
        order => order.status === 'payment_requested'
      ).length;
      
      const tablesOccupied = tablesResponse.data.filter(
        table => table.status === 'occupied'
      ).length;
      
      const tablesAvailable = tablesResponse.data.filter(
        table => table.status === 'available'
      ).length;
      
      const pendingOrders = filteredOrders.filter(
        order => order.status === 'pending'
      ).length;
      
      setStats({
        readyItems,
        paymentRequests,
        tablesOccupied,
        tablesAvailable,
        pendingOrders
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu tổng quan');
      setLoading(false);
    }
  };

  const handleServeItem = async (orderId, itemId) => {
    try {
      await orderService.serveOrderItem(itemId);
      fetchDashboardData(); // Refresh all data
    } catch (err) {
      console.error('Error serving item:', err);
      setError('Không thể cập nhật trạng thái món ăn');
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await orderService.processPayment(orderId, 'cash');
      fetchDashboardData(); // Refresh all data
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Không thể xác nhận thanh toán');
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'processing': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'payment_requested': return 'Yêu cầu thanh toán';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
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
      case 'cancelled': return 'error';
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
  
  const getTableStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Có khách';
      case 'reserved': return 'Đã đặt trước';
      default: return status;
    }
  };
  
  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'reserved': return 'warning';
      default: return 'default';
    }
  };
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };
  
  // Filter orders based on tab
  const getFilteredOrders = () => {
    switch (tabValue) {
      case 0: // Tất cả
        return orders;
      case 1: // Đơn có món sẵn sàng
        return orders.filter(order => 
          order.OrderItems.some(item => item.status === 'ready')
        );
      case 2: // Yêu cầu thanh toán
        return orders.filter(order => order.status === 'payment_requested');
      case 3: // Đơn chờ xác nhận
        return orders.filter(order => order.status === 'pending');
      default:
        return orders;
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

  return (
    <Box>
      <Typography variant="h4" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <RestaurantIcon sx={{ mr: 1 }} />
        Tổng quan phục vụ
      </Typography>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56, mb: 2 }}>
                <RestaurantMenuIcon fontSize="large" />
              </Avatar>
              <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
                {stats.readyItems}
              </Typography>
              <Typography variant="body2" component="div" color="text.secondary">
                Món ăn sẵn sàng phục vụ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: alpha(theme.palette.error.main, 0.1), height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56, mb: 2 }}>
                <MoneyIcon fontSize="large" />
              </Avatar>
              <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
                {stats.paymentRequests}
              </Typography>
              <Typography variant="body2" component="div" color="text.secondary">
                Yêu cầu thanh toán
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1), height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56, mb: 2 }}>
                <TableRestaurantIcon fontSize="large" />
              </Avatar>
              <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
                {stats.tablesAvailable}
              </Typography>
              <Typography variant="body2" component="div" color="text.secondary">
                Bàn trống
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56, mb: 2 }}>
                <DirectionsRunIcon fontSize="large" />
              </Avatar>
              <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
                {stats.pendingOrders}
              </Typography>
              <Typography variant="body2" component="div" color="text.secondary">
                Đơn chờ xác nhận
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Table Status Overview */}
      <Typography variant="h5" component="div" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <TableRestaurantIcon sx={{ mr: 1 }} />
        Tình trạng bàn
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {tables.map((table) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
            <Paper 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                borderTop: `4px solid ${theme.palette[getTableStatusColor(table.status)]?.main || theme.palette.grey[500]}`
              }}
            >
              <Typography variant="h6" component="div" fontWeight="bold">
                Bàn {table.name}
              </Typography>
              <Chip 
                label={getTableStatusLabel(table.status)}
                color={getTableStatusColor(table.status)}
                size="small"
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" component="div" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {table.capacity} người
                {table.order && <Box component="span" sx={{ display: 'block' }}>Đơn: #{table.order.id}</Box>}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Orders Section */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab 
              label="Tất cả" 
              icon={<Badge badgeContent={orders.length} color="primary"><RestaurantIcon /></Badge>} 
              iconPosition="start"
            />
            <Tab 
              label="Món sẵn sàng" 
              icon={<Badge badgeContent={stats.readyItems} color="info"><RestaurantMenuIcon /></Badge>} 
              iconPosition="start"
            />
            <Tab 
              label="Yêu cầu thanh toán" 
              icon={<Badge badgeContent={stats.paymentRequests} color="error"><ReceiptIcon /></Badge>} 
              iconPosition="start"
            />
            <Tab 
              label="Chờ xác nhận" 
              icon={<Badge badgeContent={stats.pendingOrders} color="default"><AccessTimeIcon /></Badge>} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {getFilteredOrders().length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography component="div">Không có đơn hàng nào</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {getFilteredOrders().map((order) => (
              <Grid item xs={12} md={6} key={order.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    borderTop: `4px solid ${theme.palette[getStatusColor(order.status)]?.main || theme.palette.grey[500]}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: theme.palette[getStatusColor(order.status)]?.main || theme.palette.grey[500], mr: 1 }}>
                        <Typography variant="body2" component="div">{order.tableId}</Typography>
                      </Avatar>
                      <Typography variant="h6" component="div">
                        Đơn #{order.id}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Thời gian: {formatDateTime(order.createdAt)}
                  </Typography>
                  
                  {order.notes && (
                    <Alert severity="info" sx={{ my: 1, fontSize: '0.875rem' }}>
                      {order.notes}
                    </Alert>
                  )}
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
                    {order.OrderItems.map((item) => (
                      <ListItem 
                        key={item.id} 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderLeft: item.status === 'ready' ? `4px solid ${theme.palette.info.main}` : 'none',
                          bgcolor: item.status === 'ready' ? alpha(theme.palette.info.main, 0.05) : 'transparent'
                        }}
                        secondaryAction={
                          item.status === 'ready' && (
                            <Button 
                              size="small"
                              variant="contained" 
                              color="primary"
                              onClick={() => handleServeItem(order.id, item.id)}
                              startIcon={<CheckCircleOutlineIcon />}
                            >
                              Phục vụ
                            </Button>
                          )
                        }
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar 
                            variant="rounded" 
                            sx={{ width: 32, height: 32 }}
                            src={item.MenuItem?.image || `https://via.placeholder.com/32?text=${encodeURIComponent(item.MenuItem?.name?.[0] || 'M')}`}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" component="div" fontWeight={item.status === 'ready' ? 'bold' : 'normal'}>
                                {item.MenuItem.name} x{item.quantity}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={getItemStatusLabel(item.status)} 
                                color={getStatusColor(item.status)} 
                                sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' } }} 
                              />
                            </Box>
                          }
                          secondary={item.notes}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2" component="div">
                      Tổng: <strong>{order.OrderItems.reduce((sum, item) => sum + item.quantity, 0)} món</strong>
                    </Typography>
                    
                    {order.status === 'payment_requested' && (
                      <Button 
                        variant="contained" 
                        color="success"
                        onClick={() => handleConfirmPayment(order.id)}
                        startIcon={<MoneyIcon />}
                      >
                        Xác nhận thanh toán
                      </Button>
                    )}
                    
                    {order.status === 'pending' && (
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => orderService.acceptOrder(order.id).then(fetchDashboardData)}
                      >
                        Xác nhận đơn
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage; 