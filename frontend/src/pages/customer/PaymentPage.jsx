import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  LocalAtm as CashIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import axios from 'axios';

const PaymentPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const { tableId } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }

    // Giả lập dữ liệu đơn hàng - trong thực tế sẽ lấy từ API
    const mockOrder = {
      id: parseInt(orderId, 10),
      tableId: tableId,
      status: 'payment_requested',
      items: [
        { id: 1, name: 'Phở bò', quantity: 2, status: 'served', price: 50000 },
        { id: 2, name: 'Chả giò', quantity: 1, status: 'served', price: 35000 },
      ],
      createdAt: new Date().toISOString(),
      total: 135000,
    };

    setOrder(mockOrder);
    setLoading(false);
  }, [orderId, tableId, navigate]);

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handlePayment = () => {
    // Trong thực tế sẽ gọi API để xử lý thanh toán
    setPaymentProcessing(true);
    
    // Giả lập quá trình thanh toán
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      
      // Cập nhật trạng thái đơn hàng
      setOrder(prevOrder => ({
        ...prevOrder,
        status: 'completed'
      }));
    }, 2000);
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

  if (!tableId) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h5" gutterBottom>
          Vui lòng chọn bàn trước khi xem thanh toán
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
    return <Typography>Đang tải...</Typography>;
  }

  if (error) {
    return <Typography color="error">Lỗi: {error}</Typography>;
  }

  if (!order) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Không tìm thấy đơn hàng
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/order')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách đơn hàng
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Thanh toán đơn hàng #{order.id}
      </Typography>
      
      {paymentSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Thanh toán thành công! Cảm ơn quý khách đã sử dụng dịch vụ.
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Thông tin đơn hàng
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Bàn: {order.tableId}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thời gian: {formatDateTime(order.createdAt)}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 2 }} />
        
        <List disablePadding>
          {order.items.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primary={`${item.name} x${item.quantity}`}
                secondary={formatPrice(item.price)}
              />
              <Typography variant="body2">
                {formatPrice(item.price * item.quantity)}
              </Typography>
            </ListItem>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <ListItem disablePadding sx={{ py: 1 }}>
            <ListItemText primary="Tổng tiền" />
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              {formatPrice(order.total)}
            </Typography>
          </ListItem>
        </List>
      </Paper>
      
      {!paymentSuccess && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Phương thức thanh toán
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              aria-label="payment-method"
              name="payment-method"
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
            >
              <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
                <FormControlLabel 
                  value="cash" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CashIcon sx={{ mr: 1 }} />
                      <Typography>Tiền mặt</Typography>
                    </Box>
                  }
                />
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <FormControlLabel 
                  value="card" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditCardIcon sx={{ mr: 1 }} />
                      <Typography>Thẻ tín dụng/ghi nợ</Typography>
                    </Box>
                  }
                />
                
                {paymentMethod === 'card' && (
                  <Box sx={{ pl: 4, mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Số thẻ"
                      variant="outlined"
                      placeholder="XXXX XXXX XXXX XXXX"
                      sx={{ mb: 2 }}
                      disabled={paymentProcessing}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Ngày hết hạn"
                          variant="outlined"
                          placeholder="MM/YY"
                          disabled={paymentProcessing}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="CVV"
                          variant="outlined"
                          placeholder="XXX"
                          disabled={paymentProcessing}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </RadioGroup>
          </FormControl>
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined"
          onClick={() => navigate(`/status/${order.id}`)}
          disabled={paymentProcessing}
        >
          Quay lại
        </Button>
        
        {!paymentSuccess ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handlePayment}
            disabled={paymentProcessing}
            startIcon={paymentProcessing ? <CircularProgress size={20} /> : null}
          >
            {paymentProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="success"
            onClick={() => navigate('/')}
            startIcon={<CheckIcon />}
          >
            Hoàn tất
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PaymentPage; 