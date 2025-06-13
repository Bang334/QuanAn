import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import * as inventoryService from '../../services/inventoryService';
import * as userService from '../../services/userService';

const KitchenPermissionManagementPage = () => {
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentPermission, setCurrentPermission] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [formData, setFormData] = useState({
    userId: '',
    canAutoApprove: false,
    maxOrderValue: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permissionsData, usersData] = await Promise.all([
        inventoryService.getAllKitchenPermissions(),
        userService.getAllUsers()
      ]);
      
      setPermissions(permissionsData);
      // Filter only kitchen staff users
      setUsers(usersData.filter(user => user.role === 'kitchen'));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (permission = null) => {
    if (permission) {
      setCurrentPermission(permission);
      
      setFormData({
        userId: permission.userId,
        canAutoApprove: permission.canAutoApprove,
        maxOrderValue: permission.maxOrderValue || 0,
        notes: permission.notes || ''
      });
    } else {
      setCurrentPermission(null);
      setFormData({
        userId: '',
        canAutoApprove: false,
        maxOrderValue: 0,
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (permission) => {
    setCurrentPermission(permission);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'canAutoApprove') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.userId) {
        showSnackbar('Vui lòng chọn nhân viên bếp', 'error');
        return;
      }

      const permissionData = {
        userId: formData.userId,
        canAutoApprove: formData.canAutoApprove,
        maxOrderValue: formData.maxOrderValue || 0,
        notes: formData.notes
      };

      if (currentPermission) {
        await inventoryService.updateKitchenPermission(currentPermission.id, permissionData);
        showSnackbar('Cập nhật quyền thành công');
      } else {
        await inventoryService.createKitchenPermission(permissionData);
        showSnackbar('Tạo quyền mới thành công');
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving permission:', error);
      showSnackbar('Lỗi khi lưu quyền', 'error');
    }
  };

  const handleDeletePermission = async () => {
    try {
      if (currentPermission) {
        await inventoryService.revokeKitchenPermission(currentPermission.id);
        showSnackbar('Đã xóa quyền thành công');
        handleCloseDeleteDialog();
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      showSnackbar('Lỗi khi xóa quyền', 'error');
    }
  };

  const isPermissionActive = (permission) => {
    if (!permission.isActive) return false;
    return true;
  };

  const getPermissionStatusChip = (permission) => {
    if (!permission.isActive) {
      return (
        <Chip 
          icon={<BlockIcon />} 
          label="Đã thu hồi" 
          color="error" 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    return (
      <Chip 
        icon={<CheckCircleIcon />} 
        label="Đang hoạt động" 
        color="success" 
        size="small" 
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý quyền nhân viên bếp
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm quyền mới
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Nhân viên</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Quyền duyệt đơn và thêm nguyên liệu</TableCell>
                <TableCell align="right">Giới hạn đơn hàng</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.length > 0 ? (
                permissions.map((permission) => (
                  <TableRow
                    key={permission.id}
                    sx={{
                      backgroundColor: isPermissionActive(permission) ? 'inherit' : '#f9f9f9',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">
                          {permission.User?.name || `ID: ${permission.userId}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {getPermissionStatusChip(permission)}
                    </TableCell>
                    <TableCell align="center">
                      {permission.canAutoApprove ? (
                        <Tooltip title="Có quyền duyệt đơn và thêm nguyên liệu">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Không có quyền">
                          <BlockIcon color="disabled" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {permission.maxOrderValue > 0
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(permission.maxOrderValue)
                        : 'Không giới hạn'}
                    </TableCell>
                    <TableCell>{permission.notes || '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDialog(permission)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa quyền">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDeleteDialog(permission)}
                          disabled={!permission.isActive}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có quyền nào được tạo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog for adding/editing permission */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentPermission ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: '1/-1', mb: 2 }}>
              <FormControl fullWidth disabled={Boolean(currentPermission)}>
                <InputLabel>Nhân viên bếp</InputLabel>
                <Select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  label="Nhân viên bếp"
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: '1/-1', mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.canAutoApprove}
                    onChange={handleInputChange}
                    name="canAutoApprove"
                    color="primary"
                  />
                }
                label="Cho phép duyệt đơn hàng và thêm nguyên liệu"
              />
            </Grid>
            <Grid sx={{ gridColumn: '1/-1', mb: 2 }}>
              <TextField
                fullWidth
                label="Giá trị đơn hàng tối đa (0 = không giới hạn)"
                name="maxOrderValue"
                type="number"
                value={formData.maxOrderValue}
                onChange={handleInputChange}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: '1/-1', mb: 2 }}>
              <TextField
                fullWidth
                label="Ghi chú"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentPermission ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for deleting permission */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận xóa quyền</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa quyền của{' '}
            <strong>{currentPermission?.User?.name || `ID: ${currentPermission?.userId}`}</strong>?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button onClick={handleDeletePermission} color="error" variant="contained">
            Xóa
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

export default KitchenPermissionManagementPage; 