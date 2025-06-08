import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Restaurant as RestaurantIcon,
  Payment as PaymentIcon,
  LocalDining as DiningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  CreditCard as CreditCardIcon,
  Money as MoneyIcon,
  AccountBalance as BankIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  Notes as NotesIcon,
  Close as CloseIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import orderService from '../../services/orderService';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // For order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // For payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const filters = {
        date: todayStr // Always filter by today's date
      };
      
      if (statusFilter) filters.status = statusFilter;
      if (tableFilter) filters.tableId = tableFilter;
      
      const data = await orderService.getAllOrders(filters);
      setOrders(data);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
    
    // Set up polling to refresh orders every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter, tableFilter]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Set status filter based on tab
    switch (newValue) {
      case 0: // All
        setStatusFilter('');
        break;
      case 1: // Pending
        setStatusFilter('pending');
        break;
      case 2: // Processing
        setStatusFilter('processing');
        break;
      case 3: // Ready
        setStatusFilter('ready');
        break;
      case 4: // Served
        setStatusFilter('served');
        break;
      case 5: // Payment Requested
        setStatusFilter('payment_requested');
        break;
      default:
        setStatusFilter('');
    }
  };
  
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };
  
  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setPaymentOpen(true);
  };
  
  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    
    try {
      setProcessingPayment(true);
      await orderService.processPayment(selectedOrder.id, paymentMethod);
      setPaymentOpen(false);
      fetchOrders();
    } catch (err) {
      setError('Lỗi khi xử lý thanh toán. Vui lòng thử lại.');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      fetchOrders();
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái đơn hàng.');
      console.error('Error updating order status:', err);
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang chế biến';
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
      case 'processing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'success';
      case 'payment_requested': return 'error';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <InfoIcon />;
      case 'processing': return <RestaurantIcon />;
      case 'ready': return <DiningIcon />;
      case 'served': return <CheckIcon />;
      case 'payment_requested': return <PaymentIcon />;
      case 'completed': return <CheckIcon />;
      default: return <InfoIcon />;
    }
  };
  
  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Đơn hàng hôm nay
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tất cả" />
          <Tab 
            label={
              <Badge 
                badgeContent={orders.filter(o => o.status === 'pending').length} 
                color="error"
              >
                Chờ xử lý
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={orders.filter(o => o.status === 'processing').length} 
                color="warning"
              >
                Đang chế biến
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={orders.filter(o => o.status === 'ready').length} 
                color="info"
              >
                Sẵn sàng phục vụ
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={orders.filter(o => o.status === 'served').length} 
                color="success"
              >
                Đã phục vụ
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={orders.filter(o => o.status === 'payment_requested').length} 
                color="error"
              >
                Yêu cầu thanh toán
              </Badge>
            } 
          />
        </Tabs>
      </Paper>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Lọc theo bàn"
              type="number"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              fullWidth
            >
              Làm mới
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Không có đơn hàng nào hôm nay</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  borderLeft: 4,
                  borderColor: `${getStatusColor(order.status)}.main`,
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">
                      Bàn {order.tableId}
                    </Typography>
                    <Chip 
                      icon={getStatusIcon(order.status)}
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Thời gian: {formatTime(order.createdAt)}
                  </Typography>
                  
                  <Typography variant="body2">
                    Món: {order.OrderItems?.length || 0}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(order.totalAmount)}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 1, pt: 0 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleViewDetails(order)}
                  >
                    Chi tiết
                  </Button>
                  
                  {order.status === 'ready' && (
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleStatusChange(order.id, 'served')}
                    >
                      Đã phục vụ
                    </Button>
                  )}
                  
                  {order.status === 'payment_requested' && (
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="success"
                      startIcon={<PaymentIcon />}
                      onClick={() => handleOpenPayment(order)}
                    >
                      Thanh toán
                    </Button>
                  )}
                  
                  {(order.status === 'served') && (
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="success"
                      startIcon={<PaymentIcon />}
                      onClick={() => handleOpenPayment(order)}
                    >
                      Thanh toán
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6">
                Bàn {selectedOrder.tableId} - Đơn hàng #{selectedOrder.id}
              </Typography>
              <Chip 
                label={getStatusLabel(selectedOrder.status)}
                color={getStatusColor(selectedOrder.status)}
                size="small"
                sx={{ color: 'white', fontWeight: 'bold' }}
              />
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        Thông tin đơn hàng
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <InfoIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Trạng thái: 
                          <Chip 
                            label={getStatusLabel(selectedOrder.status)}
                            color={getStatusColor(selectedOrder.status)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Thời gian: {formatTime(selectedOrder.createdAt)}
                        </Typography>
                      </Box>
                      
                      {selectedOrder.notes && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <NotesIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Ghi chú: {selectedOrder.notes}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        Tổng quan
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2, color: 'primary.main' }}>
                        {formatCurrency(selectedOrder.totalAmount)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Chip 
                          icon={<RestaurantIcon />} 
                          label={`${selectedOrder.OrderItems?.length || 0} món`} 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ p: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  Danh sách món
                </Typography>
                <List sx={{ p: 0 }}>
                  {selectedOrder.OrderItems?.map((item) => (
                    <ListItem 
                      key={item.id} 
                      divider 
                      sx={{ 
                        p: 2,
                        '&:hover': {
                          bgcolor: 'background.default'
                        }
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={3} sm={2}>
                          <Box 
                            component="img"
                            src={item.MenuItem?.image || 'https://via.placeholder.com/80?text=Món+ăn'}
                            alt={item.MenuItem?.name}
                            sx={{ 
                              width: '100%', 
                              aspectRatio: '1/1',
                              objectFit: 'cover',
                              borderRadius: 1,
                              boxShadow: 1
                            }}
                          />
                        </Grid>
                        <Grid item xs={9} sm={7}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {item.MenuItem?.name || 'Món không xác định'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(item.price)} x {item.quantity} = {formatCurrency(item.price * item.quantity)}
                          </Typography>
                          {item.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              "{item.notes}"
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                          <Chip 
                            label={getStatusLabel(item.status)}
                            color={getStatusColor(item.status)}
                            size="small"
                            icon={getStatusIcon(item.status)}
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button 
                onClick={() => setDetailsOpen(false)}
                variant="outlined"
                startIcon={<CloseIcon />}
              >
                Đóng
              </Button>
              <Box>
                {selectedOrder.status === 'ready' && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, 'served');
                      setDetailsOpen(false);
                    }}
                    sx={{ ml: 1 }}
                  >
                    Đánh dấu đã phục vụ
                  </Button>
                )}
                {(selectedOrder.status === 'served' || selectedOrder.status === 'payment_requested') && (
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<PaymentIcon />}
                    onClick={() => {
                      setDetailsOpen(false);
                      setPaymentOpen(true);
                    }}
                    sx={{ ml: 1 }}
                  >
                    Xử lý thanh toán
                  </Button>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog
        open={paymentOpen}
        onClose={() => !processingPayment && setPaymentOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Thanh toán - Bàn {selectedOrder.tableId}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                {formatCurrency(selectedOrder.totalAmount)}
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={processingPayment}
                >
                  <MenuItem value="cash">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon sx={{ mr: 1 }} />
                      Tiền mặt
                    </Box>
                  </MenuItem>
                  <MenuItem value="credit_card">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditCardIcon sx={{ mr: 1 }} />
                      Thẻ tín dụng
                    </Box>
                  </MenuItem>
                  <MenuItem value="bank_transfer">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BankIcon sx={{ mr: 1 }} />
                      Chuyển khoản
                    </Box>
                  </MenuItem>
                  <MenuItem value="momo">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1 }} />
                      MoMo
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setPaymentOpen(false)}
                disabled={processingPayment}
              >
                Hủy
              </Button>
              <Button 
                variant="contained" 
                color="success"
                startIcon={processingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
                onClick={handleProcessPayment}
                disabled={processingPayment}
              >
                {processingPayment ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default OrdersPage; 