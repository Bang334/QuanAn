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
} from '@mui/icons-material';
import { format } from 'date-fns';
import orderService from '../../services/orderService';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
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
      
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (dateFilter) filters.date = dateFilter;
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
  }, [statusFilter, dateFilter, tableFilter]);
  
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
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
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
        Quản lý đơn hàng
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
            <TextField
              fullWidth
              label="Lọc theo ngày"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
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
          <Typography>Không tìm thấy đơn hàng nào</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order.id}>
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
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Bàn {order.tableId} - Đơn #{order.id}
                    </Typography>
                    <Chip 
                      icon={getStatusIcon(order.status)}
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Thời gian: {formatDate(order.createdAt)}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2">
                    Số món: {order.OrderItems?.length || 0}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Tổng tiền: {formatCurrency(order.totalAmount)}
                  </Typography>
                  
                  {order.notes && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ghi chú: {order.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
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
                      Xử lý thanh toán
                    </Button>
                  )}
                  
                  {(order.status === 'served' || order.status === 'processing') && (
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
            <DialogTitle>
              Chi tiết đơn hàng #{selectedOrder.id} - Bàn {selectedOrder.tableId}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Thông tin đơn hàng</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Trạng thái: 
                    <Chip 
                      label={getStatusLabel(selectedOrder.status)}
                      color={getStatusColor(selectedOrder.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="body2">
                    Thời gian tạo: {formatDate(selectedOrder.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    Thanh toán: {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Typography>
                  {selectedOrder.notes && (
                    <Typography variant="body2">
                      Ghi chú: {selectedOrder.notes}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Tổng quan</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Tổng tiền: {formatCurrency(selectedOrder.totalAmount)}
                  </Typography>
                  <Typography variant="body2">
                    Số món: {selectedOrder.OrderItems?.length || 0}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Danh sách món</Typography>
                  <Divider sx={{ my: 1 }} />
                  <List>
                    {selectedOrder.OrderItems?.map((item) => (
                      <ListItem key={item.id} divider>
                        <ListItemText
                          primary={`${item.MenuItem?.name || 'Món không xác định'} x${item.quantity}`}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Đơn giá: {formatCurrency(item.price)}
                              </Typography>
                              <br />
                              {item.notes && (
                                <Typography variant="body2" component="span" color="text.secondary">
                                  Ghi chú: {item.notes}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={getStatusLabel(item.status)}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Đóng
              </Button>
              {selectedOrder.status === 'ready' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    handleStatusChange(selectedOrder.id, 'served');
                    setDetailsOpen(false);
                  }}
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
                >
                  Xử lý thanh toán
                </Button>
              )}
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
              Thanh toán đơn hàng #{selectedOrder.id} - Bàn {selectedOrder.tableId}
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
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Xác nhận thanh toán sẽ đánh dấu đơn hàng là đã hoàn thành và giải phóng bàn.
              </Typography>
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