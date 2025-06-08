import React, { useState, useEffect } from 'react';
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Collapse,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  LocalDining as LocalDiningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ExitToApp as ExitToAppIcon,
  PersonAdd as PersonAddIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';
import orderService from '../../services/orderService';

const TableServicePage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [expandedTable, setExpandedTable] = useState(null);
  const [openOrdersDialog, setOpenOrdersDialog] = useState(false);
  const [tableOrders, setTableOrders] = useState([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/tables?includeOrders=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setTables(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Không thể tải dữ liệu bàn');
      setLoading(false);
    }
  };

  const handleServeTable = async (tableId, orderId) => {
    try {
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: 'served' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Refresh tables
      fetchTables();
      
      setSnackbar({
        open: true,
        message: 'Đã cập nhật trạng thái phục vụ',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật trạng thái',
        severity: 'error'
      });
    }
  };

  const handleOpenPaymentDialog = (table) => {
    setSelectedTable(table);
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedTable(null);
    setPaymentMethod('cash');
  };

  const handleConfirmPayment = async () => {
    if (!selectedTable || !selectedTable.order) return;
    
    try {
      // Gọi API để cập nhật trạng thái thanh toán
      await axios.put(
        `${API_URL}/api/orders/${selectedTable.order.id}/payment`,
        {
          paymentStatus: 'paid',
          paymentMethod: paymentMethod
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Đóng dialog và làm mới dữ liệu
      handleClosePaymentDialog();
      fetchTables();
      
      setSnackbar({
        open: true,
        message: 'Thanh toán thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi xác nhận thanh toán',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleViewTableOrders = async (tableId) => {
    try {
      setLoading(true);
      
      // Lấy thông tin bàn để biết thời gian cập nhật
      const tableResponse = await axios.get(
        `${API_URL}/api/tables/${tableId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const tableInfo = tableResponse.data;
      const tableLastUpdated = new Date(tableInfo.updatedAt);
      
      // Lấy tất cả đơn hàng của bàn
      const ordersResponse = await axios.get(
        `${API_URL}/api/orders/table/${tableId}`, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Lọc chỉ lấy đơn hàng có thời gian tạo sau khi bàn được cập nhật trạng thái
      const currentCustomerOrders = ordersResponse.data.filter(order => {
        const orderCreatedAt = new Date(order.createdAt);
        return orderCreatedAt >= tableLastUpdated;
      });
      
      // Sắp xếp đơn hàng theo thời gian tạo, mới nhất lên đầu
      const sortedOrders = currentCustomerOrders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setTableOrders(sortedOrders);
      setSelectedTable(tableInfo);
      setOpenOrdersDialog(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching table orders:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải danh sách đơn hàng',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleCloseOrdersDialog = () => {
    setOpenOrdersDialog(false);
    setTableOrders([]);
    setSelectedTable(null);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'reserved': return 'warning';
      default: return 'default';
    }
  };

  const getTableStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Có khách';
      case 'reserved': return 'Đã đặt trước';
      default: return status;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'processing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'success';
      case 'payment_requested': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'processing': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'payment_requested': return 'Yêu cầu thanh toán';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const handleServeItem = async (itemId) => {
    try {
      await orderService.serveOrderItem(itemId);
      
      // Refresh tables
      fetchTables();
      
      setSnackbar({
        open: true,
        message: 'Món ăn đã được phục vụ',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error serving item:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi phục vụ món ăn',
        severity: 'error'
      });
    }
  };

  const toggleExpandTable = (tableId) => {
    setExpandedTable(expandedTable === tableId ? null : tableId);
  };

  const getItemStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ chế biến';
      case 'cooking': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const handleTableStatusChange = async (tableId, newStatus) => {
    try {
      // Nếu đang chuyển sang trạng thái available, kiểm tra tất cả đơn hàng
      if (newStatus === 'available') {
        // Lấy thông tin tất cả đơn hàng của bàn
        const ordersResponse = await axios.get(
          `${API_URL}/api/orders/table/${tableId}?status=active`, 
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        // Kiểm tra xem còn đơn hàng nào chưa hoàn thành hoặc chưa hủy không
        const activeOrders = ordersResponse.data.filter(
          order => !['completed', 'cancelled'].includes(order.status)
        );
        
        if (activeOrders.length > 0) {
          setSnackbar({
            open: true,
            message: 'Không thể cập nhật trạng thái bàn. Vẫn còn đơn hàng chưa hoàn thành.',
            severity: 'error'
          });
          return;
        }
      }
      
      // Nếu không có vấn đề, tiến hành cập nhật trạng thái bàn
      await axios.put(
        `${API_URL}/api/tables/${tableId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Refresh tables
      fetchTables();
      
      setSnackbar({
        open: true,
        message: `Đã cập nhật trạng thái bàn thành ${getTableStatusLabel(newStatus)}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating table status:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật trạng thái bàn',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return <Typography>Đang tải...</Typography>;
  }

  if (error) {
    return <Typography color="error">Lỗi: {error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Phục vụ bàn
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bàn</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Sức chứa</TableCell>
              <TableCell>Đơn hàng</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tables.map((table) => (
              <React.Fragment key={table.id}>
                <TableRow>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small"
                      label={getTableStatusLabel(table.status)} 
                      color={getTableStatusColor(table.status)} 
                    />
                  </TableCell>
                  <TableCell>{table.capacity} người</TableCell>
                  <TableCell>
                    {table.order ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          size="small"
                          label={getOrderStatusLabel(table.order.status)} 
                          color={getOrderStatusColor(table.order.status)} 
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2">
                          {table.order.OrderItems?.length || 0} món
                        </Typography>
                        {table.order.OrderItems?.some(item => item.status === 'ready') && (
                          <Chip 
                            size="small"
                            label="Có món sẵn sàng" 
                            color="success" 
                            sx={{ ml: 1 }}
                          />
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => toggleExpandTable(table.id)}
                          sx={{ ml: 1 }}
                        >
                          {expandedTable === table.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Không có đơn hàng
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {table.order && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {table.order.status === 'payment_requested' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleOpenPaymentDialog(table)}
                          >
                            Xác nhận thanh toán
                          </Button>
                        )}
                      </Box>
                    )}
                    
                    {/* Nút chuyển trạng thái bàn */}
                    <Box sx={{ display: 'flex', gap: 1, mt: table.order ? 1 : 0 }}>
                      {table.status === 'occupied' ? (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="success"
                          startIcon={<ExitToAppIcon />}
                          onClick={() => handleTableStatusChange(table.id, 'available')}
                        >
                          Khách ra về
                        </Button>
                      ) : table.status === 'available' ? (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleTableStatusChange(table.id, 'occupied')}
                        >
                          Có khách mới
                        </Button>
                      ) : null}
                      
                      {/* Nút xem danh sách đơn hàng của bàn */}
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        startIcon={<FormatListBulletedIcon />}
                        onClick={() => handleViewTableOrders(table.id)}
                      >
                        Xem đơn hàng
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
                
                {/* Expanded row for order details */}
                {table.order && expandedTable === table.id && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0 }}>
                      <Collapse in={expandedTable === table.id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Chi tiết đơn hàng
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Món ăn</TableCell>
                                <TableCell>Số lượng</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Thao tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {table.order.OrderItems?.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.MenuItem?.name}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      size="small" 
                                      label={getItemStatusLabel(item.status)}
                                      color={getOrderStatusColor(item.status)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {item.status === 'ready' && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<LocalDiningIcon />}
                                        onClick={() => handleServeItem(item.id)}
                                      >
                                        Phục vụ
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Payment Confirmation Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog}>
        <DialogTitle>Xác nhận thanh toán</DialogTitle>
        <DialogContent>
          {selectedTable && selectedTable.order && (
            <Box sx={{ minWidth: 300, mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedTable.name} - Tổng tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedTable.order.totalAmount)}
              </Typography>
              
              <List sx={{ mb: 2 }}>
                {selectedTable.order.OrderItems?.map((item, index) => (
                  <div key={item.id}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 2, width: 50, height: 50, borderRadius: 1, overflow: 'hidden' }}>
                          <img 
                            src={item.MenuItem?.image || `https://via.placeholder.com/50x50?text=${encodeURIComponent(item.MenuItem?.name || 'Món ăn')}`} 
                            alt={item.MenuItem?.name || 'Món ăn'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <ListItemText
                          primary={`${item.MenuItem?.name || 'Món #' + item.menuItemId} x${item.quantity}`}
                          secondary={`${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} / món`}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < selectedTable.order.OrderItems.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Phương thức thanh toán"
                >
                  <MenuItem value="cash">Tiền mặt</MenuItem>
                  <MenuItem value="card">Thẻ tín dụng/ghi nợ</MenuItem>
                  <MenuItem value="momo">MoMo</MenuItem>
                  <MenuItem value="zalopay">ZaloPay</MenuItem>
                  <MenuItem value="vnpay">VNPay</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Hủy</Button>
          <Button onClick={handleConfirmPayment} variant="contained" color="primary">
            Xác nhận thanh toán
          </Button>
        </DialogActions>
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
      
      {/* Dialog hiển thị danh sách đơn hàng của bàn */}
      <Dialog 
        open={openOrdersDialog} 
        onClose={handleCloseOrdersDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedTable ? `Đơn hàng của khách hiện tại - Bàn ${selectedTable.name}` : 'Danh sách đơn hàng hiện tại'}
            </Typography>
            <IconButton onClick={handleCloseOrdersDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {tableOrders.length === 0 ? (
            <Typography align="center" color="text.secondary" py={2}>
              Không có đơn hàng nào của khách hiện tại. Có thể bàn vừa được cập nhật trạng thái khi có khách mới.
            </Typography>
          ) : (
            <List>
              {tableOrders.map((order) => (
                <Paper key={order.id} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Đơn hàng #{order.id}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(order.createdAt)}
                        </Typography>
                        <Chip
                          size="small"
                          label={getOrderStatusLabel(order.status)}
                          color={getOrderStatusColor(order.status)}
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <List dense>
                      {order.OrderItems?.map((item) => (
                        <ListItem key={item.id} sx={{ py: 0.5 }}>
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: 1, 
                            overflow: 'hidden', 
                            mr: 1.5,
                            flexShrink: 0 
                          }}>
                            <img 
                              src={item.MenuItem?.image || `https://via.placeholder.com/50x50?text=${encodeURIComponent(item.MenuItem?.name || 'Món ăn')}`}
                              alt={item.MenuItem?.name || 'Món ăn'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.MenuItem?.name || `Món #${item.menuItemId}`}
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ mx: 0.5 }}>
                                  x{item.quantity}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={getItemStatusLabel(item.status)}
                                  color={getOrderStatusColor(item.status)}
                                  sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' } }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {formatPrice(item.price * item.quantity)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    <Box sx={{ mt: 1, textAlign: 'right' }}>
                      <Typography variant="subtitle2">
                        Tổng tiền: {formatPrice(order.OrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrdersDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableServicePage; 