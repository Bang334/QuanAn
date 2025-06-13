import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Rating,
  Container,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  RestaurantMenu as RestaurantMenuIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';
import ReviewDialog from '../../components/ReviewDialog';
import { getReviewsByOrder } from '../../services/reviewService';

const CustomerOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [reviews, setReviews] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setOrder(response.data);
        setError(null);
        
        // Nếu đơn hàng đã hoàn thành, lấy thông tin đánh giá
        if (response.data.status === 'completed') {
          fetchOrderReviews(response.data.id);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const fetchOrderReviews = async (orderId) => {
    try {
      setReviewsLoading(true);
      const reviewsData = await getReviewsByOrder(orderId);
      
      // Chuyển đổi mảng reviews thành object với key là menuItemId
      const reviewsMap = {};
      reviewsData.forEach(review => {
        reviewsMap[review.menuItemId] = review;
      });
      
      setReviews(reviewsMap);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleOpenReviewDialog = (menuItem) => {
    setSelectedMenuItem(menuItem);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedMenuItem(null);
    // Refresh đánh giá sau khi đóng dialog
    if (order && order.id) {
      fetchOrderReviews(order.id);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'payment_requested': return 'Yêu cầu thanh toán';
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
      case 'payment_requested': return 'secondary';
      default: return 'default';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ tín dụng/ghi nợ';
      case 'momo': return 'MoMo';
      case 'zalopay': return 'ZaloPay';
      case 'vnpay': return 'VNPay';
      default: return 'Chưa thanh toán';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>
        <Alert severity="warning">Không tìm thấy đơn hàng</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          color="primary" 
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Chi tiết đơn hàng #{order.id}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Thông tin đơn hàng</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Bàn:</strong> {order.tableId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thời gian tạo:</strong> {formatDate(order.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Trạng thái:</strong>{' '}
                    <Chip 
                      size="small" 
                      label={getStatusLabel(order.status)} 
                      color={getStatusColor(order.status)} 
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Thanh toán:</strong>{' '}
                    <Chip 
                      size="small" 
                      label={order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                      color={order.paymentStatus === 'paid' ? 'success' : 'default'} 
                    />
                  </Typography>
                  {order.paymentStatus === 'paid' && (
                    <Typography variant="body2">
                      <strong>Phương thức:</strong> {getPaymentMethodLabel(order.paymentMethod)}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Tổng tiền:</strong> <Typography component="span" color="primary.main" fontWeight="bold">{formatPrice(order.totalAmount)}</Typography>
                  </Typography>
                </Grid>
                {order.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Ghi chú:</strong> {order.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <RestaurantMenuIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Danh sách món</Typography>
                </Box>
                {order.status === 'completed' && (
                  <Typography variant="body2" color="primary">
                    Hãy đánh giá món ăn để giúp chúng tôi cải thiện chất lượng
                  </Typography>
                )}
              </Box>
              <List>
                {order.OrderItems?.map((item, index) => (
                  <div key={item.id}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 2, width: 60, height: 60, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                          <img 
                            src={item.MenuItem?.image || `https://via.placeholder.com/60x60?text=${encodeURIComponent(item.MenuItem?.name || 'Món ăn')}`} 
                            alt={item.MenuItem?.name || 'Món ăn'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography>
                                {item.MenuItem?.name || 'Món #' + item.menuItemId} x{item.quantity}
                              </Typography>
                              <Typography fontWeight="bold">
                                {formatPrice(item.price * item.quantity)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formatPrice(item.price)} / món
                              </Typography>
                              {item.notes && (
                                <Typography variant="body2" color="text.secondary">
                                  Ghi chú: {item.notes}
                                </Typography>
                              )}
                              {order.status === 'completed' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  {reviews[item.menuItemId] ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Rating 
                                        value={reviews[item.menuItemId].rating} 
                                        readOnly 
                                        size="small" 
                                      />
                                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        Đã đánh giá
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Button
                                      size="small"
                                      startIcon={<StarBorderIcon />}
                                      onClick={() => handleOpenReviewDialog(item.MenuItem)}
                                      color="primary"
                                    >
                                      Đánh giá món này
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </Box>
                    </ListItem>
                    {index < order.OrderItems.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Typography variant="h6">
                  Tổng cộng: {formatPrice(order.totalAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trạng thái đơn hàng
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label="Đặt món" 
                    color={order.status !== 'cancelled' ? 'success' : 'default'} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {formatDate(order.createdAt)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label="Xác nhận" 
                    color={order.status !== 'pending' && order.status !== 'cancelled' ? 'success' : 'default'} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {order.status !== 'pending' && order.status !== 'cancelled' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label="Chuẩn bị" 
                    color={['preparing', 'ready', 'served', 'payment_requested', 'completed'].includes(order.status) ? 'success' : 'default'} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {['preparing', 'ready', 'served', 'payment_requested', 'completed'].includes(order.status) ? 'Đang chuẩn bị' : 'Chưa bắt đầu'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label="Phục vụ" 
                    color={['served', 'payment_requested', 'completed'].includes(order.status) ? 'success' : 'default'} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {['served', 'payment_requested', 'completed'].includes(order.status) ? 'Đã phục vụ' : 'Chưa phục vụ'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label="Thanh toán" 
                    color={order.paymentStatus === 'paid' ? 'success' : 'default'} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {order.paymentStatus === 'paid' ? `Đã thanh toán (${getPaymentMethodLabel(order.paymentMethod)})` : 'Chưa thanh toán'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label="Hoàn thành" 
                    color={order.status === 'completed' ? 'success' : 'default'} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {order.status === 'completed' ? 'Đơn hàng hoàn thành' : 'Chưa hoàn thành'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog đánh giá món ăn */}
      <ReviewDialog
        open={reviewDialogOpen}
        onClose={handleCloseReviewDialog}
        menuItem={selectedMenuItem}
        orderId={order.id}
        tableId={order.tableId}
      />
    </Container>
  );
};

export default CustomerOrderDetailPage;