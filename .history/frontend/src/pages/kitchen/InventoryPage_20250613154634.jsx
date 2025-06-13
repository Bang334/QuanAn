import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Tabs, Tab, Button, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, InputAdornment, MenuItem,
  CircularProgress, Tooltip, Card, CardContent, Divider, Avatar
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, Search, Warning, 
  History, TrendingUp, Inventory, Receipt, AddCircleOutline, RemoveCircleOutline, Visibility,
  LocalShipping, DateRange, Info, Cancel, CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as inventoryService from '../../services/inventoryService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';

const InventoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [hasAutoApprove, setHasAutoApprove] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Adjustment form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: 0,
    reason: '',
    type: 'increase' // 'increase' or 'decrease'
  });

  // Purchase order form state
  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ ingredientId: '', quantity: 1 }]
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if user has auto-approve permission
        if (user && user.id) {
          const permissionData = await inventoryService.checkAutoApprovePermission(user.id);
          setHasAutoApprove(permissionData.hasAutoApprove);
        }

        // Luôn lấy danh sách nguyên liệu để hiển thị số danh mục từ đầu
        const ingredientsData = await inventoryService.getAllIngredients();
        console.log("Fetched ingredients data:", ingredientsData);
        setIngredients(ingredientsData);
        
        // Lấy danh sách nhà cung cấp
        const suppliersData = await inventoryService.getActiveSuppliers();
        setSuppliers(suppliersData);
        
        // Nếu đang ở tab đơn đặt hàng, lấy thêm danh sách đơn đặt hàng
        if (tabValue === 1) {
          const ordersData = await inventoryService.getKitchenPurchaseOrders();
          setPurchaseOrders(ordersData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
        showSnackbar('Có lỗi xảy ra khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tabValue, user]);

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

  // Open dialog to create purchase order
  const handleOpenDialog = () => {
    setOrderForm({
      supplierId: '',
      expectedDeliveryDate: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      notes: '',
      items: [{ ingredientId: '', quantity: 1 }]
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Open adjust quantity dialog
  const handleOpenAdjustDialog = (ingredient, type = 'increase') => {
    setCurrentItem(ingredient);
    setAdjustmentForm({
      quantity: 0,
      reason: '',
      type
    });
    setAdjustDialog(true);
  };

  // Close adjust dialog
  const handleCloseAdjustDialog = () => {
    setAdjustDialog(false);
    setCurrentItem(null);
  };

  // Handle adjustment form change
  const handleAdjustmentFormChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentForm({
      ...adjustmentForm,
      [name]: name === 'quantity' ? parseFloat(value) : value
    });
  };

  // Handle adjustment type change
  const handleAdjustmentTypeChange = (type) => {
    setAdjustmentForm({
      ...adjustmentForm,
      type
    });
  };

  // Save adjustment
  const handleSaveAdjustment = async () => {
    try {
      const adjustmentData = {
        quantity: adjustmentForm.type === 'increase' 
          ? Math.abs(adjustmentForm.quantity) 
          : -Math.abs(adjustmentForm.quantity),
        reason: adjustmentForm.reason
      };
      
      await inventoryService.adjustIngredientQuantity(currentItem.id, adjustmentData);
      showSnackbar('Số lượng nguyên liệu đã được điều chỉnh thành công');
      
      // Refresh ingredients list
      const updatedIngredients = await inventoryService.getAllIngredients();
      setIngredients(updatedIngredients);
      
      handleCloseAdjustDialog();
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi điều chỉnh số lượng', 'error');
    }
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
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' ? parseFloat(value) : value
    };
    
    setOrderForm({
      ...orderForm,
      items: updatedItems
    });
  };

  // Add new order item
  const handleAddOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { ingredientId: '', quantity: 1 }]
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

  // Save purchase order
  const handleSavePurchaseOrder = async () => {
    try {
      // Format the data for API
      const orderData = {
        ...orderForm,
        items: orderForm.items.map(item => ({
          ingredientId: parseInt(item.ingredientId),
          quantity: parseFloat(item.quantity)
        })),
        autoApprove: hasAutoApprove
      };
      
      await inventoryService.createPurchaseOrder(orderData);
      showSnackbar('Đơn đặt hàng đã được tạo thành công');
      
      // Refresh purchase orders list
      const updatedOrders = await inventoryService.getKitchenPurchaseOrders();
      setPurchaseOrders(updatedOrders);
      
      handleCloseDialog();
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi tạo đơn đặt hàng', 'error');
    }
  };

  // Compute filtered ingredients
  const filteredIngredients = useMemo(() => {
    if (!ingredients) return [];
    
    return ingredients.filter(ingredient => {
      // Kiểm tra từ khóa tìm kiếm
      const matchesSearch = searchTerm === '' || 
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ingredient.category && ingredient.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Kiểm tra filter trạng thái
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'low' && parseFloat(ingredient.currentStock) < parseFloat(ingredient.minStockLevel)) ||
        (statusFilter === 'normal' && parseFloat(ingredient.currentStock) >= parseFloat(ingredient.minStockLevel));
      
      return matchesSearch && matchesStatus;
    });
  }, [ingredients, searchTerm, statusFilter]);

  // Filter purchase orders based on search term
  const filteredOrders = purchaseOrders.filter(order => 
    order.id?.toString().includes(searchTerm.toLowerCase()) ||
    order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'shipping': return 'primary';
      case 'delivered': return 'info';
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
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  // Render ingredients table
  const renderIngredientsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên nguyên liệu</TableCell>
            <TableCell>Danh mục</TableCell>
            <TableCell>Đơn vị</TableCell>
            <TableCell align="right">Số lượng hiện tại</TableCell>
            <TableCell align="right">Ngưỡng cảnh báo</TableCell>
            <TableCell align="right">Giá (VNĐ)</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredIngredients.length > 0 ? (
            filteredIngredients.map((ingredient) => {
              console.log("Hiển thị nguyên liệu:", ingredient);
              
              return (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {ingredient.imageUrl || ingredient.image ? (
                        <Avatar 
                          src={ingredient.imageUrl || ingredient.image} 
                          alt={ingredient.name}
                          sx={{ width: 40, height: 40, mr: 2 }}
                          variant="rounded"
                        />
                      ) : (
                        <Avatar 
                          sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.light' }}
                          variant="rounded"
                        >
                          {ingredient.name.charAt(0)}
                        </Avatar>
                      )}
                      {ingredient.name}
                    </Box>
                  </TableCell>
                  <TableCell>{ingredient.category}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell align="right">
                    {ingredient.currentStock} {ingredient.unit}
                    {parseFloat(ingredient.currentStock) < parseFloat(ingredient.minStockLevel) && (
                      <Tooltip title="Số lượng thấp hơn ngưỡng cảnh báo">
                        <Warning color="error" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">{ingredient.minStockLevel} {ingredient.unit}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('vi-VN').format(ingredient.costPerUnit || 0)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Tăng số lượng">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenAdjustDialog(ingredient, 'increase')}
                        size="small"
                      >
                        <AddCircleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Giảm số lượng">
                      <IconButton 
                        color="secondary" 
                        onClick={() => handleOpenAdjustDialog(ingredient, 'decrease')}
                        size="small"
                      >
                        <RemoveCircleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xem lịch sử">
                      <IconButton 
                        color="info" 
                        onClick={() => navigate(`/kitchen/inventory/${ingredient.id}/history`)}
                        size="small"
                      >
                        <History fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy nguyên liệu nào'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render purchase orders table
  const renderPurchaseOrdersTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Ngày tạo</TableCell>
            <TableCell>Ngày giao dự kiến</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Ghi chú</TableCell>
            <TableCell>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {              
              return (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.expectedDeliveryDate), 'dd/MM/yyyy', { locale: vi })}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(order.status)} 
                      color={getStatusColor(order.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{order.notes || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Xem chi tiết">
                      <IconButton 
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/kitchen/purchase-orders/${order.id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {searchTerm ? 'Không tìm thấy đơn đặt hàng phù hợp' : 'Chưa có đơn đặt hàng nào'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render purchase order form dialog
  const renderOrderFormDialog = () => (
    <>
      <DialogTitle sx={{ 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
        pb: 2,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mt: 2
      }}>
        <Receipt fontSize="small" color="primary" />
        Tạo đơn đặt hàng mới
      </DialogTitle>
      <DialogContent sx={{ pt: 3, px: 3 }} style={{marginTop: '100px'}}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Nhà cung cấp"
              name="supplierId"
              value={orderForm.supplierId}
              onChange={handleOrderFormChange}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalShipping fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">-- Chọn nhà cung cấp --</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ngày giao hàng dự kiến"
              type="date"
              name="expectedDeliveryDate"
              value={orderForm.expectedDeliveryDate}
              onChange={handleOrderFormChange}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DateRange fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
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
              variant="outlined"
              placeholder="Thêm ghi chú về đơn đặt hàng này (nếu có)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Info fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2,
              mt: 1,
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              pb: 1
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory fontSize="small" color="primary" />
                Danh sách nguyên liệu
              </Typography>
              <Button 
                startIcon={<Add />} 
                onClick={handleAddOrderItem}
                variant="outlined"
                size="small"
                color="primary"
              >
                Thêm nguyên liệu
              </Button>
            </Box>
            {orderForm.items.map((item, index) => (
              <Paper 
                key={index} 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  border: '1px solid rgba(0, 0, 0, 0.12)', 
                  borderRadius: 2,
                  backgroundColor: 'background.default'
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Nguyên liệu"
                      value={item.ingredientId}
                      onChange={(e) => handleOrderItemChange(index, 'ingredientId', e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Inventory fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">-- Chọn nguyên liệu --</MenuItem>
                      {ingredients.map((ing) => (
                        <MenuItem key={ing.id} value={ing.id}>
                          {ing.name} - {ing.unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={10} md={5}>
                    <TextField
                      type="number"
                      label="Số lượng"
                      fullWidth
                      value={item.quantity}
                      onChange={(e) => handleOrderItemChange(index, 'quantity', e.target.value)}
                      InputProps={{
                        inputProps: { min: 0.1, step: 0.1 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <TrendingUp fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={2} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                    {index > 0 && (
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveOrderItem(index)}
                        size="small"
                        sx={{ 
                          border: '1px solid rgba(211, 47, 47, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.04)'
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))}
            {orderForm.items.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body2">Chưa có nguyên liệu nào được thêm vào đơn hàng</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button 
          onClick={handleCloseDialog}
          variant="outlined"
          startIcon={<Cancel />}
        >
          Hủy
        </Button>
        <Button 
          onClick={handleSavePurchaseOrder} 
          variant="contained" 
          color="primary"
          disabled={!orderForm.supplierId || !orderForm.expectedDeliveryDate || orderForm.items.some(item => !item.ingredientId)}
          startIcon={<CheckCircle />}
        >
          Tạo đơn đặt hàng
        </Button>
      </DialogActions>
    </>
  );

  // Render adjustment dialog
  const renderAdjustmentDialog = () => {
    if (!currentItem) return null;
    
    return (
      <>
        <DialogTitle>
          Điều chỉnh số lượng: {currentItem.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                <Button 
                  variant={adjustmentForm.type === 'increase' ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => handleAdjustmentTypeChange('increase')}
                  startIcon={<AddCircleOutline />}
                >
                  Tăng
                </Button>
                <Button 
                  variant={adjustmentForm.type === 'decrease' ? 'contained' : 'outlined'}
                  color="secondary"
                  onClick={() => handleAdjustmentTypeChange('decrease')}
                  startIcon={<RemoveCircleOutline />}
                >
                  Giảm
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`Số lượng ${adjustmentForm.type === 'increase' ? 'tăng' : 'giảm'}`}
                name="quantity"
                type="number"
                value={adjustmentForm.quantity}
                onChange={handleAdjustmentFormChange}
                InputProps={{
                  inputProps: { min: 0.01, step: 0.01 },
                  endAdornment: <InputAdornment position="end">{currentItem.unit}</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lý do điều chỉnh"
                name="reason"
                value={adjustmentForm.reason}
                onChange={handleAdjustmentFormChange}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Số lượng hiện tại: {currentItem.currentStock} {currentItem.unit}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Số lượng sau điều chỉnh: {' '}
                  <strong>
                    {adjustmentForm.type === 'increase' 
                      ? (parseFloat(currentItem.currentStock) + parseFloat(adjustmentForm.quantity || 0)).toFixed(2)
                      : (parseFloat(currentItem.currentStock) - parseFloat(adjustmentForm.quantity || 0)).toFixed(2)
                    } {currentItem.unit}
                  </strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdjustDialog}>Hủy</Button>
          <Button 
            onClick={handleSaveAdjustment} 
            variant="contained" 
            color="primary"
            disabled={!adjustmentForm.quantity || !adjustmentForm.reason}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý kho - Bếp
        </Typography>
        <Box>
          {tabValue === 1 && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />}
              onClick={handleOpenDialog}
            >
              Tạo đơn đặt hàng
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Nguyên liệu" icon={<Inventory />} iconPosition="start" />
          <Tab label="Đơn đặt hàng" icon={<Receipt />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Thẻ tổng quan */}
      {tabValue === 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng số nguyên liệu
                </Typography>
                <Typography variant="h4">
                  {ingredients.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Nguyên liệu sắp hết
                </Typography>
                <Typography variant="h4" color="error.main">
                  {ingredients.filter(ing => parseFloat(ing.currentStock) < parseFloat(ing.minStockLevel)).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Số danh mục
                </Typography>
                <Typography variant="h4">
                  {[...new Set(ingredients.map(item => item.category))].filter(Boolean).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Nhà cung cấp
                </Typography>
                <Typography variant="h4">
                  {suppliers.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Low stock warning */}
      {tabValue === 0 && filteredIngredients.some(ing => parseFloat(ing.currentStock) < parseFloat(ing.minStockLevel)) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Có {filteredIngredients.filter(ing => parseFloat(ing.currentStock) < parseFloat(ing.minStockLevel)).length} nguyên liệu dưới ngưỡng cảnh báo cần được đặt thêm.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '70%' }}>
            <TextField
              placeholder={tabValue === 0 ? "Tìm nguyên liệu..." : "Tìm đơn đặt hàng..."}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            {tabValue === 0 && (
              <TextField
                select
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="low">Dưới ngưỡng</MenuItem>
                <MenuItem value="normal">Bình thường</MenuItem>
              </TextField>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
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
          <>
            {tabValue === 0 && renderIngredientsTable()}
            {tabValue === 1 && renderPurchaseOrdersTable()}
          </>
        )}
      </Paper>

      {/* Create Purchase Order Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            pt: 2,
            pb: 2,
            overflowY: 'auto'
          }
        }}
      >
        {renderOrderFormDialog()}
      </Dialog>

      {/* Adjust Quantity Dialog */}
      <Dialog open={adjustDialog} onClose={handleCloseAdjustDialog} maxWidth="sm" fullWidth>
        {renderAdjustmentDialog()}
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

// Make sure to export the component
export default InventoryPage;
