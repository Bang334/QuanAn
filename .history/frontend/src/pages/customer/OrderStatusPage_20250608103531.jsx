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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Kitchen as KitchenIcon,
  RoomService as RoomServiceIcon,
  Cake as CakeIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';
import orderService from '../../services/orderService';

const OrderStatusPage = () => {
  const theme = useTheme();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const [promoSuccess, setPromoSuccess] = useState(null);
  const [discountInfo, setDiscountInfo] = useState(null);
  
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
        
        // Lấy thông tin đơn hàng
        const orderResponse = await axios.get(`${API_URL}/api/orders/${orderId}`);
        const orderData = orderResponse.data;
        
        // Kiểm tra nếu đơn hàng thuộc về bàn hiện tại
        if (orderData.tableId === parseInt(tableId)) {
          // If order items don't have images, add placeholder URLs
          const orderWithImagesIfNeeded = {
            ...orderData,
            OrderItems: orderData.OrderItems.map(item => ({
              ...item,
              MenuItem: item.MenuItem ? {
                ...item.MenuItem,
                image: item.MenuItem.image || `https://source.unsplash.com/featured/?${encodeURIComponent(item.MenuItem?.name || 'food')}`
              } : null
            }))
          };
          
          setOrder(orderWithImagesIfNeeded);
          setError(null);
        } else {
          // Đơn hàng không thuộc về bàn hiện tại
          setOrder(null);
          setError('Đơn hàng này không thuộc về bàn của bạn.');
        }
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
    // Open discount code dialog first
    setDiscountDialogOpen(true);
  };

  const handleCloseDiscountDialog = () => {
    setDiscountDialogOpen(false);
    setPromoCode('');
    setPromoError(null);
    setPromoSuccess(null);
  };

  const handleSubmitPaymentRequest = async () => {
    try {
      setLoading(true);
      
      // Gửi yêu cầu thanh toán với số tiền đã được giảm giá (nếu có)
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
      setDiscountDialogOpen(false);
    } catch (err) {
      console.error('Error requesting payment:', err);
      setError('Không thể yêu cầu thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccess(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/promotions/validate`, {
        code: promoCode,
        orderId: orderId
      });
      
      setDiscountInfo(response.data);
      setPromoSuccess(`Áp dụng mã giảm giá thành công! Giảm ${response.data.discountAmount.toLocaleString('vi-VN')}₫`);
    } catch (err) {
      console.error('Error validating promo code:', err);
      setPromoError(err.response?.data?.message || 'Không thể kiểm tra mã khuyến mãi');
      setDiscountInfo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const applyPromoCode = async () => {
    if (!discountInfo) return;
    
    try {
      setPromoLoading(true);
      
      // Áp dụng mã giảm giá và cập nhật totalAmount của đơn hàng
      const response = await axios.post(`${API_URL}/api/promotions/apply`, {
        orderId: orderId,
        promotionId: discountInfo.promotion.id
      });
      
      // Update order with discount
      const updatedOrder = await axios.get(`${API_URL}/api/orders/${orderId}`);
      
      // If order items don't have images, add placeholder URLs
      const orderWithImagesIfNeeded = {
        ...updatedOrder.data,
        OrderItems: updatedOrder.data.OrderItems.map(item => ({
          ...item,
          MenuItem: item.MenuItem ? {
            ...item.MenuItem,
            image: item.MenuItem.image || `https://source.unsplash.com/featured/?${encodeURIComponent(item.MenuItem?.name || 'food')}`
          } : null
        }))
      };
      
      setOrder(orderWithImagesIfNeeded);
      
      // Sau khi áp dụng mã giảm giá thành công, gửi yêu cầu thanh toán
      handleSubmitPaymentRequest();
    } catch (err) {
      console.error('Error applying promo code:', err);
      setPromoError(err.response?.data?.message || 'Không thể áp dụng mã khuyến mãi');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      await orderService.cancelOrder(orderId);
      
      // Refresh order details
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
      setOpenCancelDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
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
      case 'cooking': return 'Đang chế biến';
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
      case 'cooking': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'info';
      case 'payment_requested': return 'error';
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
      case 'payment_requested': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const getStepIcon = (index) => {
    switch (index) {
      case 0: return <RestaurantMenuIcon />;
      case 1: return <KitchenIcon />;
      case 2: return <CakeIcon />;
      case 3: return <RoomServiceIcon />;
      case 4: return <PaymentIcon />;
      case 5: return <CheckCircleIcon />;
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
                  <PaymentIcon color={getActiveStep(order.status) >= 4 ? 'primary' : 'disabled'} 
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                  />
                }>
                  Thanh toán
                </StepLabel>
              </Step>
              <Step>
                <StepLabel StepIconComponent={() => 
                  <CheckCircleIcon color={getActiveStep(order.status) >= 5 ? 'primary' : 'disabled'} 
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
                      </Box>
                    }
                  />
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    width: { xs: '100%', sm: 'auto' },
                    mt: { xs: 1, sm: 0 },
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Chip 
                      size="small"
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status)}
                      sx={{ 
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
                flexDirection: order.status === 'completed' ? 'column' : 'row'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%',
                mb: order.status === 'completed' ? 1 : 0
              }}>
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
              
              {/* Hiển thị thông tin thanh toán cho đơn hàng đã hoàn thành */}
              {order.status === 'completed' && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  width: '100%',
                  pt: 1,
                  borderTop: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    Đã thanh toán bằng {order.paymentMethod === 'cash' ? 'tiền mặt' : 
                      order.paymentMethod === 'card' ? 'thẻ' : 
                      order.paymentMethod === 'momo' ? 'MoMo' : 
                      order.paymentMethod === 'zalopay' ? 'ZaloPay' : 
                      order.paymentMethod === 'vnpay' ? 'VNPay' : 'phương thức khác'}
                  </Typography>
                  <Chip 
                    size="small"
                    label="Đã thanh toán"
                    color="success"
                    icon={<PaymentIcon sx={{ fontSize: '0.8rem !important' }} />}
                    sx={{ 
                      height: '20px', 
                      fontSize: '0.7rem' 
                    }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            width: '100%',
            px: { xs: 2, sm: 0 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Button 
            variant="outlined"
            onClick={() => navigate('/menu')}
            sx={{ flex: 1, mr: { sm: 2 } }}
          >
            Xem thực đơn
          </Button>
          
          {/* Chỉ hiển thị nút hủy đơn khi đơn hàng ở trạng thái pending */}
          {order.status === 'pending' && (
            <Button 
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setOpenCancelDialog(true)}
              sx={{ flex: 1 }}
            >
              Hủy đơn hàng
            </Button>
          )}
          
          {/* Hiển thị nút yêu cầu thanh toán nếu tất cả món ăn đã được phục vụ */}
          {order.OrderItems.every(item => item.status === 'served') && 
           order.status !== 'payment_requested' && 
           order.status !== 'paid' &&
           order.status !== 'completed' && (
            <Button 
              variant="contained"
              color="primary"
              onClick={handleRequestPayment}
              sx={{ flex: 1, ml: { sm: 2 } }}
            >
              Yêu cầu thanh toán
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Dialog xác nhận hủy đơn hàng */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
      >
        <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Không</Button>
          <Button onClick={handleCancelOrder} color="error" variant="contained" autoFocus>
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Discount Code Dialog */}
      <Dialog 
        open={discountDialogOpen} 
        onClose={handleCloseDiscountDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              <LocalOfferIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Nhập mã giảm giá
            </Typography>
            <IconButton onClick={handleCloseDiscountDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Nhập mã giảm giá (nếu có) để được giảm giá cho đơn hàng của bạn.
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label="Mã giảm giá"
              variant="outlined"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoLoading}
              error={!!promoError}
              helperText={promoError}
              sx={{ mr: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={validatePromoCode}
              disabled={promoLoading || !promoCode.trim()}
            >
              {promoLoading ? <CircularProgress size={24} /> : 'Áp dụng'}
            </Button>
          </Box>
          
          {promoSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {promoSuccess}
            </Alert>
          )}
          
          {discountInfo && (
            <Box sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1, 
              p: 2,
              mb: 2,
              bgcolor: alpha(theme.palette.success.main, 0.05)
            }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Thông tin khuyến mãi:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">Tên khuyến mãi:</Typography>
                <Typography variant="body2" fontWeight="medium">{discountInfo.promotion.name}</Typography>
              </Box>
              {discountInfo.promotion.description && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2">Mô tả:</Typography>
                  <Typography variant="body2">{discountInfo.promotion.description}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2">Giảm giá:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {discountInfo.promotion.discountType === 'percent' 
                    ? `${discountInfo.promotion.discountValue}%` 
                    : `${discountInfo.promotion.discountValue.toLocaleString('vi-VN')}₫`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2">Số tiền giảm:</Typography>
                <Typography variant="body2" fontWeight="medium" color="success.main">
                  {discountInfo.discountAmount.toLocaleString('vi-VN')}₫
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">Tổng tiền gốc:</Typography>
                <Typography variant="subtitle2">
                  {discountInfo.originalTotal.toLocaleString('vi-VN')}₫
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="bold">Tổng tiền sau giảm:</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                  {discountInfo.newTotal.toLocaleString('vi-VN')}₫
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDiscountDialog} color="inherit">
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={discountInfo ? applyPromoCode : handleSubmitPaymentRequest}
            disabled={promoLoading}
          >
            {promoLoading ? <CircularProgress size={24} /> : 'Yêu cầu thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderStatusPage; 