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
  MenuItem,
  CircularProgress,
  InputAdornment,
  Grid,
  Avatar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { API_URL } from '../../config';

const API_ENDPOINT = `${API_URL}/api`;

const ReviewManagementPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [viewReviewDialog, setViewReviewDialog] = useState(false);
  const [deleteReviewDialog, setDeleteReviewDialog] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_ENDPOINT}/reviews`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setReviews(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải đánh giá');
        showSnackbar('Có lỗi xảy ra khi tải đánh giá', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, []);
  
  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    // Filter by search term
    const matchesSearch = 
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.MenuItem?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.Table?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.id?.toString().includes(searchTerm.toLowerCase());
    
    // Filter by rating
    let ratingMatch = true;
    if (filterRating !== 'all') {
      ratingMatch = review.rating === parseInt(filterRating);
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
  
  // View review details
  const handleViewReview = (review) => {
    setCurrentReview(review);
    setViewReviewDialog(true);
  };
  
  // Close view dialog
  const handleCloseViewDialog = () => {
    setViewReviewDialog(false);
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
      await axios.delete(`${API_ENDPOINT}/reviews/${currentReview.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setReviews(reviews.filter(review => review.id !== currentReview.id));
      showSnackbar('Đánh giá đã được xóa thành công');
      handleCloseDeleteDialog();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá', 'error');
    }
  };
  
  // Render rating chip
  const renderRatingChip = (rating) => {
    let color;
    switch (rating) {
      case 5:
        color = 'success';
        break;
      case 4:
        color = 'info';
        break;
      case 3:
        color = 'warning';
        break;
      default:
        color = 'error';
    }
    
    return (
      <Chip 
        label={`${rating} sao`}
        color={color}
        size="small"
      />
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
              placeholder="Tìm kiếm theo người dùng, món ăn hoặc nội dung đánh giá..."
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
                <MenuItem value="all">Tất cả đánh giá</MenuItem>
                <MenuItem value="5">5 sao</MenuItem>
                <MenuItem value="4">4 sao</MenuItem>
                <MenuItem value="3">3 sao</MenuItem>
                <MenuItem value="2">2 sao</MenuItem>
                <MenuItem value="1">1 sao</MenuItem>
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
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Bàn</TableCell>
                  <TableCell>Món ăn</TableCell>
                  <TableCell>Đánh giá</TableCell>
                  <TableCell>Ngày đánh giá</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 30, height: 30, mr: 1, bgcolor: 'primary.main' }}
                          >
                            {review.Table?.name?.charAt(0) || 'T'}
                          </Avatar>
                          {review.Table?.name || 'Bàn không xác định'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 30, height: 30, mr: 1 }}
                            alt={review.MenuItem?.name}
                            src={review.MenuItem?.image}
                            variant="rounded"
                          >
                            <RestaurantIcon fontSize="small" />
                          </Avatar>
                          {review.MenuItem?.name || 'Món ăn không xác định'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={review.rating} 
                            readOnly 
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {renderRatingChip(review.rating)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {review.createdAt && format(new Date(review.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleViewReview(review)}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleOpenDeleteDialog(review)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Không có đánh giá nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* View Review Dialog */}
      <Dialog 
        open={viewReviewDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết đánh giá</DialogTitle>
        {currentReview && (
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ width: 50, height: 50, mr: 2, bgcolor: 'primary.main' }}
                  >
                    {currentReview.Table?.name?.charAt(0) || 'T'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Bàn: {currentReview.Table?.name || 'Không xác định'}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Đơn hàng ID: {currentReview.orderId || 'Không có thông tin'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ngày đánh giá: {currentReview.createdAt && format(new Date(currentReview.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Thông tin món ăn</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      sx={{ width: 40, height: 40, mr: 1 }}
                      alt={currentReview.MenuItem?.name}
                      src={currentReview.MenuItem?.image}
                      variant="rounded"
                    >
                      <RestaurantIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body1">{currentReview.MenuItem?.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Danh mục: {currentReview.MenuItem?.category || 'Không có thông tin'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Giá: {currentReview.MenuItem?.price?.toLocaleString('vi-VN')}₫
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Đánh giá</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Rating 
                      value={currentReview.rating} 
                      readOnly 
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2">
                      {currentReview.rating}/5 sao
                    </Typography>
                  </Box>
                  {currentReview.orderDate && (
                    <Typography variant="body2" color="textSecondary">
                      Ngày đặt hàng: {format(new Date(currentReview.orderDate), 'dd/MM/yyyy', { locale: vi })}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2, mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>Nội dung đánh giá</Typography>
                  <Typography variant="body1">
                    {currentReview.comment || 'Không có nội dung đánh giá'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Đóng</Button>
          <Button 
            color="error" 
            onClick={() => {
              handleCloseViewDialog();
              handleOpenDeleteDialog(currentReview);
            }}
          >
            Xóa đánh giá
          </Button>
        </DialogActions>
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
