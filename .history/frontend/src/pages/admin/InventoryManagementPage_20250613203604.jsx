import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Tabs, Tab, Button, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, InputAdornment, MenuItem,
  CircularProgress, Tooltip, FormControl, InputLabel, Select,
  Avatar, Card, CardContent, FormControlLabel, Switch
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, Search, Warning, 
  History, TrendingUp, Inventory, Receipt, FileDownload, FilterList, Category,
  Visibility, Star
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as inventoryService from '../../services/inventoryService';
import axios from 'axios';
import { API_URL } from '../../config';

const API_ENDPOINT = `${API_URL}/api`;

const InventoryManagementPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Ingredient form state
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'kg',
    currentStock: 0,
    minStockLevel: 0,
    costPerUnit: 0,
    imageUrl: '',
    supplierId: '',
  });

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '',
    notes: '',
    rating: 0,
    isActive: true
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Luôn lấy danh sách danh mục để hiển thị số lượng danh mục từ đầu
        const categoriesData = await inventoryService.getAllCategories();
        setCategories(categoriesData);

        // Always fetch suppliers for the ingredient form dropdown
        const suppliersData = await inventoryService.getAllSuppliers();
        setSuppliers(suppliersData);

        if (tabValue === 0) {
          const ingredientsData = await inventoryService.getAllIngredients();
          console.log("Admin - Fetched ingredients data:", ingredientsData);
          setIngredients(ingredientsData);
        }
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
        showSnackbar('Có lỗi xảy ra khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tabValue]);

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

  // Open dialog to add/edit item
  const handleOpenDialog = (item = null, isIngredient = true) => {
    if (item) {
      if (isIngredient) {
        setIngredientForm({
          name: item.name,
          description: item.description || '',
          category: item.category || '',
          unit: item.unit,
          currentStock: item.currentStock,
          minStockLevel: item.minStockLevel,
          costPerUnit: item.costPerUnit || 0,
          imageUrl: item.imageUrl || item.image || '',
          supplierId: item.supplierId || '',
        });
      } else {
        setSupplierForm({
          name: item.name,
          contactPerson: item.contactPerson || '',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || '',
          paymentTerms: item.paymentTerms || '',
          notes: item.notes || '',
          rating: item.rating || 0,
          isActive: item.isActive
        });
      }
    } else {
      if (isIngredient) {
        setIngredientForm({
          name: '',
          description: '',
          category: '',
          unit: 'kg',
          currentStock: 0,
          minStockLevel: 0,
          costPerUnit: 0,
          imageUrl: '',
          supplierId: '',
        });
      } else {
        setSupplierForm({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          paymentTerms: '',
          notes: '',
          rating: 0,
          isActive: true
        });
      }
    }
    setCurrentItem(item);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentItem(null);
  };

  // Handle ingredient form change
  const handleIngredientFormChange = (e) => {
    const { name, value } = e.target;
    setIngredientForm({
      ...ingredientForm,
      [name]: name === 'currentStock' || name === 'minStockLevel' || name === 'costPerUnit' 
        ? parseFloat(value) 
        : value
    });
  };

  // Handle supplier form change
  const handleSupplierFormChange = (e) => {
    const { name, value } = e.target;
    setSupplierForm({
      ...supplierForm,
      [name]: value
    });
  };

  // Save ingredient
  const handleSaveIngredient = async () => {
    try {
      if (currentItem) {
        await inventoryService.updateIngredient(currentItem.id, ingredientForm);
        showSnackbar('Nguyên liệu đã được cập nhật thành công');
      } else {
        await inventoryService.createIngredient(ingredientForm);
        showSnackbar('Nguyên liệu đã được thêm thành công');
      }
      
      // Refresh ingredients list
      const updatedIngredients = await inventoryService.getAllIngredients();
      setIngredients(updatedIngredients);
      
      handleCloseDialog();
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi lưu nguyên liệu', 'error');
    }
  };

  // Save supplier
  const handleSaveSupplier = async () => {
    try {
      const supplierData = {
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        phone: supplierForm.phone,
        email: supplierForm.email,
        address: supplierForm.address,
        paymentTerms: supplierForm.paymentTerms,
        notes: supplierForm.notes,
        rating: supplierForm.rating,
        isActive: supplierForm.isActive
      };

      if (currentItem) {
        await inventoryService.updateSupplier(currentItem.id, supplierData);
        showSnackbar('Nhà cung cấp đã được cập nhật thành công');
      } else {
        await inventoryService.createSupplier(supplierData);
        showSnackbar('Nhà cung cấp đã được thêm thành công');
      }
      
      // Refresh suppliers list
      const suppliersData = await inventoryService.getAllSuppliers();
      setSuppliers(suppliersData);
      
      handleCloseDialog();
    } catch (err) {
      showSnackbar(err.message || 'Có lỗi xảy ra khi lưu nhà cung cấp', 'error');
    }
  };

  // Delete ingredient
  const handleDeleteIngredient = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) {
      try {
        await inventoryService.deleteIngredient(id);
        showSnackbar('Nguyên liệu đã được xóa thành công');
        
        // Refresh ingredients list
        const updatedIngredients = await inventoryService.getAllIngredients();
        setIngredients(updatedIngredients);
      } catch (err) {
        showSnackbar(err.message || 'Có lỗi xảy ra khi xóa nguyên liệu', 'error');
      }
    }
  };

  // Delete supplier
  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      try {
        await inventoryService.deleteSupplier(id);
        showSnackbar('Nhà cung cấp đã được xóa thành công');
        
        // Refresh suppliers list
        const updatedSuppliers = await inventoryService.getAllSuppliers();
        setSuppliers(updatedSuppliers);
      } catch (err) {
        showSnackbar(err.message || 'Có lỗi xảy ra khi xóa nhà cung cấp', 'error');
      }
    }
  };

  // Filter ingredients based on search term and category
  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (ingredient.category && categories.find(c => c.id === parseInt(selectedCategory))?.name === ingredient.category);
    return matchesSearch && matchesCategory;
  });

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render inventory overview cards
  const renderInventoryOverview = () => {
    // Calculate statistics
    const totalIngredients = ingredients.length;
    const lowStockCount = ingredients.filter(i => parseFloat(i.currentStock) <= parseFloat(i.minStockLevel)).length;
    const totalValue = ingredients.reduce((sum, i) => sum + (parseFloat(i.currentStock) * parseFloat(i.costPerUnit)), 0);
    const categoryDistribution = {};
    
    ingredients.forEach(ingredient => {
      const categoryId = ingredient.categoryId || 'uncategorized';
      if (!categoryDistribution[categoryId]) {
        categoryDistribution[categoryId] = 0;
      }
      categoryDistribution[categoryId]++;
    });

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng số nguyên liệu
              </Typography>
              <Typography variant="h4">{totalIngredients}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Nguyên liệu sắp hết
              </Typography>
              <Typography variant="h4" color={lowStockCount > 0 ? "error" : "inherit"}>
                {lowStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng giá trị kho
              </Typography>
              <Typography variant="h4">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Số danh mục
              </Typography>
              <Typography variant="h4">{categories.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
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
            <TableCell align="right">Số lượng</TableCell>
            <TableCell align="right">Ngưỡng cảnh báo</TableCell>
            <TableCell align="right">Giá (VND)</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredIngredients.length > 0 ? (
            filteredIngredients.map((ingredient) => {
              const category = categories.find(c => c.name === ingredient.category);
              const isLowStock = parseFloat(ingredient.currentStock) <= parseFloat(ingredient.minStockLevel);
              
              console.log("Rendering ingredient:", ingredient);
              
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
                  <TableCell>{ingredient.category || '-'}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell align="right">
                    {ingredient.currentStock} {ingredient.unit}
                    {parseFloat(ingredient.currentStock) < parseFloat(ingredient.minStockLevel) && (
                      <Tooltip title="Số lượng thấp hơn ngưỡng cảnh báo">
                        <Warning color="warning" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">{ingredient.minStockLevel} {ingredient.unit}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('vi-VN').format(ingredient.costPerUnit || 0)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(ingredient, true)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xem lịch sử">
                      <IconButton 
                        color="info" 
                        size="small"
                        onClick={() => navigate(`/admin/inventory/${ingredient.id}/history`)}
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

  // Render categories management tab
  const renderCategoriesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Danh sách danh mục</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => {
            // Tạm thời chỉ thông báo vì chưa có API thêm danh mục
            showSnackbar('Tính năng thêm danh mục đang được phát triển', 'info');
          }}
        >
          Thêm danh mục
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tên danh mục</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Số lượng nguyên liệu</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((category) => {
                // Đếm số nguyên liệu thuộc danh mục này
                const ingredientCount = ingredients.filter(i => i.category === category.name).length;
                
                return (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>{ingredientCount}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem danh sách nguyên liệu">
                        <IconButton 
                          color="info" 
                          onClick={() => {
                            setTabValue(0);
                            setSelectedCategory(category.id.toString());
                          }}
                          size="small"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton 
                          color="primary" 
                          onClick={() => {
                            // Tạm thời chỉ thông báo
                            showSnackbar('Tính năng chỉnh sửa danh mục đang được phát triển', 'info');
                          }}
                          size="small"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {loading ? 'Đang tải dữ liệu...' : 'Không có danh mục nào'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Render suppliers management tab
  const renderSuppliersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Danh sách nhà cung cấp</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog(null, false)}
        >
          Thêm nhà cung cấp
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên nhà cung cấp</TableCell>
              <TableCell>Người liên hệ</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Điều khoản thanh toán</TableCell>
              <TableCell>Đánh giá</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson || supplier.contactName || '-'}</TableCell>
                  <TableCell>{supplier.email || supplier.contactEmail || '-'}</TableCell>
                  <TableCell>{supplier.phone || supplier.contactPhone || '-'}</TableCell>
                  <TableCell>{supplier.address || '-'}</TableCell>
                  <TableCell>{supplier.paymentTerms || '-'}</TableCell>
                  <TableCell>
                    {supplier.rating ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} style={{ color: index < supplier.rating ? '#FFB400' : '#C4C4C4' }}>★</span>
                        ))}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={supplier.isActive ? 'Đang hoạt động' : 'Không hoạt động'} 
                      color={supplier.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(supplier, false)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy nhà cung cấp nào'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Render ingredient form dialog
  const renderIngredientFormDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '4px 4px 0 0'
      }}>
        {currentItem ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <TableContainer component={Paper} sx={{ 
          mt: 0,
          boxShadow: 'none',
          '& .MuiTableRow-root:nth-of-type(odd)': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(45deg, #e3f2fd 30%, #bbdefb 90%)',
              }}>
                <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Trường thông tin</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá trị</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Tên nguyên liệu
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="name"
                    value={ingredientForm.name}
                    onChange={handleIngredientFormChange}
                    required
                    variant="standard"
                    placeholder="Nhập tên nguyên liệu"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Danh mục
                </TableCell>
                <TableCell>
                  <FormControl fullWidth variant="standard">
                    <Select
                      name="category"
                      value={ingredientForm.category || ''}
                      onChange={handleIngredientFormChange}
                      displayEmpty
                    >
                      <MenuItem value="">-- Chọn danh mục --</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Đơn vị
                </TableCell>
                <TableCell>
                  <FormControl fullWidth variant="standard">
                    <Select
                      name="unit"
                      value={ingredientForm.unit}
                      onChange={handleIngredientFormChange}
                    >
                      <MenuItem value="kg">Kilogram (kg)</MenuItem>
                      <MenuItem value="g">Gram (g)</MenuItem>
                      <MenuItem value="l">Lít (l)</MenuItem>
                      <MenuItem value="ml">Mililít (ml)</MenuItem>
                      <MenuItem value="cái">Cái</MenuItem>
                      <MenuItem value="hộp">Hộp</MenuItem>
                      <MenuItem value="chai">Chai</MenuItem>
                      <MenuItem value="gói">Gói</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Nhà cung cấp
                </TableCell>
                <TableCell>
                  <FormControl fullWidth variant="standard">
                    <Select
                      name="supplierId"
                      value={ingredientForm.supplierId}
                      onChange={handleIngredientFormChange}
                      displayEmpty
                    >
                      <MenuItem value="">-- Chọn nhà cung cấp --</MenuItem>
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
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Số lượng
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="currentStock"
                    type="number"
                    value={ingredientForm.currentStock}
                    onChange={handleIngredientFormChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{ingredientForm.unit}</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    required
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Ngưỡng cảnh báo
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="minStockLevel"
                    type="number"
                    value={ingredientForm.minStockLevel}
                    onChange={handleIngredientFormChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{ingredientForm.unit}</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    required
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Giá (VND)
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="costPerUnit"
                    type="number"
                    value={ingredientForm.costPerUnit}
                    onChange={handleIngredientFormChange}
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                    required
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  URL hình ảnh
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="imageUrl"
                    value={ingredientForm.imageUrl}
                    onChange={handleIngredientFormChange}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  Mô tả
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="description"
                    value={ingredientForm.description}
                    onChange={handleIngredientFormChange}
                    multiline
                    rows={3}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ 
        background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)',
        p: 2,
        borderTop: '1px solid #e0e0e0'
      }}>
        <Button 
          onClick={handleCloseDialog}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Hủy
        </Button>
        <Button 
          onClick={handleSaveIngredient} 
          variant="contained" 
          color="primary"
          disabled={!ingredientForm.name || ingredientForm.currentStock < 0}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render supplier form dialog
  const renderSupplierFormDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '4px 4px 0 0'
      }}>
        {currentItem ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <TableContainer component={Paper} sx={{ 
          mt: 0,
          boxShadow: 'none',
          '& .MuiTableRow-root:nth-of-type(odd)': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(45deg, #e8f5e9 30%, #c8e6c9 90%)',
              }}>
                <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Trường thông tin</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá trị</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Tên nhà cung cấp
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="name"
                    value={supplierForm.name}
                    onChange={handleSupplierFormChange}
                    required
                    variant="standard"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Người liên hệ
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="contactPerson"
                    value={supplierForm.contactPerson}
                    onChange={handleSupplierFormChange}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Email
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    value={supplierForm.email}
                    onChange={handleSupplierFormChange}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Số điện thoại
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="phone"
                    value={supplierForm.phone}
                    onChange={handleSupplierFormChange}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Địa chỉ
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="address"
                    value={supplierForm.address}
                    onChange={handleSupplierFormChange}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Điều khoản thanh toán
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="paymentTerms"
                    value={supplierForm.paymentTerms}
                    onChange={handleSupplierFormChange}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Đánh giá
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <IconButton 
                        key={index} 
                        onClick={() => setSupplierForm({...supplierForm, rating: index + 1})}
                        sx={{ 
                          p: 0.5, 
                          color: index < supplierForm.rating ? '#FFB400' : '#C4C4C4',
                          '&:hover': {
                            color: '#FFB400',
                            transform: 'scale(1.2)'
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        <Star />
                      </IconButton>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Trạng thái
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={supplierForm.isActive}
                        onChange={(e) => setSupplierForm({...supplierForm, isActive: e.target.checked})}
                        color="primary"
                      />
                    }
                    label={supplierForm.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell 
                  component="th" 
                  sx={{ 
                    fontWeight: 'bold',
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)'
                  }}
                >
                  Ghi chú
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    name="notes"
                    value={supplierForm.notes}
                    onChange={handleSupplierFormChange}
                    multiline
                    rows={3}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ 
        background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)',
        p: 2,
        borderTop: '1px solid #e0e0e0'
      }}>
        <Button 
          onClick={handleCloseDialog}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Hủy
        </Button>
        <Button 
          onClick={handleSaveSupplier} 
          variant="contained" 
          color="primary"
          disabled={!supplierForm.name}
          sx={{
            background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            boxShadow: '0 3px 5px 2px rgba(139, 195, 74, .3)'
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý kho
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<TrendingUp />}
            onClick={() => navigate('/admin/inventory/reports')}
            sx={{ mr: 1 }}
          >
            Báo cáo kho
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<Receipt />}
            onClick={() => navigate('/admin/shopping')}
          >
            Đơn đặt hàng
          </Button>
        </Box>
      </Box>

      {renderInventoryOverview()}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Nguyên liệu" icon={<Inventory />} iconPosition="start" />
          <Tab label="Danh mục" icon={<Category />} iconPosition="start" />
          <Tab label="Nhà cung cấp" icon={<Receipt />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder={tabValue === 0 ? "Tìm nguyên liệu..." : tabValue === 1 ? "Tìm danh mục..." : "Tìm nhà cung cấp..."}
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
          <Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setTabValue(tabValue); // Trigger re-fetch
              }}
              sx={{ mr: 1 }}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => handleOpenDialog(null, tabValue === 0)}
            >
              {tabValue === 0 ? 'Thêm nguyên liệu' : tabValue === 1 ? 'Thêm danh mục' : 'Thêm nhà cung cấp'}
            </Button>
          </Box>
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
            {tabValue === 1 && renderCategoriesTab()}
            {tabValue === 2 && renderSuppliersTab()}
          </>
        )}
      </Paper>

      {/* Dialog for Forms */}
      {openDialog && tabValue === 0 && renderIngredientFormDialog()}
      {openDialog && tabValue === 2 && renderSupplierFormDialog()}

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

export default InventoryManagementPage;
