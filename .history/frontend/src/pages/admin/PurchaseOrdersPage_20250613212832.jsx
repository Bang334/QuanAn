import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Button, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, Divider, Card, CardContent,
  FormControlLabel, Switch, InputAdornment, Tabs, Tab, Avatar
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, Search, CheckCircle, 
  Cancel, Visibility, Receipt, LocalShipping, Send, Close
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
        
        console.log("Purchase Orders from API:", ordersData);
        console.log("Suppliers from API:", suppliersData);
        
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
      setLoading(true);
      const orderDetails = await inventoryService.getPurchaseOrderById(orderId);
      console.log('Đơn hàng chi tiết:', orderDetails);
      
      // Lấy thông tin nhà cung cấp nếu không có trong orderDetails
      if (!orderDetails.supplier || !orderDetails.supplier.name) {
        try {
          const supplierData = await inventoryService.getSupplierById(orderDetails.supplierId);
          if (supplierData) {
            orderDetails.supplier = supplierData;
          }
        } catch (supplierError) {
          console.error('Lỗi khi lấy thông tin nhà cung cấp:', supplierError);
        }
      }
      
      // Nếu không có items trong orderDetails hoặc items là mảng trống
      if (!orderDetails.PurchaseOrderItems || orderDetails.PurchaseOrderItems.length === 0) {
        console.warn('Không tìm thấy danh sách nguyên liệu trong đơn hàng, thử lấy qua API riêng');
        
        try {
          const items = await inventoryService.getPurchaseOrderItems(orderId);
          if (items && items.length > 0) {
            orderDetails.items = items;
            
            // Kiểm tra và bổ sung thông tin nguyên liệu nếu cần
            for (let i = 0; i < orderDetails.items.length; i++) {
              console.log(`Item ${i}:`, orderDetails.items[i]);
              if (!orderDetails.items[i].ingredient || !orderDetails.items[i].ingredient.unit) {
                console.warn(`Thiếu thông tin ingredient hoặc unit cho mục ${i}, ingredientId=${orderDetails.items[i].ingredientId}`);
                
                // Lấy thông tin nguyên liệu đầy đủ nếu thiếu
                try {
                  const ingredientId = orderDetails.items[i].ingredientId;
                  if (ingredientId) {
                    const ingredientData = await inventoryService.getIngredientById(ingredientId);
                    if (ingredientData) {
                      orderDetails.items[i].ingredient = ingredientData;
                      console.log(`Đã bổ sung thông tin cho nguyên liệu ${ingredientId}:`, ingredientData);
                    }
                  }
                } catch (ingredientError) {
                  console.error(`Lỗi khi lấy thông tin nguyên liệu ${orderDetails.items[i].ingredientId}:`, ingredientError);
                }
              }
            }
          }
        } catch (itemError) {
          console.error('Lỗi khi lấy danh sách nguyên liệu:', itemError);
        }
      } else {
        // Nếu có PurchaseOrderItems thì gán vào items để thống nhất cách truy cập
        orderDetails.items = orderDetails.PurchaseOrderItems;
        
        // Kiểm tra và bổ sung thông tin nguyên liệu nếu cần
        for (let i = 0; i < orderDetails.items.length; i++) {
          console.log(`PurchaseOrderItem ${i}:`, orderDetails.items[i]);
          
          // Kiểm tra nếu thiếu thông tin nguyên liệu hoặc thiếu hình ảnh
          if (!orderDetails.items[i].ingredient || 
              !orderDetails.items[i].ingredient.unit || 
              (!orderDetails.items[i].ingredient.image && !orderDetails.items[i].ingredient.imageUrl)) {
            
            console.warn(`Thiếu thông tin hoặc hình ảnh cho nguyên liệu ${i}, ingredientId=${orderDetails.items[i].ingredientId}`);
            
            // Lấy thông tin nguyên liệu đầy đủ
            try {
              const ingredientId = orderDetails.items[i].ingredientId;
              if (ingredientId) {
                const ingredientData = await inventoryService.getIngredientById(ingredientId);
                if (ingredientData) {
                  // Cập nhật thông tin nguyên liệu với dữ liệu đầy đủ
                  orderDetails.items[i].ingredient = ingredientData;
                  console.log(`Đã bổ sung thông tin cho nguyên liệu ${ingredientId}:`, ingredientData);
                }
              }
            } catch (ingredientError) {
              console.error(`Lỗi khi lấy thông tin nguyên liệu ${orderDetails.items[i].ingredientId}:`, ingredientError);
            }
          }
        }
      }
      
      setCurrentOrder(orderDetails);
      setStatusForm({
        status: orderDetails.status,
        adminNotes: orderDetails.notes || ''
      });
      setViewOrderDialog(true);
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng', 'error');
    } finally {
      setLoading(false);
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
          unitPrice: selectedIngredient.costPerUnit || 0
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
      items: [...orderForm.items, { ingredientId: '', quantity: '', unitPrice: 0 }]
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
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return total + (quantity * unitPrice);
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

  // Handle approve order directly from the table
  const handleApproveOrder = async (orderId) => {
    try {
      await inventoryService.updatePurchaseOrderStatus(orderId, {
        status: 'approved',
        adminNotes: 'Đã duyệt đơn hàng từ danh sách'
      });
      
      showSnackbar('Đơn đặt hàng đã được duyệt thành công');
      
      // Refresh purchase orders list
      const updatedOrders = await inventoryService.getAllPurchaseOrders();
      setPurchaseOrders(updatedOrders);
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi duyệt đơn hàng', 'error');
    }
  };

  // Filtered orders based on tab and search
  const filteredOrders = purchaseOrders.filter(order => {
    // Filter by tab value
    if (tabValue === 1 && order.status !== 'pending') return false;
    if (tabValue === 2 && order.status !== 'approved') return false;
    if (tabValue === 3 && order.status !== 'delivered') return false;
    if (tabValue === 4 && order.status !== 'completed') return false;
    if (tabValue === 5 && order.status !== 'cancelled') return false;
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (order.id?.toString().includes(search)) ||
        (order.supplier?.name?.toLowerCase().includes(search)) ||
        (order.requester?.name?.toLowerCase().includes(search))
      );
    }
    
    return true;
  });

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'delivered': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'delivered': return 'Đã giao hàng';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ duyệt';
    }
  };

  // Render purchase order form dialog
  const renderOrderFormDialog = () => (
    <>
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        borderRadius: '4px 4px 0 0'
      }}>
        Tạo đơn đặt hàng mới
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                    Thông tin đơn hàng
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell 
                    sx={{ 
                      width: '30%', 
                      fontWeight: 'medium',
                      borderLeft: '4px solid #bbdefb',
                      backgroundColor: '#f5f9ff'
                    }}
                  >
                    Nhà cung cấp
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth required variant="standard">
                      <Select
                        name="supplierId"
                        value={orderForm.supplierId}
                        onChange={handleOrderFormChange}
                        placeholder="Chọn nhà cung cấp"
                      >
                        {suppliers.map((supplier) => (
                          <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      width: '30%', 
                      fontWeight: 'medium',
                      borderLeft: '4px solid #bbdefb',
                      backgroundColor: '#f5f9ff'
                    }}
                  >
                    Ngày giao hàng dự kiến
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      name="expectedDeliveryDate"
                      type="date"
                      value={orderForm.expectedDeliveryDate}
                      onChange={handleOrderFormChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      variant="standard"
                      placeholder="Chọn ngày giao hàng"
                    />
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell 
                    sx={{ 
                      width: '30%', 
                      fontWeight: 'medium',
                      borderLeft: '4px solid #bbdefb',
                      backgroundColor: '#f5f9ff'
                    }}
                  >
                    Ghi chú
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      name="notes"
                      value={orderForm.notes}
                      onChange={handleOrderFormChange}
                      multiline
                      rows={2}
                      variant="standard"
                      placeholder="Thêm ghi chú về đơn đặt hàng (nếu có)"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>
                    Danh sách nguyên liệu
                  </TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: '#f5f9ff' }}>
                  <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>Nguyên liệu</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', width: '25%' }}>Số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', width: '25%' }}>Đơn giá</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', width: '10%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderForm.items.map((item, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                    <TableCell>
                      <FormControl fullWidth required variant="standard">
                        <Select
                          value={item.ingredientId}
                          onChange={(e) => handleOrderItemChange(index, 'ingredientId', e.target.value)}
                          placeholder="Chọn nguyên liệu"
                          renderValue={(selected) => {
                            const ingredient = ingredients.find(ing => ing.id === parseInt(selected));
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {ingredient && (ingredient.imageUrl || ingredient.image) ? (
                                  <Avatar 
                                    src={ingredient.imageUrl || ingredient.image} 
                                    alt={ingredient.name}
                                    sx={{ width: 24, height: 24 }}
                                    variant="rounded"
                                  />
                                ) : (
                                  <Avatar 
                                    sx={{ width: 24, height: 24, bgcolor: 'primary.light', fontSize: '0.8rem' }}
                                    variant="rounded"
                                  >
                                    {ingredient ? ingredient.name.charAt(0) : '?'}
                                  </Avatar>
                                )}
                                {ingredient ? `${ingredient.name} (${ingredient.unit})` : ''}
                              </Box>
                            );
                          }}
                        >
                          {ingredients.map((ingredient) => (
                            <MenuItem key={ingredient.id} value={ingredient.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {(ingredient.imageUrl || ingredient.image) ? (
                                  <Avatar 
                                    src={ingredient.imageUrl || ingredient.image} 
                                    alt={ingredient.name}
                                    sx={{ width: 32, height: 32 }}
                                    variant="rounded"
                                  />
                                ) : (
                                  <Avatar 
                                    sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}
                                    variant="rounded"
                                  >
                                    {ingredient.name.charAt(0)}
                                  </Avatar>
                                )}
                                <Typography>{ingredient.name} ({ingredient.unit})</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleOrderItemChange(index, 'quantity', e.target.value)}
                        InputProps={{
                          inputProps: { min: 0.01, step: 0.01 }
                        }}
                        required
                        variant="standard"
                        placeholder="Nhập số lượng"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleOrderItemChange(index, 'unitPrice', e.target.value)}
                        InputProps={{
                          inputProps: { min: 0, step: 1000, readOnly: true },
                          startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                        }}
                        required
                        variant="standard"
                        placeholder="Đơn giá tự động"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveOrderItem(index)}
                        disabled={orderForm.items.length <= 1}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddOrderItem}
              sx={{ 
                borderRadius: '20px',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              Thêm nguyên liệu
            </Button>
            
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Tổng tiền: {calculateTotalAmount().toLocaleString('vi-VN')}₫
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #e0e0e0',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        padding: '16px 24px',
        borderRadius: '0 0 4px 4px'
      }}>
        <Button 
          onClick={handleCloseDialog}
          sx={{ 
            borderRadius: '20px',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          Hủy
        </Button>
        <Button 
          onClick={handleSavePurchaseOrder} 
          variant="contained" 
          color="primary"
          disabled={
            !orderForm.supplierId || 
            !orderForm.expectedDeliveryDate || 
            orderForm.items.some(item => !item.ingredientId || item.quantity <= 0 || item.unitPrice <= 0)
          }
          sx={{ 
            borderRadius: '20px',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(25,118,210,0.3)'
            }
          }}
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
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          color: 'white',
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Chi tiết đơn đặt hàng #{currentOrder.id}</Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseViewOrderDialog}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ maxWidth: '100%', width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ width: '100%' }}>
              {/* Hàng 1: Thông tin cơ bản và Thông tin thanh toán - chiếm full width */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      {/* Cột 1: Trạng thái và ngày tháng */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Thông tin cơ bản
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Trạng thái đơn hàng
                          </Typography>
                          <Chip 
                            label={getStatusText(currentOrder.status)} 
                            color={getStatusColor(currentOrder.status)} 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Ngày tạo đơn
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {currentOrder.createdAt 
                              ? format(new Date(currentOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : currentOrder.orderDate 
                                ? format(new Date(currentOrder.orderDate), 'dd/MM/yyyy HH:mm', { locale: vi })
                                : 'Không có thông tin'
                            }
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Ngày giao dự kiến
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {currentOrder.expectedDeliveryDate 
                              ? format(new Date(currentOrder.expectedDeliveryDate), 'dd/MM/yyyy', { locale: vi })
                              : 'Không có thông tin'
                            }
                          </Typography>
                        </Box>
                        
                        {currentOrder.actualDeliveryDate && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Ngày giao thực tế
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {format(new Date(currentOrder.actualDeliveryDate), 'dd/MM/yyyy', { locale: vi })}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      
                      {/* Cột 2: Thông tin nhà cung cấp */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Thông tin nhà cung cấp
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Tên nhà cung cấp
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                            {currentOrder.supplier?.name || 'Không có thông tin'}
                          </Typography>
                        </Box>
                        
                        {currentOrder.supplier && (
                          <>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Người liên hệ
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {currentOrder.supplier.contactPerson || 'Không có thông tin'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Điện thoại
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {currentOrder.supplier.phone || 'Không có thông tin'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Email
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {currentOrder.supplier.email || 'Không có thông tin'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Địa chỉ
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {currentOrder.supplier.address || 'Không có thông tin'}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Grid>
                      
                      {/* Cột 3: Thông tin thanh toán */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Thông tin thanh toán
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Tổng tiền
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold', mt: 0.5 }}>
                            {currentOrder.totalAmount?.toLocaleString('vi-VN')}₫
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Trạng thái thanh toán
                          </Typography>
                          <Chip 
                            label={
                              currentOrder.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'
                            } 
                            color={
                              currentOrder.status === 'completed' ? 'success' : 'error'
                            }
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        {currentOrder.paymentDate && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Ngày thanh toán
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {format(new Date(currentOrder.paymentDate), 'dd/MM/yyyy', { locale: vi })}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Hàng 2: Thông tin người tham gia và ghi chú */}
              <Grid container item spacing={2} xs={12}>
                {/* Thông tin người tham gia */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Thông tin người tham gia
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Người yêu cầu
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                          {currentOrder.requester?.name || currentOrder.requester?.username || 'Không có thông tin'}
                        </Typography>
                        {currentOrder.requester?.role && (
                          <Chip 
                            label={currentOrder.requester.role === 'admin' ? 'Quản trị viên' : 'Nhân viên bếp'} 
                            size="small" 
                            color={currentOrder.requester.role === 'admin' ? 'primary' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                      
                      {currentOrder.status !== 'pending' && currentOrder.approver && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Người phê duyệt
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                            {currentOrder.approver?.name || currentOrder.approver?.username || 'Không có thông tin'}
                          </Typography>
                          {currentOrder.approver?.role && (
                            <Chip 
                              label={currentOrder.approver.role === 'admin' ? 'Quản trị viên' : 'Nhân viên bếp'} 
                              size="small" 
                              color={currentOrder.approver.role === 'admin' ? 'primary' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Ghi chú */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Ghi chú
                      </Typography>
                      
                      {currentOrder.notes ? (
                        <Box sx={{ mb: currentOrder.rejectReason ? 2 : 0 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Ghi chú đơn hàng
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {currentOrder.notes}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Không có ghi chú
                        </Typography>
                      )}
                      
                      {currentOrder.rejectReason && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Lý do từ chối
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5, color: 'error.main' }}>
                            {currentOrder.rejectReason}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Danh sách nguyên liệu */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Danh sách nguyên liệu
                    </Typography>
                    
                    {currentOrder.items && currentOrder.items.length > 0 ? (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell width="40%">Nguyên liệu</TableCell>
                              <TableCell align="center" width="15%">Số lượng</TableCell>
                              <TableCell align="center" width="15%">Đơn vị</TableCell>
                              <TableCell align="right" width="15%">Đơn giá</TableCell>
                              <TableCell align="right" width="15%">Thành tiền</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentOrder.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {item.ingredient?.image || item.ingredient?.imageUrl ? (
                                      <Box 
                                        component="img" 
                                        src={item.ingredient.image || item.ingredient.imageUrl} 
                                        alt={item.ingredient?.name} 
                                        sx={{ width: 40, height: 40, mr: 1.5, borderRadius: '4px', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <Box 
                                        sx={{ 
                                          width: 40, 
                                          height: 40, 
                                          mr: 1.5, 
                                          borderRadius: '4px', 
                                          bgcolor: 'primary.light',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: 'white',
                                          fontSize: '16px',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {(item.ingredient?.name || item.notes || 'N/A').charAt(0)}
                                      </Box>
                                    )}
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                      {item.ingredient?.name || item.notes || 'Không có thông tin'}
                                      {!item.ingredient?.name && item.notes && (
                                        <Typography variant="caption" display="block" color="text.secondary">
                                          {item.notes}
                                        </Typography>
                                      )}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  {parseFloat(item.quantity).toLocaleString('vi-VN')}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={
                                      item.ingredient?.unit || 
                                      item.Ingredient?.unit || 
                                      (item.ingredientId ? 'kg' : '-')
                                    }
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {parseFloat(item.unitPrice).toLocaleString('vi-VN')}₫
                                </TableCell>
                                <TableCell align="right">
                                  {(parseFloat(item.quantity) * parseFloat(item.unitPrice)).toLocaleString('vi-VN')}₫
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} />
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                Tổng cộng:
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                {parseFloat(currentOrder.totalAmount).toLocaleString('vi-VN')}₫
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Không có dữ liệu nguyên liệu cho đơn hàng này
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Form cập nhật trạng thái */}
              {(currentOrder.status === 'pending' || currentOrder.status === 'approved') && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                      p: 2
                    }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {currentOrder.status === 'pending' ? 'Duyệt đơn hàng' : 'Cập nhật trạng thái'}
                      </Typography>
                    </Box>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ 
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                          }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                              Thông tin cập nhật
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                            <TableCell 
                              sx={{ 
                                width: '30%', 
                                fontWeight: 'medium',
                                borderLeft: '4px solid #bbdefb',
                                backgroundColor: '#f5f9ff'
                              }}
                            >
                              Trạng thái
                            </TableCell>
                            <TableCell>
                              <FormControl fullWidth required variant="standard">
                                <Select
                                  name="status"
                                  value={statusForm.status}
                                  onChange={handleStatusFormChange}
                                  placeholder="Chọn trạng thái"
                                >
                                  {currentOrder.status === 'pending' ? [
                                    <MenuItem key="pending" value="pending">Chờ duyệt</MenuItem>,
                                    <MenuItem key="approved" value="approved">Duyệt đơn</MenuItem>,
                                    <MenuItem key="cancelled" value="cancelled">Hủy đơn</MenuItem>
                                  ] : currentOrder.status === 'approved' ? [
                                    <MenuItem key="approved" value="approved">Đã duyệt</MenuItem>,
                                    <MenuItem key="delivered" value="delivered">Đã giao hàng</MenuItem>,
                                    <MenuItem key="cancelled" value="cancelled">Hủy đơn</MenuItem>
                                  ] : [
                                    <MenuItem key="pending" value="pending">Chờ duyệt</MenuItem>,
                                    <MenuItem key="approved" value="approved">Đã duyệt</MenuItem>,
                                    <MenuItem key="delivered" value="delivered">Đã giao hàng</MenuItem>,
                                    <MenuItem key="cancelled" value="cancelled">Đã hủy</MenuItem>
                                  ]}
                                </Select>
                              </FormControl>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell 
                              sx={{ 
                                width: '30%', 
                                fontWeight: 'medium',
                                borderLeft: '4px solid #bbdefb',
                                backgroundColor: '#f5f9ff'
                              }}
                            >
                              Ghi chú của Admin
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                name="adminNotes"
                                value={statusForm.adminNotes}
                                onChange={handleStatusFormChange}
                                multiline
                                rows={2}
                                variant="standard"
                                placeholder="Nhập ghi chú về việc cập nhật trạng thái (nếu có)"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      p: 2,
                      background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                    }}>
                      <Button 
                        onClick={handleUpdateStatus} 
                        variant="contained" 
                        color="primary"
                        startIcon={statusForm.status === 'approved' ? <CheckCircle /> : <Send />}
                        sx={{ 
                          borderRadius: '20px',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(25,118,210,0.3)'
                          }
                        }}
                      >
                        {statusForm.status === 'approved' && currentOrder.status === 'pending' 
                          ? 'Duyệt đơn hàng' 
                          : statusForm.status === 'cancelled' 
                            ? 'Hủy đơn hàng'
                            : 'Cập nhật trạng thái'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
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
            filteredOrders.map((order) => {
              // Find supplier from suppliers array if not included in order
              let supplierName = order.supplier?.name;
              if (!supplierName && order.supplierId) {
                const supplier = suppliers.find(s => s.id === order.supplierId);
                supplierName = supplier?.name;
              }
              
              return (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{supplierName || 'Không có thông tin'}</TableCell>
                  <TableCell>{order.requester?.name || 'Không có thông tin'}</TableCell>
                  <TableCell>
                    {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi }) : 
                    order.orderDate ? format(new Date(order.orderDate), 'dd/MM/yyyy', { locale: vi }) : 'Không có thông tin'}
                  </TableCell>
                  <TableCell>
                    {order.expectedDeliveryDate ? format(new Date(order.expectedDeliveryDate), 'dd/MM/yyyy', { locale: vi }) : 'Không có thông tin'}
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
                      title="Xem chi tiết"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    
                    {order.status === 'pending' && [
                        <IconButton 
                          key="approve"
                          color="primary" 
                          onClick={() => handleApproveOrder(order.id)}
                          size="small"
                          title="Duyệt đơn"
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>,
                        <IconButton 
                          key="delete"
                          color="secondary" 
                          onClick={() => handleDeleteOrder(order.id)}
                          size="small"
                          title="Xóa đơn"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                    ]}
                  </TableCell>
                </TableRow>
              );
            })
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
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="Tất cả" />
          <Tab label="Chờ duyệt" />
          <Tab label="Đã duyệt" />
          <Tab label="Đã giao hàng" />
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
