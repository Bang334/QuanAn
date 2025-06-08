import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Kitchen as KitchenIcon,
  RoomService as RoomServiceIcon,
  Cake as CakeIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OrderStatusPage = () => {
  const theme = useTheme();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { tableId } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`);
        
        // If order items don't have images, add placeholder URLs
        const orderWithImagesIfNeeded = {
          ...response.data,
          OrderItems: response.data.OrderItems.map(item => ({
            ...item,
            MenuItem: item.MenuItem ? {
              ...item.MenuItem,
              image: item.MenuItem.image || `https://source.unsplash.com/featured/?${encodeURIComponent(item.MenuItem?.name || 'food')}`
            } : null
          }))
        };
        
        setOrder(orderWithImagesIfNeeded);
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, tableId, navigate]);

  const handleRequestPayment = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/orders/${orderId}/payment-request`, {
        tableId: tableId
      });
      
      // Cập nhật lại trạng thái đơn hàng
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`);
      
      // If order items don't have images, add placeholder URLs
      const orderWithImagesIfNeeded = {
        ...response.data,
        OrderItems: response.data.OrderItems.map(item => ({
          ...item,
          MenuItem: item.MenuItem ? {
            ...item.MenuItem,
            image: item.MenuItem.image || `https://source.unsplash.com/featured/?${encodeURIComponent(item.MenuItem?.name || 'food')}`
          } : null
        }))
      };
      
      setOrder(orderWithImagesIfNeeded);
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
      case 'served': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getActiveStep = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'served': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const getStepIcon = (index) => {
    switch (index) {
      case 0: return <RestaurantMenuIcon />;
      case 1: return <KitchenIcon />;
      case 2: return <CakeIcon />;
      case 3: return <RoomServiceIcon />;
      case 4: return <CheckCircleIcon />;
      default: return null;
    }
  };

  if (!tableId) {
    return (
      <Box textAlign="center" py={4}>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/menu')}
        >
          Quay lại thực đơn
        </Button>
      </Box>
    );
  }

  if (!order) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Không tìm thấy đơn hàng
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/menu')}
          sx={{ mt: 2 }}
        >
          Quay lại thực đơn
        </Button>
      </Paper>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        py: { xs: 0, sm: 2 }
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '900px' },
          px: { xs: 0, sm: 2, md: 3 }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 2, sm: 3 },
            width: '100%',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            px: { xs: 2, sm: 0 }
          }}
        >
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/order')}
            sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
            size="small"
          >
            Quay lại
          </Button>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            Chi tiết đơn hàng #{order.id}
          </Typography>
        </Box>
        
        <Card sx={{ 
          mb: { xs: 2, sm: 3 }, 
          borderRadius: { xs: 0, sm: 2 },
          overflow: 'hidden',
          boxShadow: { xs: 'none', sm: '0 4px 8px rgba(0,0,0,0.05)' },
          width: '100%',
          border: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, sm: 'none' }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 2,
            pb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, // Hợp nhất alignItems tại đây
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ mb: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Trạng thái
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {formatDateTime(order.createdAt)}
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={getStatusLabel(order.status)}
              color={getStatusColor(order.status)}
              sx={{ 
                fontWeight: 'bold', 
                px: 1,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                height: { xs: '24px', sm: '32px' }
              }}
            />
          </Box>
            
            <Stepper 
              activeStep={getActiveStep(order.status)} 
              alternativeLabel 
              sx={{ 
                mb: 2,
                '& .MuiStepLabel-label': {
                  mt: 1,
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                },
                '& .MuiStepIcon-root': {
                  fontSize: { xs: '1.2rem', sm: '1.5rem' }
                }
              }}
            >
              <Step>
                <StepLabel StepIconComponent={() => 
                  <RestaurantMenuIcon color={getActiveStep(order.status) >= 0 ? 'primary' : 'disabled'} 
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                  />
                }>
                  Đã đặt hàng
                </StepLabel>
              </Step>
              <Step>
                <StepLabel StepIconComponent={() => 
                  <KitchenIcon color={getActiveStep(order.status) >= 1 ? 'primary' : 'disabled'} 
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                  />
                }>
                  Đang chế biến
                </StepLabel>
              </Step>
              <Step>
                <StepLabel StepIconComponent={() => 
                  <CakeIcon color={getActiveStep(order.status) >= 2 ? 'primary' : 'disabled'} 
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                  />
                }>
                  Sẵn sàng phục vụ
                </StepLabel>
              </Step>
              <Step>
                <StepLabel StepIconComponent={() => 
                  <RoomServiceIcon color={getActiveStep(order.status) >= 3 ? 'primary' : 'disabled'} 
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                  />
                }>
                  Đã phục vụ
                </StepLabel>
              </Step>
              <Step>
                <StepLabel StepIconComponent={() => 
                  <CheckCircleIcon color={getActiveStep(order.status) >= 4 ? 'primary' : 'disabled'} 
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                  />
                }>
                  Hoàn thành
                </StepLabel>
              </Step>
            </Stepper>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          mb: { xs: 2, sm: 3 }, 
          borderRadius: { xs: 0, sm: 2 },
          overflow: 'hidden',
          boxShadow: { xs: 'none', sm: '0 4px 8px rgba(0,0,0,0.05)' },
          width: '100%',
          border: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, sm: 'none' }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Danh sách món
            </Typography>
            
            <List sx={{ p: 0 }}>
              {order.OrderItems && order.OrderItems.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{ 
                    py: 2, 
                    px: 0,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
                          width: { xs: 48, sm: 64 }, 
                          height: { xs: 48, sm: 64 }, 
                          borderRadius: 2,
                          mr: 1 
                        }}
                      />
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                          {item.MenuItem ? item.MenuItem.name : 'Món #' + item.menuItemId} x{item.quantity}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Đơn giá: {formatPrice(item.price)}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.MenuItem ? item.MenuItem.name : 'Món #' + item.menuItemId} x{item.quantity}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" component="span">
                          Đơn giá: {formatPrice(item.price)}
                        </Typography>
                        <Chip 
                          size="small"
                          label={getStatusLabel(order.status)}
                          color={getStatusColor(order.status)}
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
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
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
                alignItems: 'center' 
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
                {formatPrice(order.OrderItems.reduce((total, item) => total + (item.price * item.quantity), 0))}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            width: '100%',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
            px: { xs: 2, sm: 0 },
            pb: { xs: 2, sm: 0 }
          }}
        >
          <Button 
            variant="outlined"
            onClick={() => navigate('/order')}
            startIcon={<ArrowBackIcon />}
            sx={{ mb: { xs: 1, sm: 0 } }}
            fullWidth={!!(window.innerWidth < 600)}
          >
            Quay lại danh sách đơn hàng
          </Button>
          
          {order.status === 'served' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRequestPayment}
              fullWidth={!!(window.innerWidth < 600)}
            >
              Yêu cầu thanh toán
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderStatusPage; 