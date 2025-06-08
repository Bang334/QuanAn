import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Box, Grid, Paper, Button, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, Divider, InputAdornment,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Tabs, Tab, TableFooter, FormControlLabel, Switch, Avatar
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, Search, Restaurant,
  Save, FastfoodOutlined, Kitchen, ListAlt,
  AddCircleOutline, RemoveCircleOutline, Calculate, Egg
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as inventoryService from '../../services/inventoryService';
import * as menuService from '../../services/menuService';
import { API_URL } from '../../config';

const API_ENDPOINT = `${API_URL}/api`;

const RecipeManagementPage = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openIngredientDialog, setOpenIngredientDialog] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [currentMenuItem, setCurrentMenuItem] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    menuItemId: '',
    description: '',
    preparationTime: 0,
    cookingTime: 0,
    servingSize: 1,
    instructions: '',
  });
  const [ingredientForm, setIngredientForm] = useState({
    ingredientId: '',
    quantity: 0,
    unit: 'g',
    note: '',
  });
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy dữ liệu món ăn
      const menuItemsRes = await axios.get(`${API_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Lấy dữ liệu nguyên liệu
      const ingredientsRes = await axios.get(`${API_URL}/api/inventory/ingredients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Lấy dữ liệu công thức
      const recipesRes = await axios.get(`${API_URL}/api/inventory/recipes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Nhóm công thức theo menuItemId từ dữ liệu trả về
      const recipes = recipesRes.data;
      
      console.log('Menu items loaded:', menuItemsRes.data);
      console.log('Ingredients loaded:', ingredientsRes.data);
      console.log('Recipes loaded:', recipes);

      setMenuItems(menuItemsRes.data);
      setRecipes(recipes);
      setIngredients(ingredientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipe ingredients
  const fetchRecipeIngredients = async (recipeId) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/inventory/recipes/menu-item/${recipeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recipe ingredients:', error);
      showSnackbar('Lỗi khi tải nguyên liệu công thức', 'error');
      return [];
    }
  };

  // Filter recipes based on search term and category
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const menuItem = menuItems.find(item => item.id === recipe.menuItemId);
    const matchesCategory = selectedCategory === 'all' || 
      (menuItem && menuItem.categoryId === parseInt(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  // Handle form input changes
  const handleRecipeFormChange = (e) => {
    const { name, value } = e.target;
    setRecipeForm({
      ...recipeForm,
      [name]: value,
    });
  };

  // Handle ingredient form changes
  const handleIngredientFormChange = (e) => {
    const { name, value } = e.target;
    setIngredientForm({
      ...ingredientForm,
      [name]: value,
    });

    // Auto-set unit based on selected ingredient
    if (name === 'ingredientId') {
      const selectedIngredient = ingredients.find(ing => ing.id === parseInt(value));
      if (selectedIngredient) {
        setIngredientForm(prev => ({
          ...prev,
          unit: selectedIngredient.unit
        }));
      }
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Open dialog to add new recipe
  const handleOpenAddDialog = () => {
    setCurrentRecipe(null);
    setRecipeForm({
      name: '',
      menuItemId: '',
      description: '',
      preparationTime: 0,
      cookingTime: 0,
      servingSize: 1,
      instructions: '',
    });
    setRecipeIngredients([]);
    setOpenDialog(true);
  };

  // Open dialog to edit recipe
  const handleOpenEditDialog = async (recipe) => {
    setCurrentRecipe(recipe);
    
    // Tìm thông tin món ăn
    const menuItem = menuItems.find(item => item.id === recipe.id || item.id === recipe.menuItemId);
    if (!menuItem) {
      setError('Không tìm thấy thông tin món ăn');
      return;
    }
    
    setRecipeForm({
      menuItemId: menuItem.id
    });
    
    try {
      // Kiểm tra xem đã có công thức hay chưa
      const recipeExists = recipe.RecipeIngredients && recipe.RecipeIngredients.length > 0;
      
      if (recipeExists) {
        // Đã có công thức, lấy chi tiết từ dữ liệu đã có
        const recipeIngredients = recipe.RecipeIngredients.map(item => {
          const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
          return {
            ingredientId: item.ingredientId,
            ingredientName: ingredient ? ingredient.name : '',
            quantity: item.quantity,
            notes: item.notes || '',
            isOptional: item.isOptional || false,
            preparationMethod: item.preparationMethod || ''
          };
        });
        
        setRecipeIngredients(recipeIngredients);
      } else {
        // Chưa có công thức, kiểm tra nếu menuItem.id tồn tại thì mới gọi API
        if (menuItem.id) {
          try {
            const response = await axios.get(
              `${API_URL}/api/inventory/recipes/menu-item/${menuItem.id}`,
              {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              }
            );
            
            if (response.data && response.data.RecipeIngredients) {
              // Chuẩn bị dữ liệu nguyên liệu từ API
              const recipeIngredients = response.data.RecipeIngredients.map(item => ({
                ingredientId: item.ingredientId,
                ingredientName: item.Ingredient ? item.Ingredient.name : '',
                quantity: item.quantity,
                notes: item.notes || '',
                isOptional: item.isOptional || false,
                preparationMethod: item.preparationMethod || ''
              }));
              
              setRecipeIngredients(recipeIngredients);
            } else {
              // Không có dữ liệu từ API
              setRecipeIngredients([]);
            }
          } catch (error) {
            console.error('Error fetching recipe details:', error);
            // Không tìm thấy công thức, tạo mới
            setRecipeIngredients([]);
          }
        } else {
          // Không có menuItem.id, không gọi API và tạo mới
          setRecipeIngredients([]);
        }
      }
    } catch (error) {
      console.error('Error processing recipe data:', error);
      setError('Lỗi khi xử lý dữ liệu công thức');
      setRecipeIngredients([]);
    }
    
    setOpenDialog(true);
  };

  // Open dialog to add/edit ingredient in recipe
  const handleOpenIngredientDialog = (recipeId) => {
    setIngredientForm({
      ingredientId: '',
      quantity: 0,
      unit: 'g',
      note: '',
    });
    setOpenIngredientDialog(true);
  };

  // Close dialogs
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseIngredientDialog = () => {
    setOpenIngredientDialog(false);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (recipe) => {
    setCurrentRecipe(recipe);
    setOpenDeleteDialog(true);
  };

  // Add ingredient to recipe
  const handleAddIngredient = () => {
    // Kiểm tra dữ liệu đầu vào
    if (!ingredientForm.ingredientId || !ingredientForm.quantity) {
      setError('Vui lòng chọn nguyên liệu và nhập số lượng');
      return;
    }
    
    // Tìm thông tin nguyên liệu
    const ingredient = ingredients.find(ing => ing.id === ingredientForm.ingredientId);
    if (!ingredient) {
      setError('Không tìm thấy thông tin nguyên liệu');
      return;
    }
    
    // Kiểm tra xem nguyên liệu đã tồn tại trong công thức chưa
    const existingIndex = recipeIngredients.findIndex(
      item => item.ingredientId === ingredientForm.ingredientId
    );
    
    if (existingIndex >= 0) {
      // Cập nhật nguyên liệu đã tồn tại
      const updatedIngredients = [...recipeIngredients];
      updatedIngredients[existingIndex] = {
        ...updatedIngredients[existingIndex],
        quantity: parseFloat(ingredientForm.quantity),
        notes: ingredientForm.notes || '',
        isOptional: ingredientForm.isOptional || false,
        preparationMethod: ingredientForm.preparationMethod || ''
      };
      
      setRecipeIngredients(updatedIngredients);
    } else {
      // Thêm nguyên liệu mới
      setRecipeIngredients([
        ...recipeIngredients,
        {
          ingredientId: ingredientForm.ingredientId,
          ingredientName: ingredient.name,
          quantity: parseFloat(ingredientForm.quantity),
          notes: ingredientForm.notes || '',
          isOptional: ingredientForm.isOptional || false,
          preparationMethod: ingredientForm.preparationMethod || ''
        }
      ]);
    }
    
    // Reset form và đóng dialog
    setIngredientForm({
      ingredientId: '',
      quantity: '',
      notes: '',
      isOptional: false,
      preparationMethod: ''
    });
    
    handleCloseIngredientDialog();
  };

  // Remove ingredient from recipe
  const handleRemoveIngredient = (index) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients.splice(index, 1);
    setRecipeIngredients(updatedIngredients);
  };

  // Tính chi phí công thức
  const calculateRecipeCost = (recipeId) => {
    let totalCost = 0;
    
    // Tìm công thức theo ID
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (recipe && recipe.RecipeIngredients) {
      recipe.RecipeIngredients.forEach(recipeIngredient => {
        const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId);
        if (ingredient) {
          totalCost += ingredient.price * recipeIngredient.quantity;
        }
      });
    }
    
    return totalCost;
  };

  const handleSaveRecipe = async () => {
    try {
      setSubmitting(true);
      
      // Kiểm tra dữ liệu
      if (!recipeForm.menuItemId) {
        setError('Vui lòng chọn món ăn');
        return;
      }
      
      if (recipeIngredients.length === 0) {
        setError('Vui lòng thêm ít nhất một nguyên liệu');
        return;
      }
      
      // Chuẩn bị dữ liệu để gửi đi
      const recipeData = {
        ingredients: recipeIngredients.map(item => ({
          ingredientId: item.ingredientId,
          quantity: parseFloat(item.quantity),
          notes: item.notes || '',
          isOptional: item.isOptional || false,
          preparationMethod: item.preparationMethod || ''
        }))
      };
      
      let response;
      
      // Gọi API để lưu công thức
      response = await axios.post(
        `${API_URL}/api/inventory/recipes/menu-item/${recipeForm.menuItemId}`,
        recipeData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Cập nhật danh sách công thức
      fetchData();
      
      // Đóng dialog
      handleCloseDialog();
      
      // Hiển thị thông báo thành công
      showSnackbar('Cập nhật công thức thành công');
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu công thức');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete recipe
  const handleDeleteRecipe = async () => {
    try {
      await axios.delete(
        `${API_URL}/api/inventory/recipes/menu-item/${currentRecipe.menuItemId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      showSnackbar('Xóa công thức thành công');
      handleCloseDeleteDialog();
      fetchData();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Lỗi khi xóa công thức: ' + error.message);
    }
  };

  // Render recipes table
  const renderRecipesTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Món ăn</TableCell>
            <TableCell>Danh mục</TableCell>
            <TableCell>Số nguyên liệu</TableCell>
            <TableCell align="right">Chi phí ước tính</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Đang tải dữ liệu...
              </TableCell>
            </TableRow>
          ) : menuItems.length > 0 ? (
            menuItems.map((menuItem) => {
              // Tìm công thức tương ứng với món ăn
              const recipe = recipes.find(r => r.id === menuItem.id);
              
              // Đếm số nguyên liệu trong công thức
              const ingredientCount = recipe && recipe.RecipeIngredients 
                ? recipe.RecipeIngredients.length 
                : 0;
              
              // Tính chi phí ước tính từ các nguyên liệu
              const estimatedCost = recipe ? calculateRecipeCost(recipe.id) : 0;
              
              return (
                <TableRow key={menuItem.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {menuItem.image ? (
                        <Box
                          component="img"
                          src={menuItem.image}
                          alt={menuItem.name}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 1,
                            objectFit: 'cover',
                            mr: 1.5
                          }}
                        />
                      ) : (
                        <Box
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 1,
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}
                        >
                          <Restaurant />
                        </Box>
                      )}
                      <Typography variant="body1" fontWeight="medium">
                        {menuItem.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{menuItem.category}</TableCell>
                  <TableCell>{ingredientCount} nguyên liệu</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCost || 0)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(recipe || { id: menuItem.id, menuItemId: menuItem.id })}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(recipe || { id: menuItem.id, menuItemId: menuItem.id })}
                        size="small"
                        disabled={!recipe}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Tính chi phí">
                      <IconButton 
                        color="info" 
                        size="small"
                      >
                        <Calculate fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                {error ? (
                  <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
                ) : (
                  'Không tìm thấy món ăn nào'
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render recipe form dialog
  const renderRecipeFormDialog = () => {
    const selectedMenuItem = menuItems.find(item => item.id === recipeForm.menuItemId);
    
    return (
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentRecipe ? 'Chỉnh sửa công thức' : 'Thêm công thức mới'}
        </DialogTitle>
        <DialogContent>
          {selectedMenuItem && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {selectedMenuItem.image ? (
                <Avatar 
                  src={selectedMenuItem.image} 
                  alt={selectedMenuItem.name}
                  sx={{ width: 60, height: 60, mr: 2 }}
                />
              ) : (
                <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                  <Restaurant />
                </Avatar>
              )}
              <Box>
                <Typography variant="h6">{selectedMenuItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMenuItem.category}
                </Typography>
              </Box>
            </Box>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 12' } }}>
              <FormControl fullWidth>
                <InputLabel>Món ăn</InputLabel>
                <Select
                  name="menuItemId"
                  value={recipeForm.menuItemId || ''}
                  onChange={handleRecipeFormChange}
                  label="Món ăn"
                  required
                >
                  {menuItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.image ? (
                          <Avatar 
                            src={item.image} 
                            alt={item.name}
                            sx={{ width: 24, height: 24, mr: 1 }}
                          />
                        ) : (
                          <Restaurant fontSize="small" sx={{ mr: 1 }} />
                        )}
                        <Typography>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({item.category})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                <Box>
                  <Typography variant="h6">Nguyên liệu</Typography>
                  {selectedMenuItem && (
                    <Typography variant="body2" color="text.secondary">
                      cho món {selectedMenuItem.name}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutline />}
                  onClick={() => handleOpenIngredientDialog()}
                >
                  Thêm nguyên liệu
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nguyên liệu</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell>Đơn vị</TableCell>
                      <TableCell>Ghi chú</TableCell>
                      <TableCell>Tùy chọn</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipeIngredients.length > 0 ? (
                      recipeIngredients.map((item, index) => {
                        const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {ingredient && ingredient.image ? (
                                  <Avatar 
                                    src={ingredient.image} 
                                    alt={item.ingredientName}
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                  />
                                ) : (
                                  <Egg fontSize="small" sx={{ mr: 1 }} />
                                )}
                                {item.ingredientName || (ingredient ? ingredient.name : '')}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell>{ingredient ? ingredient.unit : ''}</TableCell>
                            <TableCell>{item.notes || '-'}</TableCell>
                            <TableCell>{item.isOptional ? 'Có' : 'Không'}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveIngredient(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Chưa có nguyên liệu nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="subtitle2">Tổng chi phí:</Typography>
                      </TableCell>
                      <TableCell align="right" colSpan={2}>
                        <strong>
                          {new Intl.NumberFormat('vi-VN').format(calculateRecipeCost(currentRecipe?.id))} đ
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button 
            onClick={handleSaveRecipe} 
            variant="contained" 
            color="primary"
            disabled={!recipeForm.menuItemId || recipeIngredients.length === 0}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render ingredient form dialog
  const renderIngredientFormDialog = () => {
    const selectedMenuItem = menuItems.find(item => item.id === recipeForm.menuItemId);
    const selectedIngredient = ingredients.find(ing => ing.id === ingredientForm.ingredientId);
    
    return (
      <Dialog open={openIngredientDialog} onClose={handleCloseIngredientDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Thêm nguyên liệu
          {selectedMenuItem && (
            <Typography variant="subtitle1" color="text.secondary">
              Cho món: {selectedMenuItem.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel>Nguyên liệu</InputLabel>
                <Select
                  name="ingredientId"
                  value={ingredientForm.ingredientId || ''}
                  onChange={handleIngredientFormChange}
                  label="Nguyên liệu"
                  required
                >
                  {ingredients.map((ingredient) => (
                    <MenuItem key={ingredient.id} value={ingredient.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{ingredient.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({ingredient.unit})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} container spacing={2}>
              <Grid xs={8}>
                <TextField
                  fullWidth
                  label="Số lượng"
                  name="quantity"
                  type="number"
                  value={ingredientForm.quantity || ''}
                  onChange={handleIngredientFormChange}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    endAdornment: selectedIngredient && (
                      <InputAdornment position="end">
                        {selectedIngredient.unit}
                      </InputAdornment>
                    )
                  }}
                  required
                />
              </Grid>
              <Grid xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isOptional"
                      checked={ingredientForm.isOptional || false}
                      onChange={(e) => handleIngredientFormChange({
                        target: { name: 'isOptional', value: e.target.checked }
                      })}
                    />
                  }
                  label="Tùy chọn"
                />
              </Grid>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                name="notes"
                value={ingredientForm.notes || ''}
                onChange={handleIngredientFormChange}
                multiline
                rows={2}
                placeholder="Ví dụ: thái nhỏ, xay nhuyễn..."
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Phương pháp chuẩn bị"
                name="preparationMethod"
                value={ingredientForm.preparationMethod || ''}
                onChange={handleIngredientFormChange}
                multiline
                rows={2}
                placeholder="Ví dụ: rửa sạch, ngâm nước muối..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIngredientDialog}>Hủy</Button>
          <Button 
            onClick={handleAddIngredient} 
            variant="contained" 
            color="primary"
            disabled={!ingredientForm.ingredientId || !ingredientForm.quantity}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render delete confirmation dialog
  const renderDeleteConfirmationDialog = () => (
    <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
      <DialogTitle>Xác nhận xóa</DialogTitle>
      <DialogContent>
        <Typography>
          Bạn có chắc chắn muốn xóa công thức "{currentRecipe?.name}"?
          Hành động này không thể hoàn tác.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
        <Button onClick={handleDeleteRecipe} color="error" variant="contained">
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render cost optimization tab
  const renderCostOptimizationTab = () => (
    <Typography variant="h6" sx={{ mt: 2 }}>
      Tính năng tối ưu chi phí đang được phát triển
    </Typography>
  );

  // Render menu items tab
  const renderMenuItemsTab = () => (
    <Typography variant="h6" sx={{ mt: 2 }}>
      Tính năng quản lý món ăn đang được phát triển
    </Typography>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý công thức món ăn
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="recipe tabs">
          <Tab label="Công thức" />
          <Tab label="Tối ưu chi phí" />
          <Tab label="Món ăn" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
            <TextField
              label="Tìm kiếm"
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
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Danh mục"
              >
                <MenuItem value="all">Tất cả danh mục</MenuItem>
                {/* Categories would be populated from API */}
                <MenuItem value="1">Món chính</MenuItem>
                <MenuItem value="2">Món phụ</MenuItem>
                <MenuItem value="3">Món tráng miệng</MenuItem>
                <MenuItem value="4">Đồ uống</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Làm mới
            </Button>
          </Box>

          {renderRecipesTable()}
        </>
      )}

      {tabValue === 1 && renderCostOptimizationTab()}
      {tabValue === 2 && renderMenuItemsTab()}

      {renderRecipeFormDialog()}
      {renderIngredientFormDialog()}
      {currentRecipe && renderDeleteConfirmationDialog()}

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

export default RecipeManagementPage;
