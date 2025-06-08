import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Button, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, Divider, Card, CardContent,
  FormControlLabel, Switch, InputAdornment, Tabs, Tab
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, Search, CheckCircle, 
  Cancel, Visibility, Receipt, LocalShipping, Send
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as inventoryService from '../../services/inventoryService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { API_URL } from '../../config';

const API_ENDPOINT = `${API_URL}/api`;

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewOrderDialog, setViewOrderDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Purchase Order form state
  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ ingredientId: '', quantity: 1, unitPrice: 0 }]
  });

  // Status update form
  const [statusForm, setStatusForm] = useState({
    status: '',
    adminNotes: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all necessary data
        const [ordersData, suppliersData, ingredientsData] = await Promise.all([
          inventoryService.getAllPurchaseOrders(),
          inventoryService.getAllSuppliers(),
          inventoryService.getAllIngredients()
        ]);
        
        setPurchaseOrders(ordersData);
        setSuppliers(suppliersData);
        setIngredients(ingredientsData);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
        showSnackbar('Có lỗi xảy ra khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Open dialog to create new order
  const handleOpenDialog = () => {
    setOrderForm({
      supplierId: '',
      expectedDeliveryDate: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      notes: '',
      items: [{ ingredientId: '', quantity: 1, unitPrice: 0 }]
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // View order details
  const handleViewOrder = async (orderId) => {
    try {
      const orderDetails = await inventoryService.getPurchaseOrderById(orderId);
      setCurrentOrder(orderDetails);
      setStatusForm({
        status: orderDetails.status,
        adminNotes: orderDetails.adminNotes || ''
      });
      setViewOrderDialog(true);
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng', 'error');
    }
  };

  // Close view order dialog
  const handleCloseViewOrderDialog = () => {
    setViewOrderDialog(false);
    setCurrentOrder(null);
  };

  // Handle order form change
  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm({
      ...orderForm,
      [name]: value
    });
  };

  // Handle order item change
  const handleOrderItemChange = (index, field, value) => {
    const updatedItems = [...orderForm.items];
    
    if (field === 'ingredientId' && value) {
      // Auto-fill unit price when ingredient is selected
      const selectedIngredient = ingredients.find(ing => ing.id === parseInt(value));
      if (selectedIngredient) {
        updatedItems[index] = {
          ...updatedItems[index],
          ingredientId: value,
          unitPrice: selectedIngredient.unitPrice
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          ingredientId: value
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === 'quantity' ? parseFloat(value) : value
      };
    }
    
    setOrderForm({
      ...orderForm,
      items: updatedItems
    });
  };

  // Add new order item
  const handleAddOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { ingredientId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  // Remove order item
  const handleRemoveOrderItem = (index) => {
    const updatedItems = [...orderForm.items];
    updatedItems.splice(index, 1);
    setOrderForm({
      ...orderForm,
      items: updatedItems
    });
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return orderForm.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  // Save purchase order
  const handleSavePurchaseOrder = async () => {
    try {
      // Format the data for API
      const orderData = {
        ...orderForm,
        items: orderForm.items.map(item => ({
          ingredientId: parseInt(item.ingredientId),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        })),
        totalAmount: calculateTotalAmount()
      };
      
      await inventoryService.createPurchaseOrder(orderData);
      showSnackbar('Đơn đặt hàng đã được tạo thành công');
      
      // Refresh purchase orders list
      const updatedOrders = await inventoryService.getAllPurchaseOrders();
      setPurchaseOrders(updatedOrders);
      
      handleCloseDialog();
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi tạo đơn đặt hàng', 'error');
    }
  };

  // Handle status form change
  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusForm({
      ...statusForm,
      [name]: value
    });
  };

  // Update order status
  const handleUpdateStatus = async () => {
    try {
      await inventoryService.updatePurchaseOrderStatus(currentOrder.id, statusForm);
      showSnackbar('Trạng thái đơn hàng đã được cập nhật thành công');
      
      // Refresh purchase orders list
      const updatedOrders = await inventoryService.getAllPurchaseOrders();
      setPurchaseOrders(updatedOrders);
      
      handleCloseViewOrderDialog();
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng', 'error');
    }
  };

  // Delete purchase order
  const handleDeleteOrder = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt hàng này?')) {
      try {
        await inventoryService.deletePurchaseOrder(id);
        showSnackbar('Đơn đặt hàng đã được xóa thành công');
        
        // Refresh purchase orders list
        const updatedOrders = await inventoryService.getAllPurchaseOrders();
        setPurchaseOrders(updatedOrders);
      } catch (err) {
        showSnackbar(err.message || 'Có lỗi xảy ra khi xóa đơn đặt hàng', 'error');
      }
    }
  };

  // Filter purchase orders based on search term and tab
  const filteredOrders = purchaseOrders.filter(order => {
    // Filter by search term
    const matchesSearch = 
      order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requester?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab/status
    let statusMatch = true;
    if (tabValue === 0) statusMatch = true; // All orders
    else if (tabValue === 1) statusMatch = order.status === 'pending'; // Pending orders
    else if (tabValue === 2) statusMatch = order.status === 'approved'; // Approved orders
    else if (tabValue === 3) statusMatch = order.status === 'completed'; // Completed orders
    else if (tabValue === 4) statusMatch = order.status === 'cancelled'; // Cancelled orders
    
    return matchesSearch && statusMatch;
  });

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  // Render purchase order form dialog
  const renderOrderFormDialog = () => (
    <>
      <DialogTitle>Tạo đơn đặt hàng mới</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Nhà cung cấp</InputLabel>
              <Select
                name="supplierId"
                value={orderForm.supplierId}
                onChange={handleOrderFormChange}
                label="Nhà cung cấp"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ngày giao hàng dự kiến"
              name="expectedDeliveryDate"
              type="date"
              value={orderForm.expectedDeliveryDate}
              onChange={handleOrderFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ghi chú"
              name="notes"
              value={orderForm.notes}
              onChange={handleOrderFormChange}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Danh sách nguyên liệu
            </Typography>
            
            {orderForm.items.map((item, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <FormControl fullWidth required>
                    <InputLabel>Nguyên liệu</InputLabel>
                    <Select
                      value={item.ingredientId}
                      onChange={(e) => handleOrderItemChange(index, 'ingredientId', e.target.value)}
                      label="Nguyên liệu"
                    >
                      {ingredients.map((ingredient) => (
                        <MenuItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.unit})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Số lượng"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleOrderItemChange(index, 'quantity', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0.01, step: 0.01 }
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Đơn giá"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleOrderItemChange(index, 'unitPrice', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0, step: 1000 },
                      startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    color="error" 
                    onClick={() => handleRemoveOrderItem(index)}
                    disabled={orderForm.items.length <= 1}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddOrderItem}
              sx={{ mt: 1 }}
            >
              Thêm nguyên liệu
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" align="right">
              Tổng tiền: {calculateTotalAmount().toLocaleString('vi-VN')}₫
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Hủy</Button>
        <Button 
          onClick={handleSavePurchaseOrder} 
          variant="contained" 
          color="primary"
          disabled={
            !orderForm.supplierId || 
            !orderForm.expectedDeliveryDate || 
            orderForm.items.some(item => !item.ingredientId || item.quantity <= 0 || item.unitPrice <= 0)
          }
        >
          Tạo đơn hàng
        </Button>
      </DialogActions>
    </>
  );

  // Render view order dialog
  const renderViewOrderDialog = () => {
    if (!currentOrder) return null;
    
    return (
      <>
        <DialogTitle>
          Chi tiết đơn đặt hàng #{currentOrder.id}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Nhà cung cấp:</Typography>
              <Typography variant="body1">{currentOrder.supplier?.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Trạng thái:</Typography>
              <Chip 
                label={getStatusText(currentOrder.status)} 
                color={getStatusColor(currentOrder.status)} 
                size="small" 
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Người yêu cầu:</Typography>
              <Typography variant="body1">{currentOrder.requester?.username}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ngày tạo:</Typography>
              <Typography variant="body1">
                {format(new Date(currentOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ngày giao dự kiến:</Typography>
              <Typography variant="body1">
                {format(new Date(currentOrder.expectedDeliveryDate), 'dd/MM/yyyy', { locale: vi })}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Tổng tiền:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {currentOrder.totalAmount?.toLocaleString('vi-VN')}₫
              </Typography>
            </Grid>
            
            {currentOrder.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Ghi chú:</Typography>
                <Typography variant="body1">{currentOrder.notes}</Typography>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Danh sách nguyên liệu</Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nguyên liệu</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.ingredient?.name}</TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.ingredient?.unit}
                        </TableCell>
                        <TableCell align="right">
                          {item.unitPrice?.toLocaleString('vi-VN')}₫
                        </TableCell>
                        <TableCell align="right">
                          {(item.quantity * item.unitPrice)?.toLocaleString('vi-VN')}₫
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            {/* Status update form - only show for pending orders */}
            {currentOrder.status === 'pending' && (
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Cập nhật trạng thái</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        name="status"
                        value={statusForm.status}
                        onChange={handleStatusFormChange}
                        label="Trạng thái"
                      >
                        <MenuItem value="pending">Chờ duyệt</MenuItem>
                        <MenuItem value="approved">Duyệt đơn</MenuItem>
                        <MenuItem value="cancelled">Hủy đơn</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú của Admin"
                      name="adminNotes"
                      value={statusForm.adminNotes}
                      onChange={handleStatusFormChange}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
            
            {/* Status update form - only show for approved orders */}
            {currentOrder.status === 'approved' && (
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Cập nhật trạng thái</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        name="status"
                        value={statusForm.status}
                        onChange={handleStatusFormChange}
                        label="Trạng thái"
                      >
                        <MenuItem value="approved">Đã duyệt</MenuItem>
                        <MenuItem value="completed">Hoàn thành</MenuItem>
                        <MenuItem value="cancelled">Hủy đơn</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú của Admin"
                      name="adminNotes"
                      value={statusForm.adminNotes}
                      onChange={handleStatusFormChange}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewOrderDialog}>Đóng</Button>
          {(currentOrder.status === 'pending' || currentOrder.status === 'approved') && (
            <Button 
              onClick={handleUpdateStatus} 
              variant="contained" 
              color="primary"
            >
              Cập nhật trạng thái
            </Button>
          )}
        </DialogActions>
      </>
    );
  };

  // Render purchase orders table
  const renderPurchaseOrdersTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Nhà cung cấp</TableCell>
            <TableCell>Người yêu cầu</TableCell>
            <TableCell>Ngày tạo</TableCell>
            <TableCell>Ngày giao dự kiến</TableCell>
            <TableCell align="right">Tổng tiền</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>{order.supplier?.name}</TableCell>
                <TableCell>{order.requester?.username}</TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi })}
                </TableCell>
                <TableCell>
                  {format(new Date(order.expectedDeliveryDate), 'dd/MM/yyyy', { locale: vi })}
                </TableCell>
                <TableCell align="right">{order.totalAmount?.toLocaleString('vi-VN')}₫</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(order.status)} 
                    color={getStatusColor(order.status)} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="info" 
                    onClick={() => handleViewOrder(order.id)}
                    size="small"
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                  {order.status === 'pending' && (
                    <IconButton 
                      color="secondary" 
                      onClick={() => handleDeleteOrder(order.id)}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} align="center">
                {searchTerm ? 'Không tìm thấy đơn đặt hàng phù hợp' : 'Chưa có đơn đặt hàng nào'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý đơn đặt hàng
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleOpenDialog}
          >
            Tạo đơn đặt hàng
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Tất cả" />
          <Tab label="Chờ duyệt" />
          <Tab label="Đã duyệt" />
          <Tab label="Hoàn thành" />
          <Tab label="Đã hủy" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Tìm đơn đặt hàng..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: '50%' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setSearchTerm('');
              setTabValue(tabValue); // Trigger re-fetch
            }}
          >
            Làm mới
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : (
          renderPurchaseOrdersTable()
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {renderOrderFormDialog()}
      </Dialog>

      <Dialog open={viewOrderDialog} onClose={handleCloseViewOrderDialog} maxWidth="md" fullWidth>
        {renderViewOrderDialog()}
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

export default PurchaseOrdersPage;
