import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải dữ liệu đơn hàng',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Áp dụng bộ lọc khi các điều kiện thay đổi
    filterOrders();
  }, [searchTerm, filterStatus, dateRange, orders]);

  const filterOrders = () => {
    let result = [...orders];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      result = result.filter(order => 
        order.id.toString().includes(searchTerm) || 
        order.tableId.toString().includes(searchTerm)
      );
    }

    // Lọc theo trạng thái
    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus);
    }

    // Lọc theo khoảng thời gian
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      result = result.filter(order => new Date(order.createdAt) >= fromDate);
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59); // Đặt thời gian là cuối ngày
      result = result.filter(order => new Date(order.createdAt) <= toDate);
    }

    setFilteredOrders(result);
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      
      // If the dialog is open for this order, update the selected order as well
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      setSnackbar({
        open: true,
        message: 'Cập nhật trạng thái đơn hàng thành công',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật trạng thái đơn hàng',
        severity: 'error',
      });
    }
  };

  const handleUpdatePayment = async (orderId, paymentStatus, paymentMethod) => {
    try {
      await axios.put(
        `${API_URL}/api/orders/${orderId}/payment`, 
        { 
          paymentStatus, 
          paymentMethod 
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Refresh orders
      fetchOrders();
      
      // Close dialog
      handleCloseDialog();
      
      setSnackbar({
        open: true,
        message: 'Cập nhật thanh toán thành công',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật thanh toán',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      case 'payment_requested': return 'Yêu cầu thanh toán';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'preparing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'info';
      case 'payment_requested': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản lý đơn hàng
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid sx={{ gridColumn: 'span 12', '@media (min-width: 600px)': { gridColumn: 'span 4' } }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo ID đơn hàng hoặc bàn..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid sx={{ gridColumn: 'span 12', '@media (min-width: 600px)': { gridColumn: 'span 3' } }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filterStatus}
                onChange={handleStatusFilterChange}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ xác nhận</MenuItem>
                <MenuItem value="preparing">Đang chuẩn bị</MenuItem>
                <MenuItem value="ready">Sẵn sàng phục vụ</MenuItem>
                <MenuItem value="served">Đã phục vụ</MenuItem>
                <MenuItem value="completed">Hoàn thành</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid sx={{ gridColumn: 'span 12', '@media (min-width: 600px)': { gridColumn: 'span 2.5' } }}>
            <TextField
              fullWidth
              label="Từ ngày"
              type="date"
              name="from"
              value={dateRange.from}
              onChange={handleDateRangeChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid sx={{ gridColumn: 'span 12', '@media (min-width: 600px)': { gridColumn: 'span 2.5' } }}>
            <TextField
              fullWidth
              label="Đến ngày"
              type="date"
              name="to"
              value={dateRange.to}
              onChange={handleDateRangeChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Bàn</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Số món</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.tableId}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.OrderItems?.length || 0}</TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(order.status)} 
                      color={getStatusColor(order.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                      color={order.paymentStatus === 'paid' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenDialog(order)}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Không tìm thấy đơn hàng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Order Detail Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              Chi tiết đơn hàng #{selectedOrder.id}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid sx={{ gridColumn: 'span 12', '@media (min-width: 600px)': { gridColumn: 'span 6' } }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Thông tin đơn hàng
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bàn:</strong> {selectedOrder.tableId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thời gian tạo:</strong> {formatDate(selectedOrder.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Trạng thái:</strong> {getStatusLabel(selectedOrder.status)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thanh toán:</strong> {selectedOrder.paymentStatus === 'paid' ? 
                      `Đã thanh toán (${getPaymentMethodLabel(selectedOrder.paymentMethod)})` : 
                      'Chưa thanh toán'}
                  </Typography>
                  {selectedOrder.notes && (
                    <Typography variant="body2">
                      <strong>Ghi chú:</strong> {selectedOrder.notes}
                    </Typography>
                  )}
                </Grid>
                
                <Grid sx={{ gridColumn: 'span 12', '@media (min-width: 600px)': { gridColumn: 'span 6' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      Tổng tiền
                    </Typography>
                    <Typography variant="h5" color="primary.main">
                      {formatPrice(selectedOrder.totalAmount)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Cập nhật trạng thái</InputLabel>
                      <Select
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                        label="Cập nhật trạng thái"
                      >
                        <MenuItem value="pending">Chờ xác nhận</MenuItem>
                        <MenuItem value="preparing">Đang chuẩn bị</MenuItem>
                        <MenuItem value="ready">Sẵn sàng phục vụ</MenuItem>
                        <MenuItem value="served">Đã phục vụ</MenuItem>
                        <MenuItem value="completed">Hoàn thành</MenuItem>
                        <MenuItem value="cancelled">Đã hủy</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {selectedOrder.paymentStatus !== 'paid' && selectedOrder.status === 'served' && (
                      <FormControl fullWidth>
                        <InputLabel>Phương thức thanh toán</InputLabel>
                        <Select
                          defaultValue=""
                          label="Phương thức thanh toán"
                          onChange={(e) => handleUpdatePayment(selectedOrder.id, 'paid', e.target.value)}
                        >
                          <MenuItem value="cash">Tiền mặt</MenuItem>
                          <MenuItem value="card">Thẻ tín dụng/ghi nợ</MenuItem>
                          <MenuItem value="momo">MoMo</MenuItem>
                          <MenuItem value="zalopay">ZaloPay</MenuItem>
                          <MenuItem value="vnpay">VNPay</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    
                    {selectedOrder.paymentStatus !== 'paid' && selectedOrder.status !== 'served' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        * Phương thức thanh toán sẽ được hiển thị khi đơn hàng đã được phục vụ
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Danh sách món
                  </Typography>
                  <List>
                    {selectedOrder.OrderItems?.map((item, index) => (
                      <div key={item.id}>
                        <ListItem>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box sx={{ mr: 2, width: 60, height: 60, borderRadius: 1, overflow: 'hidden' }}>
                              <img 
                                src={item.MenuItem?.image || `https://via.placeholder.com/60x60?text=${encodeURIComponent(item.MenuItem?.name || 'Món ăn')}`} 
                                alt={item.MenuItem?.name || 'Món ăn'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                            <ListItemText
                              primary={`${item.MenuItem?.name || 'Món #' + item.menuItemId} x${item.quantity}`}
                              secondary={item.notes}
                            />
                            <Typography variant="body2">
                              {formatPrice(item.price * item.quantity)}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < selectedOrder.OrderItems.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderManagementPage; 