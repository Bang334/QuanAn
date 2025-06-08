import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Badge,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AccessTime as AccessTimeIcon,
  LocalDining as LocalDiningIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OrderPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { tableId } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin bàn để biết thời gian cập nhật cuối cùng
        const tableResponse = await axios.get(`${API_URL}/api/tables/${tableId}`);
        const tableInfo = tableResponse.data;
        const tableLastUpdated = new Date(tableInfo.updatedAt);
        
        // Lấy tất cả đơn hàng của bàn
        const ordersResponse = await axios.get(`${API_URL}/api/orders/table/${tableId}`);
        
        // Lọc đơn hàng để chỉ hiển thị đơn hàng của khách hàng hiện tại
        // (đơn hàng có thời gian tạo sau khi bàn được cập nhật trạng thái)
        const currentCustomerOrders = ordersResponse.data.filter(order => {
          const orderCreatedAt = new Date(order.createdAt);
          return orderCreatedAt >= tableLastUpdated;
        });
        
        setOrders(currentCustomerOrders);
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

  const handleRequestPayment = async (orderId) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/orders/${orderId}/payment-request`, {
        tableId: tableId
      });
      
      const response = await axios.get(`${API_URL}/api/orders/table/${tableId}`);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error requesting payment:', err);
      setError('Không thể yêu cầu thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Đang chế biến';
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
      case 'preparing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'success';
      case 'payment_requested': return 'error';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const activeOrders = orders.filter(order => 
    !['completed', 'cancelled'].includes(order.status)
  );
  
  const completedOrders = orders.filter(order => 
    ['completed', 'cancelled'].includes(order.status)
  );

  if (!tableId) {
    return (
      <Box textAlign="center" py={4} sx={{ minWidth: '9595vw', maxWidth: '500px', mx: 'auto' }}>
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', minWidth: '97vw', maxWidth: '500px', mx: 'auto' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1 }} /> Đang tải...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', minWidth: '97vw', maxWidth: '500px', mx: 'auto' }}>
        <Typography color="error" variant="h6">Lỗi: {error}</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/menu')}
          sx={{ mt: 2 }}
        >
          Quay lại thực đơn
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%',
        py: { xs: 0, sm: 2 },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          minWidth: '97vw',
          maxWidth: '500px',
          mx: 'auto',
          px: { xs: 0, sm: 2, md: 3 }
        }}
      >
        <Box 
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            width: '100%',
            textAlign: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            py: { xs: 2, sm: 3 },
            borderRadius: { xs: 0, sm: 2 },
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            minWidth: '97vw',
            maxWidth: '500px',
          }}
        >
          <Typography 
            variant="h5" 
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            <ReceiptIcon sx={{ mr: 1 }} />
            Đơn hàng - Bàn {tableId}
          </Typography>
        </Box>
        
        <Paper 
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            borderRadius: { xs: 0, sm: 2 },
            overflow: 'hidden',
            width: '100%',
            boxShadow: { xs: 'none', sm: '0 1px 3px rgba(0,0,0,0.12)' },
            minWidth: '97vw',
            maxWidth: '500px',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                py: { xs: 1.5, sm: 2 },
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              },
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalDiningIcon sx={{ mr: 0.5, fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />
                  <span>Đang xử lý</span>
                  <Badge 
                    badgeContent={activeOrders.length} 
                    color="warning" 
                    sx={{ ml: 0.5 }}
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ mr: 0.5, fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />
                  <span>Hoàn thành</span>
                  <Badge 
                    badgeContent={completedOrders.length} 
                    color="success" 
                    sx={{ ml: 0.5 }}
                  />
                </Box>
              } 
            />
          </Tabs>
        </Paper>
        
        <Box sx={{ minWidth: '98vw'}}>
          {activeTab === 0 ? (
            activeOrders.length === 0 ? (
              <Paper sx={{ 
                p: { xs: 2, sm: 4 }, 
                textAlign: 'center', 
                borderRadius: { xs: 0, sm: 2 },
                boxShadow: { xs: 'none', sm: '0 1px 3px rgba(0,0,0,0.12)' },
                px: { xs: 2, sm: 4 },
                minWidth: '97vw',
                maxWidth: '500px',
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Không có đơn hàng nào đang xử lý
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/menu')}
                  sx={{ mt: 2 }}
                  startIcon={<LocalDiningIcon />}
                  size="medium"
                  fullWidth={!!(window.innerWidth < 600)}
                >
                  Đặt món ngay
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={{ xs: 0, sm: 2 }}>
                {activeOrders.map((order) => (
                  <Grid item xs={12} key={order.id}>
                    <Card sx={{ 
                      borderRadius: { xs: 0, sm: 2 }, 
                      overflow: 'hidden',
                      boxShadow: { xs: 'none', sm: '0 4px 12px rgba(0,0,0,0.1)' },
                      mb: { xs: 2, sm: 0 },
                      border: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, sm: 'none' },
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: { xs: 'none', sm: 'translateY(-4px)' },
                        boxShadow: { xs: 'none', sm: '0 8px 24px rgba(0,0,0,0.15)' },
                      },
                      minWidth: '97vw',
                      maxWidth: '500px',
                    }}>
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          mb: 2,
                          flexWrap: { xs: 'wrap', sm: 'nowrap' }
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: { xs: 1, sm: 0 },
                            width: { xs: '100%', sm: 'auto' }
                          }}>
                            <ReceiptIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                              Đơn #{order.id}
                            </Typography>
                          </Box>
                          <Chip 
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '0.7rem', sm: '0.8rem' },
                              height: { xs: '24px', sm: '32px' }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'text.secondary',
                          mb: 2
                        }}>
                          <AccessTimeIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {formatDateTime(order.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <List sx={{ p: 0 }}>
                          {order.OrderItems && order.OrderItems.map((item) => (
                            <ListItem
                              key={item.id}
                              sx={{ 
                                py: 1.5,
                                px: { xs: 2, sm: 0 },
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' }
                              }}
                            >
                              <ListItemAvatar sx={{ 
                                minWidth: { xs: '100%', sm: 'auto' },
                                mb: { xs: 1, sm: 0 }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    variant="rounded"
                                    src={item.MenuItem?.image || `https://source.unsplash.com/featured/?${encodeURIComponent(item.MenuItem?.name || 'food')}`}
                                    alt={item.MenuItem?.name || 'Món ăn'}
                                    sx={{ 
                                      width: { xs: 48, sm: 56 }, 
                                      height: { xs: 48, sm: 56 }, 
                                      borderRadius: 1.5,
                                      mr: 1 
                                    }}
                                  />
                                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                      {item.MenuItem?.name || `Món #${item.menuItemId}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                      {formatPrice(item.price)} x {item.quantity}
                                    </Typography>
                                  </Box>
                                </Box>
                              </ListItemAvatar>
                              <ListItemText
                                sx={{ display: { xs: 'none', sm: 'block' } }}
                                primary={
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {item.MenuItem?.name || `Món #${item.menuItemId}`}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" component="span">
                                      {formatPrice(item.price)} x {item.quantity}
                                    </Typography>
                                    <Chip 
                                      size="small"
                                      label={getStatusLabel(item.status || order.status)}
                                      color={getStatusColor(item.status || order.status)}
                                      sx={{ mt: 0.5, height: '20px', fontSize: '0.7rem' }}
                                    />
                                  </Box>
                                }
                              />
                              <Box sx={{ 
                                display: 'flex',
                                justifyContent: { xs: 'space-between', sm: 'flex-end' },
                                width: { xs: '100%', sm: 'auto' },
                                mt: { xs: 1, sm: 0 },
                                alignItems: 'center'
                              }}>
                                <Chip 
                                  size="small"
                                  label={getStatusLabel(item.status || order.status)}
                                  color={getStatusColor(item.status || order.status)}
                                  sx={{ 
                                    display: { xs: 'flex', sm: 'none' },
                                    height: '20px', 
                                    fontSize: '0.7rem' 
                                  }}
                                />
                                <Typography 
                                  variant="subtitle1" 
                                  fontWeight="bold"
                                  color="primary.main"
                                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                >
                                  {formatPrice(item.price * item.quantity)}
                                </Typography>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                        
                        <Box 
                          sx={{ 
                            mt: 2, 
                            p: { xs: 1.5, sm: 2 }, 
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 2,
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mx: { xs: 2, sm: 0 }
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                            Tổng tiền:
                          </Typography>
                          <Typography 
                            variant="h6" 
                            fontWeight="bold" 
                            color="primary.main"
                            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                          >
                            {formatPrice(order.OrderItems?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0)}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ 
                        px: { xs: 2, sm: 3 }, 
                        pb: { xs: 2, sm: 3 }, 
                        pt: 0, 
                        justifyContent: 'flex-end',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' }
                      }}>
                        {order.status === 'served' && (
                          <Button 
                            variant="contained" 
                            color="primary"
                            onClick={() => handleRequestPayment(order.id)}
                            startIcon={<PaymentIcon />}
                            sx={{ 
                              borderRadius: 2,
                              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                              mr: { xs: 0, sm: 1 },
                              mb: { xs: 1, sm: 0 }
                            }}
                            fullWidth={!!(window.innerWidth < 600)}
                          >
                            Yêu cầu thanh toán
                          </Button>
                        )}
                        
                        <Button 
                          variant="outlined"
                          onClick={() => navigate(`/status/${order.id}`)}
                          startIcon={<InfoIcon />}
                          sx={{ borderRadius: 2 }}
                          fullWidth={!!(window.innerWidth < 600)}
                        >
                          Xem chi tiết
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )
          ) : (
            completedOrders.length === 0 ? (
              <Paper sx={{ 
                p: { xs: 2, sm: 4 }, 
                textAlign: 'center', 
                borderRadius: { xs: 0, sm: 2 },
                boxShadow: { xs: 'none', sm: '0 1px 3px rgba(0,0,0,0.12)' },
                px: { xs: 2, sm: 4 },
                minWidth: '97vw',
                maxWidth: '500px',
              }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Chưa có đơn hàng nào đã hoàn thành
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={{ xs: 0, sm: 2 }}>
                {completedOrders.map((order) => (
                  <Grid item xs={12} sm={6} key={order.id}>
                    <Card sx={{ 
                      borderRadius: { xs: 0, sm: 2 }, 
                      overflow: 'hidden',
                      boxShadow: { xs: 'none', sm: '0 4px 12px rgba(0,0,0,0.05)' },
                      mb: { xs: 2, sm: 0 },
                      opacity: 0.9,
                      border: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, sm: 'none' },
                      minWidth: '97vw',
                      maxWidth: '500px',
                    }}>
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            Đơn #{order.id}
                          </Typography>
                          <Chip 
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ 
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: '24px', sm: '32px' }
                            }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatDateTime(order.createdAt)}
                        </Typography>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Grid container spacing={1}>
                          {order.OrderItems && order.OrderItems.map((item) => (
                            <Grid item xs={6} key={item.id}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                mb: 1,
                                px: { xs: 2, sm: 0 }
                              }}>
                                <Avatar 
                                  variant="rounded"
                                  src={item.MenuItem?.image || `https://source.unsplash.com/featured/?${encodeURIComponent(item.MenuItem?.name || 'food')}`}
                                  alt={item.MenuItem?.name || 'Món ăn'}
                                  sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, mr: 1, borderRadius: 1 }}
                                />
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                                    {item.MenuItem?.name || `Món #${item.menuItemId}`} x{item.quantity}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                                    {formatPrice(item.price * item.quantity)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          px: { xs: 2, sm: 0 }
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                            Tổng tiền:
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                            {formatPrice(order.OrderItems?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0)}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ 
                        justifyContent: 'flex-end',
                        px: { xs: 2, sm: 0 }
                      }}>
                        <Button 
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/status/${order.id}`)}
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                        >
                          Chi tiết
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderPage;