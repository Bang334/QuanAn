import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import axios from 'axios';
import { API_URL } from '../../config';
import { getMenuItemById } from '../../services/menuService';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Card,
  CardMedia,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const FoodDetailPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { addToCart, tableId } = useCart();
  
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Kiểm tra xem người dùng đã đánh giá món ăn này chưa
  const [hasReviewed, setHasReviewed] = useState(false);
  // State cho form đánh giá
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }
    
    const fetchFoodDetails = async () => {
      try {
        setLoading(true);
        // Gọi API lấy chi tiết món ăn từ database
        const response = await getMenuItemById(foodId);
        console.log('Food details from API:', response);
        
        setFood(response);
        
        // Lấy đánh giá từ response nếu có
        if (response.recentReviews) {
          setReviews(response.recentReviews);
        }
        
        // Lấy rating từ dữ liệu thực
        setAvgRating(response.avgRating || 0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching food details:', err);
        setError('Không thể tải thông tin món ăn. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchFoodDetails();
  }, [foodId, navigate, tableId]);
  
  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleAddToCart = () => {
    if (food) {
      addToCart({
        id: food.id,
        name: food.name,
        price: food.price,
        quantity: quantity,
      });
      setSnackbarMessage(`Đã thêm ${quantity} ${food.name} vào giỏ hàng`);
      setSnackbarOpen(true);
    }
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const handleSubmitReview = async () => {
    try {
      // Chuẩn bị dữ liệu để gửi lên server
      const reviewData = { 
        rating: userRating, 
        comment: reviewComment,
        menuItemId: parseInt(foodId),
        tableId: parseInt(tableId),
        reviewDate: new Date().toISOString()
      };
      
      // Gửi đánh giá lên server
      const response = await axios.post(`${API_URL}/api/reviews`, reviewData);
      console.log('Review submitted:', response.data);
      
      // Tạo object đánh giá mới để thêm vào UI
      const newReview = {
        ...response.data,
        userName: 'Bạn'
      };
      
      const updatedReviews = [...reviews, newReview];
      setReviews(updatedReviews);
      
      // Cập nhật lại rating trung bình
      const updatedAvgRating = (avgRating * reviews.length + userRating) / updatedReviews.length;
      setAvgRating(updatedAvgRating);
      
      // Reset form
      setUserRating(5);
      setReviewComment('');
      setHasReviewed(true);
      
      // Hiển thị thông báo
      setSnackbarMessage('Cảm ơn bạn đã đánh giá món ăn!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbarMessage('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
      setSnackbarOpen(true);
    }
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </Box>
    );
  }
  
  if (!food) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Không tìm thấy thông tin món ăn</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleBackClick}>
          Quay lại
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100vw',
      pb: { xs: 8, sm: 5 }, 
      overflowX: 'hidden' 
    }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2, 
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper'
        }}
      >
        <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
          Chi tiết món ăn
        </Typography>
      </Box>
      
      {/* Phần ảnh và thông tin cơ bản */}
      <Grid container spacing={2} sx={{ px: { xs: 1, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={5}>
          <Box 
            component={Paper} 
            elevation={2} 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              height: { xs: '200px', sm: '300px', md: '400px' },
            }}
          >
            <CardMedia
              component="img"
              image={food.image}
              alt={food.name}
              sx={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={7}>
          <Box sx={{ px: { xs: 1, sm: 0 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {food.name}
              </Typography>
              {food.isPopular && (
                <Chip 
                  label="Phổ biến" 
                  color="error" 
                  size="small" 
                  sx={{ fontWeight: 'bold' }} 
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating 
                value={avgRating} 
                precision={0.5} 
                readOnly 
                size={isMobile ? "small" : "medium"}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({avgRating.toFixed(1)}) · {reviews.length} đánh giá
              </Typography>
            </Box>
            
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
              {formatPrice(food.price)}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              {food.description}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Chip 
                label={food.category} 
                color="secondary" 
                sx={{ mr: 1, mb: 1 }} 
              />
              {food.isVegetarian && (
                <Chip label="Chay" sx={{ mr: 1, mb: 1, bgcolor: 'success.light', color: 'white' }} />
              )}
              {food.isSpicy && (
                <Chip label="Cay" sx={{ mr: 1, mb: 1, bgcolor: 'error.light', color: 'white' }} />
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 1,
                minWidth: isMobile ? '120px' : '150px'
              }}>
                <IconButton 
                  onClick={handleDecreaseQuantity} 
                  disabled={quantity <= 1}
                  size={isMobile ? "small" : "medium"}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography sx={{ px: 2, minWidth: '40px', textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton 
                  onClick={handleIncreaseQuantity}
                  size={isMobile ? "small" : "medium"}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Button 
                variant="contained" 
                startIcon={<CartIcon />} 
                onClick={handleAddToCart}
                sx={{ 
                  py: { xs: 1, sm: 1.5 }, 
                  fontWeight: 'bold',
                  flexGrow: 1,
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                Thêm vào giỏ hàng
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      {/* Tabs for Details and Reviews */}
      <Box sx={{ px: { xs: 1, sm: 3 }, mt: 3 }}>
        <Paper elevation={1} sx={{ borderRadius: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 600,
                py: 1.5
              }
            }}
          >
            <Tab label="Chi tiết" />
            <Tab label={`Đánh giá (${reviews.length})`} />
          </Tabs>
          
          {/* Chi tiết món ăn */}
          {activeTab === 0 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Thành phần:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {food.ingredients}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Thông tin dinh dưỡng:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {food.nutritionInfo}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Thời gian chuẩn bị:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {food.preparationTime}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Dị ứng:
                  </Typography>
                  <Typography variant="body2">
                    {food.allergens || 'Không có thông tin'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Đánh giá */}
          {activeTab === 1 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Form đánh giá */}
              {!hasReviewed && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Đánh giá món ăn này
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Bạn thấy món ăn này như thế nào?
                    </Typography>
                    <Rating
                      name="user-rating"
                      value={userRating}
                      onChange={(event, newValue) => {
                        setUserRating(newValue);
                      }}
                      precision={1}
                      size={isMobile ? "medium" : "large"}
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Chia sẻ ý kiến của bạn về món ăn này..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmitReview}
                    disabled={!userRating || !reviewComment}
                    endIcon={<SendIcon />}
                    fullWidth={isMobile}
                  >
                    Gửi đánh giá
                  </Button>
                </Paper>
              )}
              
              {/* Danh sách đánh giá */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Tất cả đánh giá ({reviews.length})
                </Typography>
                
                {reviews.length === 0 ? (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign: 'center', p: 3 }}>
                    Chưa có đánh giá nào cho món ăn này
                  </Typography>
                ) : (
                  <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                    {reviews.map((review) => (
                      <ListItem 
                        key={review.id} 
                        alignItems="flex-start"
                        sx={{ 
                          px: { xs: 1, sm: 2 }, 
                          pb: 2, 
                          pt: { xs: 1, sm: 2 },
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: { xs: 40, sm: 56 } }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                            <PersonIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                {review.userName || 'Khách hàng'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(review.reviewDate || review.createdAt).toLocaleDateString('vi-VN')}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Rating 
                                value={review.rating} 
                                readOnly 
                                size="small" 
                                sx={{ my: 0.5 }}
                              />
                              <Typography
                                variant="body2"
                                color="text.primary"
                                component="span"
                                sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                              >
                                {review.comment}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 7, sm: 2 } }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FoodDetailPage; 