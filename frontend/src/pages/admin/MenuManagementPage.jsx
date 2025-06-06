import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
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

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải dữ liệu thực đơn',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

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
    }
    setOpenDialog(true);
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

  const handleSubmit = async () => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('description', formData.description);
      formDataObj.append('price', formData.price);
      formDataObj.append('category', formData.category);
      formDataObj.append('isAvailable', formData.isAvailable);
      
      if (formData.image && formData.image instanceof File) {
        formDataObj.append('image', formData.image);
      }

      let response;
      if (currentItem) {
        // Cập nhật món ăn
        response = await axios.put(
          `${API_URL}/api/menu/${currentItem.id}`, 
          formDataObj, 
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setSnackbar({
          open: true,
          message: 'Cập nhật món ăn thành công',
          severity: 'success',
        });
      } else {
        // Thêm món ăn mới
        response = await axios.post(
          `${API_URL}/api/menu`, 
          formDataObj, 
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setSnackbar({
          open: true,
          message: 'Thêm món ăn mới thành công',
          severity: 'success',
        });
      }

      // Refresh menu items
      fetchMenuItems();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi lưu món ăn',
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

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0],
        imagePreview: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const categories = [...new Set(menuItems.map(item => item.category))].filter(Boolean);

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
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm món mới
        </Button>
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
        <DialogTitle>
          {currentItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Tên món"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Giá (VND)"
                value={formData.price}
                onChange={handleInputChange}
                fullWidth
                required
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Danh mục"
                >
                  {categories.map((category) => (
                    <MuiMenuItem key={category} value={category}>
                      {category}
                    </MuiMenuItem>
                  ))}
                  <MuiMenuItem value="Món chính">Món chính</MuiMenuItem>
                  <MuiMenuItem value="Món phụ">Món phụ</MuiMenuItem>
                  <MuiMenuItem value="Đồ uống">Đồ uống</MuiMenuItem>
                  <MuiMenuItem value="Tráng miệng">Tráng miệng</MuiMenuItem>
                  <MuiMenuItem value="Món khai vị">Món khai vị</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="isAvailable"
                  value={formData.isAvailable.toString()}
                  onChange={handleAvailabilityChange}
                  label="Trạng thái"
                >
                  <MuiMenuItem value="true">Có sẵn</MuiMenuItem>
                  <MuiMenuItem value="false">Hết hàng</MuiMenuItem>
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
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span" fullWidth>
                  Chọn hình ảnh
                </Button>
              </label>
              {(formData.imagePreview || formData.image) && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img 
                    src={formData.imagePreview || formData.image} 
                    alt="Preview" 
                    style={{ maxHeight: 100, maxWidth: '100%' }} 
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
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