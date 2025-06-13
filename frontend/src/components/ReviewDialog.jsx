import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { createReview } from '../services/reviewService';

const ReviewDialog = ({ open, onClose, menuItem, orderId, tableId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createReview({
        rating,
        comment,
        menuItemId: menuItem.id,
        orderId,
        tableId
      });
      
      setSuccess(true);
      setLoading(false);
      
      // Tự động đóng dialog sau 2 giây khi đánh giá thành công
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form khi đóng
    setRating(0);
    setComment('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Đánh giá món ăn</DialogTitle>
      <DialogContent>
        {menuItem && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={menuItem.image}
              alt={menuItem.name}
              variant="rounded"
              sx={{ width: 60, height: 60, mr: 2 }}
            />
            <Box>
              <Typography variant="h6">{menuItem.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {menuItem.category}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ my: 2 }}>
          <Typography component="legend">Đánh giá của bạn</Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            size="large"
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Nhận xét của bạn (không bắt buộc)"
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Cảm ơn bạn đã đánh giá!
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || success}
        >
          {loading ? <CircularProgress size={24} /> : 'Gửi đánh giá'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewDialog; 