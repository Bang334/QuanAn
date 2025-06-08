import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import axios from 'axios';
import { API_URL } from '../../config';
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
  
  // Mock reviews trong trường hợp API chưa có
  const mockReviews = [
    { id: 1, userName: 'Nguyễn Văn A', rating: 5, comment: 'Món ăn rất ngon, phục vụ nhanh!', date: '2023-10-15' },
    { id: 2, userName: 'Trần Thị B', rating: 4, comment: 'Khá ngon, nhưng hơi mặn một chút.', date: '2023-10-12' },
    { id: 3, userName: 'Lê Văn C', rating: 5, comment: 'Tuyệt vời, sẽ quay lại lần sau!', date: '2023-10-10' },
    { id: 4, userName: 'Phạm Thị D', rating: 3, comment: 'Bình thường, giá hơi cao so với chất lượng.', date: '2023-10-05' },
  ];

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }
    
    const fetchFoodDetails = async () => {
      try {
        setLoading(true);
        // Trong thực tế, bạn sẽ gọi API để lấy chi tiết món ăn
        // const response = await axios.get(`${API_URL}/api/menu/${foodId}`);
        // setFood(response.data);
        
        // Mock dữ liệu cho phát triển
        setTimeout(() => {
          // Giả lập trễ API
          const mockFood = {
            id: foodId,
            name: 'Phở bò đặc biệt',
            price: 55000,
            description: 'Phở bò truyền thống với nước dùng ngọt thanh, thịt bò tươi, bánh phở dai mềm. Được nấu theo công thức gia truyền hơn 50 năm.',
            category: 'Món chính',
            image: `https://via.placeholder.com/800x600?text=${encodeURIComponent('Phở bò đặc biệt')}`,
            ingredients: 'Bánh phở, thịt bò, hành, gừng, gia vị đặc biệt',
            nutritionInfo: 'Calo: 450, Protein: 30g, Carbs: 65g, Chất béo: 10g',
            preparationTime: '15 phút',
            isPopular: true,
            isAvailable: true,
            allergens: 'Không có',
            isSpicy: false,
            isVegetarian: false,
          };
          
          setFood(mockFood);
          // Lấy đánh giá từ mock data
          setReviews(mockReviews);
          // Tính điểm đánh giá trung bình
          const avgRating = mockReviews.reduce((acc, rev) => acc + rev.rating, 0) / mockReviews.length;
          setAvgRating(avgRating);
          setLoading(false);
        }, 800);
        
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
  
  const handleSubmitReview = () => {
    // Trong thực tế, bạn sẽ gửi đánh giá lên server
    // const newReview = { foodId, rating: userRating, comment: reviewComment };
    // axios.post(`${API_URL}/api/reviews`, newReview);
    
    // Mock thêm review mới
    const newReview = {
      id: reviews.length + 1,
      userName: 'Bạn',
      rating: userRating,
      comment: reviewComment,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    
    // Cập nhật lại rating trung bình
    const newAvgRating = updatedReviews.reduce((acc, rev) => acc + rev.rating, 0) / updatedReviews.length;
    setAvgRating(newAvgRating);
    
    // Reset form
    setUserRating(5);
    setReviewComment('');
    setHasReviewed(true);
    
    // Hiển thị thông báo
    setSnackbarMessage('Cảm ơn bạn đã đánh giá món ăn!');
    setSnackbarOpen(true);
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
    <Box sx={{ width: '100%', pb: { xs: 8, sm: 5 } }}>
      {/* Header với nút back */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2, 
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
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
      <Grid container spacing={2} sx={{ px: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={5}>
          <Box 
            component={Paper} 
            elevation={2} 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              height: { xs: '250px', sm: '300px', md: '400px' },
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
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
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
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
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
                  ml: 2, 
                  py: { xs: 1, sm: 1.5 }, 
                  fontWeight: 'bold',
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
      <Box sx={{ px: { xs: 2, sm: 3 }, mt: 3 }}>
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
                py: 2
              }
            }}
          >
            <Tab label="Chi tiết" />
            <Tab label={`Đánh giá (${reviews.length})`} />
          </Tabs>
          
          {/* Chi tiết món ăn */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
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
            <Box sx={{ p: 3 }}>
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
                      size="large"
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
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {reviews.map((review) => (
                      <ListItem 
                        key={review.id} 
                        alignItems="flex-start"
                        sx={{ 
                          px: 0, 
                          pb: 2, 
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {review.userName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {review.date}
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
                                sx={{ display: 'block', mt: 0.5 }}
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
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 7, sm: 2 } }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FoodDetailPage; 