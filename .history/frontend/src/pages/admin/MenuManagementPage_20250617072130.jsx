import React, { useState, useEffect } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AddCircleOutline,
  RemoveCircleOutline,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';
import * as inventoryService from '../../services/inventoryService';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState({
    ingredientId: '',
    quantity: 1,
    unit: 'g',
  });
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    image: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMenuItems(response.data);
      
      // Extract unique categories
      const categories = [...new Set(response.data.map(item => item.category))];
      setMenuCategories(categories);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải dữ liệu menu',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const fetchMenuCategories = async () => {
    try {
      // Lấy các danh mục từ menu hiện có
      const response = await axios.get(`${API_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Trích xuất danh mục duy nhất
      const uniqueCategories = [...new Set(response.data.map(item => item.category))].filter(Boolean);
      setMenuCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu categories:', error);
    }
  };

  const fetchIngredients = async () => {
    try {
      const ingredientsData = await inventoryService.getAllIngredients();
      // Map costPerUnit to price for compatibility
      const processedIngredients = ingredientsData.map(ingredient => ({
        ...ingredient,
        price: ingredient.costPerUnit
      }));
      setIngredients(processedIngredients);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchMenuCategories();
    fetchIngredients();
  }, []);
  
  // Lưu trữ dữ liệu công thức đã tải
  const [recipeCache, setRecipeCache] = useState({});

  const handleOpenDialog = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category,
        isAvailable: item.isAvailable,
        image: item.image || '',
      });
      
      // Nếu đang chỉnh sửa món ăn, lấy công thức nấu ăn
      fetchRecipeForMenuItem(item.id);
    } else {
      setCurrentItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        isAvailable: true,
        image: '',
      });
      setSelectedIngredients([]);
      setSuggestedPrice(0);
    }
    setOpenDialog(true);
  };

  const fetchRecipeForMenuItem = async (menuItemId) => {
    try {
      // Kiểm tra xem đã có dữ liệu trong cache chưa
      if (recipeCache[menuItemId]) {
        const cachedData = recipeCache[menuItemId];
        setSelectedIngredients(cachedData.ingredients);
        calculateSuggestedPrice(cachedData.ingredients);
        return;
      }
      
      const recipeData = await inventoryService.getRecipeByMenuItem(menuItemId);
      if (recipeData && recipeData.RecipeIngredients) {
        // Chuyển đổi dữ liệu công thức thành định dạng selectedIngredients
        const ingredientsFromRecipe = recipeData.RecipeIngredients.map(item => {
          // Luôn lấy giá và ảnh mới nhất từ kho (ingredients state)
          const latest = ingredients.find(ing => ing.id === item.ingredientId);
          return {
            ingredientId: item.ingredientId,
            ingredientName: latest ? latest.name : (item.Ingredient ? item.Ingredient.name : ''),
            quantity: item.quantity,
            unit: latest ? latest.unit : (item.Ingredient ? item.Ingredient.unit : 'g'),
            price: latest ? latest.price : (item.Ingredient ? item.Ingredient.costPerUnit : 0),
            image: latest ? latest.image : (item.Ingredient ? item.Ingredient.image : null)
          };
        });
        
        // Lưu vào cache
        setRecipeCache(prev => ({
          ...prev,
          [menuItemId]: { ingredients: ingredientsFromRecipe }
        }));
        
        setSelectedIngredients(ingredientsFromRecipe);
        calculateSuggestedPrice(ingredientsFromRecipe);
      } else {
        setSelectedIngredients([]);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setSelectedIngredients([]);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAvailabilityChange = (e) => {
    setFormData({
      ...formData,
      isAvailable: e.target.value === 'true',
    });
  };

  const handleIngredientChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'ingredientId') {
      const selectedIngredient = ingredients.find(ing => ing.id === parseInt(value));
      if (selectedIngredient) {
        setCurrentIngredient({
          ...currentIngredient,
          ingredientId: value,
          unit: selectedIngredient.unit
        });
      } else {
        setCurrentIngredient({
          ...currentIngredient,
          [name]: value
        });
      }
    } else {
      setCurrentIngredient({
        ...currentIngredient,
        [name]: value
      });
    }
  };

  const addIngredient = () => {
    if (!currentIngredient.ingredientId || currentIngredient.quantity <= 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn nguyên liệu và nhập số lượng hợp lệ',
        severity: 'error',
      });
      return;
    }

    const selectedIngredient = ingredients.find(ing => ing.id === parseInt(currentIngredient.ingredientId));
    
    if (!selectedIngredient) {
      setSnackbar({
        open: true,
        message: 'Nguyên liệu không hợp lệ',
        severity: 'error',
      });
      return;
    }

    const newIngredient = {
      ingredientId: parseInt(currentIngredient.ingredientId),
      ingredientName: selectedIngredient.name,
      quantity: parseFloat(currentIngredient.quantity),
      unit: selectedIngredient.unit,
      price: selectedIngredient.price || 0,
      image: selectedIngredient.image || null
    };

    // Kiểm tra xem nguyên liệu đã được thêm chưa
    const existingIndex = selectedIngredients.findIndex(
      ing => ing.ingredientId === newIngredient.ingredientId
    );

    let updatedIngredients;
    if (existingIndex >= 0) {
      // Cập nhật số lượng nếu nguyên liệu đã tồn tại
      updatedIngredients = [...selectedIngredients];
      updatedIngredients[existingIndex].quantity += newIngredient.quantity;
    } else {
      // Thêm nguyên liệu mới
      updatedIngredients = [...selectedIngredients, newIngredient];
    }

    setSelectedIngredients(updatedIngredients);
    
    // Tính giá gợi ý dựa trên nguyên liệu
    calculateSuggestedPrice(updatedIngredients);
    
    // Reset form nguyên liệu
    setCurrentIngredient({
      ingredientId: '',
      quantity: 1,
      unit: 'g',
    });
  };

  const removeIngredient = (index) => {
    const updatedIngredients = [...selectedIngredients];
    updatedIngredients.splice(index, 1);
    setSelectedIngredients(updatedIngredients);
    
    // Cập nhật giá gợi ýcó
    calculateSuggestedPrice(updatedIngredients);
  };

  const calculateSuggestedPrice = (ingredients) => {
    // Tính tổng chi phí nguyên liệu
    const totalCost = ingredients.reduce((sum, ingredient) => {
      const price = ingredient.price || 0;
      const quantity = ingredient.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    // Giá gợi ý là 150% chi phí nguyên liệu
    const suggested = Math.ceil(totalCost * 1.5 / 1000) * 1000; // Làm tròn lên đến 1000 VND
    setSuggestedPrice(suggested);
    
    // Cập nhật giá gợi ý vào form nếu đang thêm món mới
    if (!currentItem) {
      setFormData({
        ...formData,
        price: suggested.toString()
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Create request data object
      const requestData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        isAvailable: formData.isAvailable,
        image: formData.image
      };

      let menuItemId;
      
      if (currentItem) {
        // Cập nhật món ăn
        const response = await axios.put(
          `${API_URL}/api/menu/${currentItem.id}`, 
          requestData, 
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        menuItemId = currentItem.id;
        setSnackbar({
          open: true,
          message: 'Cập nhật món ăn thành công',
          severity: 'success',
        });
      } else {
        // Thêm món ăn mới
        const response = await axios.post(
          `${API_URL}/api/menu`, 
          requestData, 
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        menuItemId = response.data.id;
        setSnackbar({
          open: true,
          message: 'Thêm món ăn mới thành công',
          severity: 'success',
        });
      }

      // Lưu công thức nấu ăn
      if (selectedIngredients.length > 0 && menuItemId) {
        const recipeData = {
          ingredients: selectedIngredients.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity
          }))
        };
        
        await inventoryService.createOrUpdateRecipe(menuItemId, recipeData);
      }

      // Refresh menu items
      fetchMenuItems();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi lưu món ăn: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/menu/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local state
      setMenuItems(menuItems.filter(item => item.id !== id));
      
      setSnackbar({
        open: true,
        message: 'Xóa món ăn thành công',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi xóa món ăn',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(0);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Quản lý thực đơn
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm món mới
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Hình ảnh</TableCell>
              <TableCell>Tên món</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuItems.length > 0 ? (
              menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Box
                      component="img"
                      src={item.image || 'https://via.placeholder.com/50x50?text=No+Image'}
                      alt={item.name}
                      sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.isAvailable ? 'Có sẵn' : 'Hết hàng'} 
                      color={item.isAvailable ? 'success' : 'error'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenDialog(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteItem(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Không có món ăn nào trong thực đơn
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for adding/editing menu items */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
          {currentItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
                Thông tin cơ bản
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="name"
                      label="Tên món"
                      value={formData.name}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} style={{width: '250px'}}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel>Danh mục món ăn</InputLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        label="Danh mục món ăn"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 200,
                              width: 'auto',
                              minWidth: '200px'
                            },
                          },
                        }}
                      >
                        {menuCategories.map((category) => (
                          <MuiMenuItem key={category} value={category} dense>
                            {category}
                          </MuiMenuItem>
                        ))}
                        <MuiMenuItem value="Món chính" dense>Món chính</MuiMenuItem>
                        <MuiMenuItem value="Món phụ" dense>Món phụ</MuiMenuItem>
                        <MuiMenuItem value="Đồ uống" dense>Đồ uống</MuiMenuItem>
                        <MuiMenuItem value="Tráng miệng" dense>Tráng miệng</MuiMenuItem>
                        <MuiMenuItem value="Món khai vị" dense>Món khai vị</MuiMenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Mô tả"
                      value={formData.description}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Công thức nấu ăn */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, color: 'primary.main' }}>
                Công thức nấu ăn
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth variant="outlined" style={{width: '250px'}}>
                      <InputLabel>Nguyên liệu</InputLabel>
                      <Select
                        name="ingredientId"
                        value={currentIngredient.ingredientId}
                        onChange={handleIngredientChange}
                        label="Nguyên liệu"
                        renderValue={(selected) => {
                          const selectedIng = ingredients.find(ing => ing.id === parseInt(selected));
                          return selectedIng ? selectedIng.name : '';
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 200,
                              width: 'auto',
                              minWidth: '200px'
                            },
                          },
                        }}
                      >
                        {ingredients.map((ingredient) => (
                          <MuiMenuItem key={ingredient.id} value={ingredient.id} dense sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              {/* Always show image with placeholder fallback */}
                              <Box
                                component="img"
                                src={ingredient.image}
                                alt={ingredient.name}
                                sx={{ width: 32, height: 32, mr: 1, objectFit: 'cover', borderRadius: 1 }}
                              />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2">{ingredient.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatPrice(ingredient.price || 0)}/{ingredient.unit}
                                </Typography>
                              </Box>
                            </Box>
                          </MuiMenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      name="quantity"
                      label="Số lượng"
                      type="number"
                      value={currentIngredient.quantity}
                      onChange={handleIngredientChange}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{currentIngredient.unit}</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddCircleOutline />}
                      onClick={addIngredient}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Thêm nguyên liệu
                    </Button>
                  </Grid>
                </Grid>
                
                {selectedIngredients.length > 0 ? (
                  <Paper variant="outlined" sx={{ mt: 2, maxHeight: '200px', overflow: 'auto' }}>
                    <List disablePadding>
                      {selectedIngredients.map((ingredient, index) => (
                        <React.Fragment key={index}>
                          <ListItem 
                            secondaryAction={
                              <IconButton edge="end" color="error" onClick={() => removeIngredient(index)}>
                                <RemoveCircleOutline />
                              </IconButton>
                            }
                            sx={{ py: 1 }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium">
                                  {ingredient.ingredientName}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {ingredient.quantity} {ingredient.unit} - {formatPrice(ingredient.price * ingredient.quantity)}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < selectedIngredients.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    border: '1px dashed #ccc', 
                    borderRadius: 1, 
                    textAlign: 'center',
                    bgcolor: '#f5f5f5'
                  }}>
                    <Typography color="text.secondary">
                      Chưa có nguyên liệu nào được thêm
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Giá và trạng thái */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, color: 'primary.main' }}>
                Giá và trạng thái
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="price"
                      label="Giá (VND)"
                      value={formData.price}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      type="number"
                      variant="outlined"
                      InputProps={{
                        startAdornment: suggestedPrice > 0 ? (
                          <Tooltip title={`Giá gợi ý: ${formatPrice(suggestedPrice)}`}>
                            <InputAdornment position="start">
                              <InfoIcon color="primary" />
                            </InputAdornment>
                          </Tooltip>
                        ) : null,
                      }}
                    />
                    {suggestedPrice > 0 && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                        Giá gợi ý: {formatPrice(suggestedPrice)} (150% chi phí nguyên liệu)
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        name="isAvailable"
                        value={formData.isAvailable.toString()}
                        onChange={handleAvailabilityChange}
                        label="Trạng thái"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 200,
                              width: 'auto',
                              minWidth: '200px'
                            },
                          },
                        }}
                      >
                        <MuiMenuItem value="true" dense>Có sẵn</MuiMenuItem>
                        <MuiMenuItem value="false" dense>Hết hàng</MuiMenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Hình ảnh */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, color: 'primary.main' }}>
                Hình ảnh
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <TextField
                  name="image"
                  label="URL hình ảnh"
                  value={formData.image || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Nhập đường dẫn URL của hình ảnh"
                  helperText="Nhập URL hình ảnh từ internet (ví dụ: https://example.com/image.jpg)"
                />
                {formData.image && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      style={{ 
                        maxHeight: 150, 
                        maxWidth: '100%', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Lỗi+hình+ảnh';
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ minWidth: '100px' }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            sx={{ minWidth: '100px' }}
          >
            {currentItem ? 'Cập nhật' : 'Thêm mới'}
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

export default MenuManagementPage; 