import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
  Slide,
  Paper,
} from '@mui/material';
import {
  Star as StarIcon,
  Close as CloseIcon,
  RestaurantMenu as FoodIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const ReviewReminder = () => {
  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const { getUnreviewedItems, submitReview } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra xem có món ăn nào cần đánh giá không
    const checkForUnreviewedItems = () => {
      const unreviewedItems = getUnreviewedItems();
      
      if (unreviewedItems && unreviewedItems.length > 0) {
        // Chọn một món ngẫu nhiên để đánh giá
        const randomIndex = Math.floor(Math.random() * unreviewedItems.length);
        setCurrentItem(unreviewedItems[randomIndex]);
        setOpen(true);
      }
    };
    
    // Kiểm tra sau 2 giây khi component được mount
    const timer = setTimeout(checkForUnreviewedItems, 2000);
    
    return () => clearTimeout(timer);
  }, [getUnreviewedItems]);
  
  const handleClose = () => {
    setOpen(false);
    setCurrentItem(null);
    setRating(5);
    setComment('');
  };
  
  const handleLater = () => {
    setOpen(false);
    setCurrentItem(null);
  };
  
  const handleSubmit = () => {
    if (currentItem) {
      submitReview(currentItem.id, rating, comment);
      setSnackbarMessage('Cảm ơn bạn đã đánh giá món ăn!');
      setSnackbarOpen(true);
      handleClose();
    }
  };
  
  const handleViewDetails = () => {
    if (currentItem) {
      navigate(`/food/${currentItem.id}`);
      handleClose();
    }
  };
  
  if (!currentItem) return null;
  
  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Đánh giá món ăn</Typography>
          </Box>
          <IconButton edge="end" color="inherit" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <FoodIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{currentItem.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Bạn đã gọi món này vào {new Date(currentItem.orderDate).toLocaleString('vi-VN')}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bạn thấy món ăn này như thế nào? Hãy cho chúng tôi biết đánh giá của bạn!
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Rating
              name="food-rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
              precision={1}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {rating === 5 ? 'Tuyệt vời!' : 
               rating === 4 ? 'Rất ngon' : 
               rating === 3 ? 'Khá ổn' : 
               rating === 2 ? 'Không thực sự ngon' : 
               'Không ngon'}
            </Typography>
          </Box>
          
          <TextField
            label="Nhận xét của bạn (không bắt buộc)"
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Hãy chia sẻ trải nghiệm của bạn về món ăn này..."
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="outlined"
            onClick={handleViewDetails}
            fullWidth
            sx={{ mb: 2 }}
          >
            Xem chi tiết món ăn
          </Button>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleLater} color="inherit">
            Để sau
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!rating} 
            startIcon={<SendIcon />}
          >
            Gửi đánh giá
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReviewReminder; 