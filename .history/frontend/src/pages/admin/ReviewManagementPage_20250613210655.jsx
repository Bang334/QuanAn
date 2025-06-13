import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Rating,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MUIMenuItem,
  CircularProgress,
  InputAdornment,
  Grid,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Comment as CommentIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { API_URL } from '../../config';
import { getAllMenuItems } from '../../services/menuService';
import { getReviewsByMenuItem, getReviewSummary, deleteReview } from '../../services/reviewService';

const API_ENDPOINT = `${API_URL}/api`;

const ReviewManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [viewDishReviewsDialog, setViewDishReviewsDialog] = useState(false);
  const [currentDish, setCurrentDish] = useState(null);
  const [dishReviews, setDishReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deleteReviewDialog, setDeleteReviewDialog] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch menu items with their average ratings
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const data = await getAllMenuItems();
        setMenuItems(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
        showSnackbar('Có lỗi xảy ra khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenuItems();
  }, []);
  
  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    // Filter by search term
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().includes(searchTerm.toLowerCase());
    
    // Filter by rating
    let ratingMatch = true;
    if (filterRating !== 'all') {
      const minRating = parseInt(filterRating);
      const maxRating = minRating + 0.99;
      ratingMatch = item.avgRating >= minRating && item.avgRating <= maxRating;
    }
    
    return matchesSearch && ratingMatch;
  });
  
  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // View dish reviews
  const handleViewDishReviews = async (dish) => {
    try {
      setCurrentDish(dish);
      setLoadingReviews(true);
      
      // Fetch reviews for this dish
      const reviews = await getReviewsByMenuItem(dish.id);
      setDishReviews(reviews);
      
      // Fetch review summary
      const summary = await getReviewSummary(dish.id);
      setReviewSummary(summary);
      
      setViewDishReviewsDialog(true);
      setLoadingReviews(false);
    } catch (err) {
      showSnackbar('Có lỗi xảy ra khi tải đánh giá', 'error');
      setLoadingReviews(false);
    }
  };
  
  // Close view dialog
  const handleCloseViewDialog = () => {
    setViewDishReviewsDialog(false);
  };
  
  // Open delete dialog
  const handleOpenDeleteDialog = (review) => {
    setCurrentReview(review);
    setDeleteReviewDialog(true);
  };
  
  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteReviewDialog(false);
  };
  
  // Delete review
  const handleDeleteReview = async () => {
    try {
      await deleteReview(currentReview.id);
      
      // Update the reviews list
      setDishReviews(dishReviews.filter(review => review.id !== currentReview.id));
      
      // Update the review summary
      if (reviewSummary && currentDish) {
        // Refetch the summary
        const summary = await getReviewSummary(currentDish.id);
        setReviewSummary(summary);
      }
      
      showSnackbar('Đánh giá đã được xóa thành công');
      handleCloseDeleteDialog();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá', 'error');
    }
  };
  
  // Render rating chip
  const renderRatingChip = (rating) => {
    let color;
    if (rating >= 4.5) color = 'success';
    else if (rating >= 3.5) color = 'info';
    else if (rating >= 2.5) color = 'warning';
    else color = 'error';
    
    return (
      <Chip 
        label={`${rating.toFixed(1)}`}
        color={color}
        size="small"
      />
    );
  };

  // Render rating distribution
  const renderRatingDistribution = (distribution) => {
    if (!distribution) return null;
    
    const totalReviews = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        {[5, 4, 3, 2, 1].map(star => {
          const count = distribution[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '40px' }}>
                <Typography variant="body2">{star}</Typography>
                <StarIcon sx={{ fontSize: 16, ml: 0.5, color: 'gold' }} />
              </Box>
              <Box sx={{ flex: 1, mx: 1 }}>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: '#eee',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${percentage}%`,
                      bgcolor: star > 3 ? 'success.main' : star > 2 ? 'warning.main' : 'error.main',
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ width: '50px', textAlign: 'right' }}>
                {count} ({percentage.toFixed(0)}%)
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý đánh giá
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Làm mới
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên món ăn hoặc danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Lọc theo đánh giá</InputLabel>
              <Select
                value={filterRating}
                label="Lọc theo đánh giá"
                onChange={(e) => setFilterRating(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MUIMenuItem value="all">Tất cả đánh giá</MUIMenuItem>
                <MUIMenuItem value="5">5 sao</MUIMenuItem>
                <MUIMenuItem value="4">4 sao</MUIMenuItem>
                <MUIMenuItem value="3">3 sao</MUIMenuItem>
                <MUIMenuItem value="2">2 sao</MUIMenuItem>
                <MUIMenuItem value="1">1 sao</MUIMenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
                }}>
                  <TableCell>Món ăn</TableCell>
                  <TableCell>Danh mục</TableCell>
                  <TableCell>Đánh giá trung bình</TableCell>
                  <TableCell>Số lượt đánh giá</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 40, height: 40, mr: 1 }}
                            alt={item.name}
                            src={item.image}
                            variant="rounded"
                          >
                            <RestaurantIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body1">{item.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={item.avgRating || 0} 
                            readOnly 
                            precision={0.5}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {renderRatingChip(item.avgRating || 0)}
                        </Box>
                      </TableCell>
                      <TableCell>{item.ratingCount || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDishReviews(item)}
                          disabled={!item.ratingCount}
                        >
                          Xem đánh giá
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Không tìm thấy món ăn nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* View Dish Reviews Dialog */}
      <Dialog 
        open={viewDishReviewsDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
      >
        {currentDish && (
          <>
            <DialogTitle sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
              color: 'white',
              borderRadius: '4px 4px 0 0'
            }}>
              Đánh giá cho món: {currentDish.name}
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {loadingReviews ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardMedia
                          component="img"
                          height="200"
                          image={currentDish.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                          alt={currentDish.name}
                        />
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{currentDish.name}</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Danh mục: {currentDish.category}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Giá: {currentDish.price?.toLocaleString('vi-VN')}₫
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="subtitle1" gutterBottom>Tổng quan đánh giá</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box
                              sx={{
                                bgcolor: 'background.paper',
                                p: 1,
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: '1px solid #eee',
                                mr: 2
                              }}
                            >
                              <Typography variant="h4" color="primary">
                                {reviewSummary?.avgRating ? reviewSummary.avgRating.toFixed(1) : '0.0'}
                              </Typography>
                              <Rating
                                value={reviewSummary?.avgRating || 0}
                                precision={0.5}
                                readOnly
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                {reviewSummary?.reviewCount || 0} đánh giá
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              {renderRatingDistribution(reviewSummary?.ratingDistribution)}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" gutterBottom sx={{ pl: 1 }}>
                        Tất cả đánh giá ({dishReviews.length})
                      </Typography>
                      
                      {dishReviews.length > 0 ? (
                        <List>
                          {dishReviews.map((review) => (
                            <React.Fragment key={review.id}>
                              <ListItem
                                alignItems="flex-start"
                                secondaryAction={
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    onClick={() => handleOpenDeleteDialog(review)}
                                  >
                                    <DeleteIcon color="error" />
                                  </IconButton>
                                }
                                sx={{
                                  bgcolor: 'background.paper',
                                  borderRadius: 1,
                                  mb: 1,
                                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {review.tableId ? `T${review.tableId}` : 'U'}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Rating value={review.rating} readOnly size="small" sx={{ mr: 1 }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {review.reviewDate && format(new Date(review.reviewDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      <Typography
                                        component="span"
                                        variant="body1"
                                        color="text.primary"
                                        sx={{ display: 'block', mt: 1 }}
                                      >
                                        {review.comment || 'Không có nhận xét'}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Bàn: {review.tableId || 'Không xác định'} | 
                                        Đơn hàng: {review.orderId || 'Không xác định'}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                              <Divider variant="inset" component="li" />
                            </React.Fragment>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <CommentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            Chưa có đánh giá nào
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5' }}>
              <Button onClick={handleCloseViewDialog} variant="outlined">Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Delete Review Dialog */}
      <Dialog 
        open={deleteReviewDialog} 
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Xác nhận xóa đánh giá</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteReview}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReviewManagementPage;
