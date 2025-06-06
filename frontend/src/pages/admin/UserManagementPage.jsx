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
  MenuItem,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải dữ liệu người dùng',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        isActive: true, // Assuming all users in DB are active
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'waiter', // Default role
        password: '',
        isActive: true,
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

  const handleSubmit = async () => {
    try {
      if (currentUser) {
        // Cập nhật người dùng
        await axios.put(
          `${API_URL}/api/users/${currentUser.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setSnackbar({
          open: true,
          message: 'Cập nhật người dùng thành công',
          severity: 'success',
        });
      } else {
        // Thêm người dùng mới
        await axios.post(
          `${API_URL}/api/users`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setSnackbar({
          open: true,
          message: 'Thêm người dùng mới thành công',
          severity: 'success',
        });
      }

      // Refresh users
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Lỗi khi lưu thông tin người dùng',
        severity: 'error',
      });
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local state
      setUsers(users.filter(user => user.id !== id));
      
      setSnackbar({
        open: true,
        message: 'Xóa người dùng thành công',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi xóa người dùng',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'kitchen': return 'Nhân viên bếp';
      case 'waiter': return 'Nhân viên phục vụ';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'kitchen': return 'primary';
      case 'waiter': return 'success';
      default: return 'default';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          Quản lý người dùng
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm người dùng mới
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1, bgcolor: getRoleColor(user.role) + '.main' }}>
                        {getInitials(user.name)}
                      </Avatar>
                      {user.name}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getRoleLabel(user.role)} 
                      color={getRoleColor(user.role)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.role === 'admin'} // Prevent deleting admin users
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có người dùng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {currentUser ? `Chỉnh sửa ${currentUser.name}` : 'Thêm người dùng mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: 400 }}>
            <TextField
              fullWidth
              label="Tên"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!currentUser}
              sx={{ mb: 2 }}
              helperText={currentUser ? "Để trống nếu không muốn thay đổi mật khẩu" : ""}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="Vai trò"
              >
                <MenuItem value="admin">Quản trị viên</MenuItem>
                <MenuItem value="kitchen">Nhân viên bếp</MenuItem>
                <MenuItem value="waiter">Nhân viên phục vụ</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentUser ? 'Cập nhật' : 'Thêm mới'}
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

export default UserManagementPage; 