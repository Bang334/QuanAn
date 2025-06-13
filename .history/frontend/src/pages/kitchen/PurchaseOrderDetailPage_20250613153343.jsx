import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import * as inventoryService from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    note: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const orderData = await inventoryService.getPurchaseOrderById(id);
      
      // Nếu không có items, lấy items riêng
      if (!orderData.PurchaseOrderItems || orderData.PurchaseOrderItems.length === 0) {
        const items = await inventoryService.getPurchaseOrderItems(id);
        orderData.items = items;
      } else {
        // Nếu có PurchaseOrderItems thì gán vào items để thống nhất cách truy cập
        orderData.items = orderData.PurchaseOrderItems;
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatusForm({
      ...statusForm,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenStatusDialog = (initialStatus) => {
    setStatusForm({
      status: initialStatus || '',
      note: ''
    });
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
  };

  const handleUpdateStatus = async () => {
    try {
      await inventoryService.updatePurchaseOrderStatus(id, statusForm);
      setSnackbar({
        open: true,
        message: 'Cập nhật trạng thái đơn hàng thành công',
        severity: 'success'
      });
      handleCloseStatusDialog();
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật trạng thái đơn hàng',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Chờ xử lý" color="warning" />;
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Đã duyệt" color="info" />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Đã từ chối" color="error" />;
      case 'shipping':
        return <Chip icon={<ShippingIcon />} label="Đang giao hàng" color="primary" />;
      case 'delivered':
        return <Chip icon={<ShippingIcon />} label="Đã giao" color="info" />;
      case 'completed':
        return <Chip icon={<CheckCircleIcon />} label="Hoàn thành" color="success" />;
      case 'cancelled':
        return <Chip icon={<CancelIcon />} label="Đã hủy" color="default" />;
      default:
        return <Chip label={status} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/kitchen/inventory')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Không tìm thấy thông tin đơn hàng</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/kitchen/inventory')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/kitchen/inventory')}
        >
          Quay lại
        </Button>
        <Typography variant="h4" component="h1">
          Chi tiết đơn đặt hàng #{order.id}
        </Typography>
        <Box>{getStatusChip(order.status)}</Box>
      </Box>

      <Grid container spacing={3}>
        {/* Thông tin đơn hàng */}
        <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="body2" color="text.secondary">
                    Mã đơn hàng
                  </Typography>
                  <Typography variant="body1">{order.id}</Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(order.status)}</Box>
                </Grid>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">{formatDate(order.createdAt)}</Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật lần cuối
                  </Typography>
                  <Typography variant="body1">{formatDate(order.updatedAt)}</Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="body2" color="text.secondary">
                    Người tạo đơn
                  </Typography>
                  <Typography variant="body1">
                    {order.requester ? order.requester.name : 'Không có thông tin'}
                  </Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nhà cung cấp
                  </Typography>
                  <Typography variant="body1">
                    {order.supplier ? order.supplier.name : 'Không có thông tin'}
                  </Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú
                  </Typography>
                  <Typography variant="body1">{order.notes || 'Không có ghi chú'}</Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tiền
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(order.totalAmount || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Lịch sử trạng thái */}
        <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Thao tác</Typography>
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenStatusDialog(order.status)}
                  >
                    Cập nhật trạng thái
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {order.status === 'pending' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đơn hàng đang chờ xử lý. Bạn có thể duyệt hoặc từ chối đơn hàng này.
                </Alert>
              )}
              
              {order.status === 'approved' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đơn hàng đã được duyệt. Bạn có thể cập nhật trạng thái khi nhà cung cấp bắt đầu giao hàng.
                </Alert>
              )}
              
              {order.status === 'shipping' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đơn hàng đang được giao. Bạn có thể cập nhật trạng thái khi nhà cung cấp đã giao hàng.
                </Alert>
              )}
              
              {order.status === 'delivered' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đơn hàng đã được giao. Bạn có thể cập nhật trạng thái khi đã kiểm tra và nhận hàng.
                </Alert>
              )}
              
              {order.status === 'completed' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đơn hàng đã hoàn thành. Các nguyên liệu đã được thêm vào kho.
                </Alert>
              )}
              
              {order.status === 'rejected' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Đơn hàng đã bị từ chối.
                </Alert>
              )}
              
              {order.status === 'cancelled' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Đơn hàng đã bị hủy.
                </Alert>
              )}
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Các trạng thái có thể cập nhật:
                </Typography>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {order.status === 'pending' && (
                    <>
                      <Grid>
                        <Button
                          variant="outlined"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenStatusDialog('approved')}
                          sx={{ mr: 1 }}
                        >
                          Duyệt đơn
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenStatusDialog('rejected')}
                          sx={{ mr: 1 }}
                        >
                          Từ chối
                        </Button>
                      </Grid>
                    </>
                  )}
                  
                  {order.status === 'approved' && (
                    <Grid>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<ShippingIcon />}
                        onClick={() => handleOpenStatusDialog('shipping')}
                        sx={{ mr: 1 }}
                      >
                        Đang giao hàng
                      </Button>
                    </Grid>
                  )}
                  
                  {order.status === 'shipping' && (
                    <Grid>
                      <Button
                        variant="outlined"
                        color="info"
                        startIcon={<ShippingIcon />}
                        onClick={() => handleOpenStatusDialog('delivered')}
                        sx={{ mr: 1 }}
                      >
                        Đã giao
                      </Button>
                    </Grid>
                  )}
                  
                  {order.status === 'delivered' && (
                    <Grid>
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<InventoryIcon />}
                        onClick={() => handleOpenStatusDialog('completed')}
                        sx={{ mr: 1 }}
                      >
                        Đã nhận hàng
                      </Button>
                    </Grid>
                  )}
                  
                  {(order.status === 'pending' || order.status === 'approved' || order.status === 'shipping') && (
                    <Grid>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleOpenStatusDialog('cancelled')}
                      >
                        Hủy đơn
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Danh sách sản phẩm */}
        <Grid sx={{ gridColumn: '1 / -1' }}>
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Danh sách nguyên liệu
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Hình ảnh</TableCell>
                    <TableCell>Tên nguyên liệu</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell>Đơn vị</TableCell>
                    <TableCell align="right">Đơn giá</TableCell>
                    <TableCell align="right">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items && order.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {item.Ingredient && item.Ingredient.image ? (
                          <Avatar 
                            src={item.Ingredient.image} 
                            alt={item.Ingredient.name}
                            variant="rounded"
                            sx={{ width: 50, height: 50 }}
                          />
                        ) : (
                          <Avatar 
                            variant="rounded" 
                            sx={{ width: 50, height: 50, bgcolor: 'grey.300' }}
                          >
                            <ImageIcon />
                          </Avatar>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.Ingredient ? item.Ingredient.name : 'Không có thông tin'}
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell>{item.Ingredient ? item.Ingredient.unit : 'N/A'}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} />
                    <TableCell align="right">
                      <Typography variant="subtitle1">Tổng cộng:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatCurrency(order.totalAmount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog cập nhật trạng thái */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Vui lòng chọn trạng thái mới cho đơn hàng và nhập ghi chú nếu cần.
          </DialogContentText>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              name="status"
              value={statusForm.status}
              onChange={handleStatusChange}
              label="Trạng thái"
            >
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="approved">Đã duyệt</MenuItem>
              <MenuItem value="rejected">Từ chối</MenuItem>
              <MenuItem value="shipping">Đang giao hàng</MenuItem>
              <MenuItem value="delivered">Đã giao</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Ghi chú"
            name="note"
            value={statusForm.note}
            onChange={handleStatusChange}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Hủy</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Cập nhật
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

export default PurchaseOrderDetailPage;
