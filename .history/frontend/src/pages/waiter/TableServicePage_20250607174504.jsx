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
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  LocalDining as LocalDiningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

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
              <TableRow key={table.id}>
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
                      {table.order.status === 'ready' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<LocalDiningIcon />}
                          onClick={() => handleServeTable(table.id, table.order.id)}
                        >
                          Phục vụ
                        </Button>
                      )}
                      
                      {table.order.status === 'served' && (
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