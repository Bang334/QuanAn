import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Tabs, Tab, Button, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, InputAdornment, MenuItem,
  CircularProgress, Tooltip, FormControl, InputLabel, Select,
  Avatar, Card, CardContent
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, Search, Warning, 
  History, TrendingUp, Inventory, Receipt, FileDownload, FilterList, Category
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
    categoryId: '',
    unit: 'kg',
    quantity: 0,
    minQuantity: 0,
    cost: 0,
    imageUrl: '',
    supplierId: '',
  });

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    notes: '',
    isActive: true
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tabValue === 0) {
          const ingredientsData = await inventoryService.getAllIngredients();
          console.log("Admin - Fetched ingredients data:", ingredientsData);
          setIngredients(ingredientsData);
        } else if (tabValue === 1) {
          const categoriesData = await inventoryService.getAllCategories();
          setCategories(categoriesData);
        } else if (tabValue === 2) {
          const suppliersData = await inventoryService.getAllSuppliers();
          setSuppliers(suppliersData);
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
          categoryId: item.categoryId || '',
          unit: item.unit,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          cost: item.cost || 0,
          imageUrl: item.imageUrl || '',
          supplierId: item.supplierId || '',
        });
      } else {
        setSupplierForm({
          name: item.name,
          contactName: item.contactName || '',
          contactPhone: item.contactPhone || '',
          contactEmail: item.contactEmail || '',
          address: item.address || '',
          notes: item.notes || '',
          isActive: item.isActive
        });
      }
    } else {
      if (isIngredient) {
        setIngredientForm({
          name: '',
          description: '',
          categoryId: '',
          unit: 'kg',
          quantity: 0,
          minQuantity: 0,
          cost: 0,
          imageUrl: '',
          supplierId: '',
        });
      } else {
        setSupplierForm({
          name: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          notes: '',
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
      [name]: name === 'quantity' || name === 'minQuantity' || name === 'cost' 
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
      if (currentItem) {
        await inventoryService.updateSupplier(currentItem.id, supplierForm);
        showSnackbar('Nhà cung cấp đã được cập nhật thành công');
      } else {
        await inventoryService.createSupplier(supplierForm);
        showSnackbar('Nhà cung cấp đã được thêm thành công');
      }
      
      // Refresh suppliers list
      const updatedSuppliers = await inventoryService.getAllSuppliers();
      setSuppliers(updatedSuppliers);
      
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
    const matchesCategory = selectedCategory === 'all' || ingredient.categoryId === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <TableCell align="right">Nhà cung cấp</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredIngredients.length > 0 ? (
            filteredIngredients.map((ingredient) => {
              const category = categories.find(c => c.id === ingredient.categoryId);
              const supplier = suppliers.find(s => s.id === ingredient.supplierId);
              const isLowStock = ingredient.quantity <= ingredient.minQuantity;
              
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
                  <TableCell align="right">{supplier ? supplier.name : '-'}</TableCell>
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
              <TableCell colSpan={8} align="center">
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
    <Typography variant="h6" sx={{ mt: 2 }}>
      Tính năng quản lý danh mục đang được phát triển
    </Typography>
  );

  // Render suppliers management tab
  const renderSuppliersTab = () => (
    <Typography variant="h6" sx={{ mt: 2 }}>
      Tính năng quản lý nhà cung cấp đang được phát triển
    </Typography>
  );

  // Render ingredient form dialog
  const renderIngredientFormDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {currentItem ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Tên nguyên liệu"
              name="name"
              value={ingredientForm.name}
              onChange={handleIngredientFormChange}
              required
            />
          </Grid>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                name="categoryId"
                value={ingredientForm.categoryId}
                onChange={handleIngredientFormChange}
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Đơn vị"
              name="unit"
              value={ingredientForm.unit}
              onChange={handleIngredientFormChange}
              required
              select
            >
              <MenuItem value="kg">Kilogram (kg)</MenuItem>
              <MenuItem value="g">Gram (g)</MenuItem>
              <MenuItem value="l">Lít (l)</MenuItem>
              <MenuItem value="ml">Mililít (ml)</MenuItem>
              <MenuItem value="cái">Cái</MenuItem>
              <MenuItem value="hộp">Hộp</MenuItem>
              <MenuItem value="chai">Chai</MenuItem>
              <MenuItem value="gói">Gói</MenuItem>
            </TextField>
          </Grid>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <FormControl fullWidth>
              <InputLabel>Nhà cung cấp</InputLabel>
              <Select
                name="supplierId"
                value={ingredientForm.supplierId}
                onChange={handleIngredientFormChange}
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
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Số lượng"
              name="currentStock"
              type="number"
              value={ingredientForm.currentStock}
              onChange={handleIngredientFormChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">{ingredientForm.unit}</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
              required
            />
          </Grid>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Ngưỡng cảnh báo"
              name="minStockLevel"
              type="number"
              value={ingredientForm.minStockLevel}
              onChange={handleIngredientFormChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">{ingredientForm.unit}</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
              required
            />
          </Grid>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Giá (VND)"
              name="costPerUnit"
              type="number"
              value={ingredientForm.costPerUnit}
              onChange={handleIngredientFormChange}
              InputProps={{
                inputProps: { min: 0 }
              }}
              required
            />
          </Grid>
          <Grid sx={{ gridColumn: { xs: '1/-1', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="URL hình ảnh"
              name="imageUrl"
              value={ingredientForm.imageUrl}
              onChange={handleIngredientFormChange}
            />
          </Grid>
          <Grid sx={{ gridColumn: '1/-1' }}>
            <TextField
              fullWidth
              label="Mô tả"
              name="description"
              value={ingredientForm.description}
              onChange={handleIngredientFormChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Hủy</Button>
        <Button 
          onClick={handleSaveIngredient} 
          variant="contained" 
          color="primary"
          disabled={!ingredientForm.name || ingredientForm.quantity < 0}
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
            onClick={() => navigate('/admin/inventory/purchase-orders')}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {tabValue === 0 ? renderIngredientFormDialog() : tabValue === 1 ? (
          // Render category form dialog
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              {currentItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid sx={{ gridColumn: '1/-1' }}>
                  <TextField
                    fullWidth
                    label="Tên danh mục"
                    name="name"
                    value={ingredientForm.name}
                    onChange={handleIngredientFormChange}
                    required
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button 
                onClick={handleSaveIngredient} 
                variant="contained" 
                color="primary"
                disabled={!ingredientForm.name}
              >
                Lưu
              </Button>
            </DialogActions>
          </Dialog>
        ) : renderSupplierFormDialog()}
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

export default InventoryManagementPage;
