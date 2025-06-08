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
  Collapse
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  LocalDining as LocalDiningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ExitToApp as ExitToAppIcon,
  PersonAdd as PersonAddIcon
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
    </Box>
  );
};

export default TableServicePage; 