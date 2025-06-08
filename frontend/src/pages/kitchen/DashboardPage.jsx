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
  alpha,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { API_URL } from '../../config';
import * as inventoryService from '../../services/inventoryService';

const DashboardPage = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [updatingItems, setUpdatingItems] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const fetchOrders = async (showNotification = false) => {
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
      
      // Show notification if requested (manual refresh)
      if (showNotification) {
        setSnackbar({
          open: true,
          message: 'Danh sách đơn hàng đã được cập nhật!',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu đơn hàng');
      setLoading(false);
      
      // Show error notification
      setSnackbar({
        open: true,
        message: 'Không thể tải dữ liệu đơn hàng',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Cập nhật dữ liệu mỗi 30 giây
    const interval = setInterval(() => {
      fetchOrders();
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    filterOrdersByTab(orders, tabValue);
  }, [tabValue, orders]);
  
  const filterOrdersByTab = (orders, tabIndex) => {
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    let filtered = [];
    
    switch (tabIndex) {
      case 0: // Tất cả đơn hàng
        filtered = [...orders];
        break;
      case 1: // Đơn hàng đang chờ
        filtered = orders.filter(order => 
          order.status === 'pending' || 
          order.OrderItems.some(item => item.status === 'pending')
        );
        // Sắp xếp theo thời gian tạo (cũ nhất lên đầu)
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 2: // Đơn hàng đang xử lý
        filtered = orders.filter(order => 
          order.status === 'processing' || 
          order.OrderItems.some(item => item.status === 'cooking')
        );
        // Sắp xếp theo thời gian tạo (cũ nhất lên đầu)
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 3: // Đơn hàng hoàn thành
        filtered = orders.filter(order => 
          order.status === 'completed' || order.status === 'ready'
        );
        // Sắp xếp theo thời gian hoàn thành (mới nhất lên đầu)
        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        break;
      default:
        filtered = [...orders];
    }
    
    setFilteredOrders(filtered);
  };

  const handleUpdateItemStatus = async (orderId, itemId, status) => {
    try {
      // Set loading state for this specific item
      setUpdatingItems(prev => [...prev, itemId]);
      
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/orders/items/${itemId}/status`, 
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Get the updated order status from the response
      const { orderItem, orderStatus } = response.data;
      
      // Nếu món ăn được đánh dấu là sẵn sàng, cập nhật số lượng nguyên liệu
      if (status === 'ready') {
        try {
          // Tìm thông tin món ăn từ danh sách orders
          const order = orders.find(o => o.id === orderId);
          const item = order?.OrderItems.find(i => i.id === itemId);
          
          if (item && item.menuItemId) {
            // Gọi API để cập nhật số lượng nguyên liệu
            await inventoryService.processIngredientUsage({
              orderId,
              orderItems: [{
                orderItemId: itemId,
                menuItemId: item.menuItemId,
                quantity: item.quantity
              }]
            });
            
            console.log('Ingredient quantities updated successfully');
          }
        } catch (ingredientError) {
          console.error('Error updating ingredient quantities:', ingredientError);
          // Không hiển thị lỗi này cho người dùng, chỉ ghi log
        }
      }
      
      // Cập nhật state
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedItems = order.OrderItems.map(item => 
              item.id === itemId ? { ...item, status: orderItem.status } : item
            );
            
            return {
              ...order,
              OrderItems: updatedItems,
              status: orderStatus || order.status // Use the status from the backend if available
            };
          }
          return order;
        });
        
        // Cập nhật lại danh sách lọc với orders mới
        filterOrdersByTab(updatedOrders, tabValue);
        
        return updatedOrders;
      });
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: status === 'ready' ? 'Món ăn đã được đánh dấu hoàn thành!' : 
                 status === 'cooking' ? 'Món ăn đã được đánh dấu đang chế biến!' : 
                 'Trạng thái món ăn đã được cập nhật!',
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error updating item status:', err);
      setError('Không thể cập nhật trạng thái món ăn');
      
      // Hiển thị thông báo lỗi
      setSnackbar({
        open: true,
        message: 'Không thể cập nhật trạng thái món ăn',
        severity: 'error'
      });
    } finally {
      // Remove loading state for this item
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
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
      default: return 'primary';
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

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 0 }}>
          Quản lý đơn hàng - Bếp
        </Typography>
        
        <Tooltip title="Làm mới danh sách">
          <IconButton 
            onClick={() => fetchOrders(true)} 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '& .MuiTab-root': { 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 'auto', sm: 120 }
            }
          }}
        >
          <Tab label="Tất cả đơn hàng" />
          <Tab 
            label={
              <Badge badgeContent={getPendingCount()} color="error">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Đang chờ</span>
                </span>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getProcessingCount()} color="warning">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Đang xử lý</span>
                </span>
              </Badge>
            } 
          />
          <Tab label="Hoàn thành" />
        </Tabs>
      </Box>
      
      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Không có đơn hàng nào</Typography>
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredOrders.map((order) => {
            const statusColor = getStatusColor(order.status);
            const borderColor = theme.palette[statusColor]?.main || theme.palette.primary.main;
            
            return (
              <Grid item xs={12} sm={6} lg={4} key={order.id}>
                <Paper 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 },
                    borderTop: `4px solid ${borderColor}`,
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  elevation={2}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Bàn {order.Table?.name || order.tableId} - Đơn #{order.id}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(order.status)}
                      color={statusColor}
                      size="small"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                    Thời gian: {new Date(order.createdAt).toLocaleString()}
                  </Typography>
                  
                  {order.notes && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                        p: 1, 
                        borderRadius: 1,
                        mb: 2,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      <strong>Ghi chú:</strong> {order.notes}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ flex: 1, overflow: 'auto', maxHeight: { xs: 300, sm: 350, md: 400 } }}>
                    {order.OrderItems?.map((item) => (
                      <Card key={item.id} sx={{ mb: 1.5, boxShadow: 1 }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '70%' }}>
                              <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: 1, 
                                overflow: 'hidden', 
                                mr: 1.5,
                                flexShrink: 0
                              }}>
                                <img 
                                  src={item.MenuItem?.image || `https://via.placeholder.com/40x40?text=${encodeURIComponent(item.MenuItem?.name || 'Món ăn')}`}
                                  alt={item.MenuItem?.name || 'Món ăn'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </Box>
                              <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 500 }}>
                                {item.MenuItem?.name || item.menuItemId} x{item.quantity}
                              </Typography>
                            </Box>
                            <Chip 
                              size="small"
                              label={getStatusLabel(item.status)}
                              color={getStatusColor(item.status)}
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          </Box>
                          {item.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, mt: 0.5 }}>
                              Ghi chú: {item.notes}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                          {item.status === 'pending' && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              onClick={() => handleUpdateItemStatus(order.id, item.id, 'cooking')}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                              disabled={order.status === 'pending' || updatingItems.includes(item.id)}
                              title={order.status === 'pending' ? 'Đơn hàng cần được xác nhận trước khi chế biến' : ''}
                              startIcon={updatingItems.includes(item.id) ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                              {updatingItems.includes(item.id) ? 'Đang xử lý...' : 'Bắt đầu chế biến'}
                            </Button>
                          )}
                          
                          {item.status === 'cooking' && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => handleUpdateItemStatus(order.id, item.id, 'ready')}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                              disabled={updatingItems.includes(item.id)}
                              startIcon={updatingItems.includes(item.id) ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                              {updatingItems.includes(item.id) ? 'Đang xử lý...' : 'Hoàn thành'}
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardPage; 