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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
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
    allowedCategories: [],
    notes: '',
    expiryDate: null
  });
  
  const [availableCategories] = useState([
    'Món chính',
    'Món phụ',
    'Đồ uống',
    'Món tráng miệng'
  ]);

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
      
      let allowedCategories = [];
      try {
        if (permission.allowedCategories) {
          // Kiểm tra xem chuỗi có phải là JSON hợp lệ không
          if (permission.allowedCategories.startsWith('[') && permission.allowedCategories.endsWith(']')) {
            allowedCategories = JSON.parse(permission.allowedCategories);
          } else {
            // Nếu không phải JSON array, xử lý như chuỗi đơn giản
            // Có thể là chuỗi phân tách bởi dấu phẩy
            allowedCategories = permission.allowedCategories.split(',').map(item => item.trim());
          }
        }
      } catch (error) {
        console.error('Error parsing allowedCategories:', error);
        // Nếu không phải JSON hợp lệ, hiển thị chuỗi gốc dưới dạng mảng một phần tử
        if (permission.allowedCategories) {
          allowedCategories = [permission.allowedCategories];
        }
      }
      
      setFormData({
        userId: permission.userId,
        canAutoApprove: permission.canAutoApprove,
        maxOrderValue: permission.maxOrderValue || 0,
        allowedCategories: allowedCategories,
        notes: permission.notes || '',
        expiryDate: permission.expiryDate ? new Date(permission.expiryDate) : null
      });
    } else {
      setCurrentPermission(null);
      setFormData({
        userId: '',
        canAutoApprove: false,
        maxOrderValue: 0,
        allowedCategories: [],
        notes: '',
        expiryDate: null
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

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      allowedCategories: value
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      expiryDate: date
    });
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
        allowedCategories: JSON.stringify(formData.allowedCategories),
        notes: formData.notes,
        expiryDate: formData.expiryDate
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

  const handleRevokePermission = async () => {
    try {
      if (currentPermission) {
        await inventoryService.revokeKitchenPermission(currentPermission.id);
        showSnackbar('Thu hồi quyền thành công');
        handleCloseDeleteDialog();
        fetchData();
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      showSnackbar('Lỗi khi thu hồi quyền', 'error');
    }
  };

  const isPermissionActive = (permission) => {
    if (!permission.isActive) return false;
    if (!permission.expiryDate) return true;
    return new Date(permission.expiryDate) > new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    return new Date(dateString).toLocaleDateString('vi-VN');
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
              <TableRow>
                <TableCell>Nhân viên</TableCell>
                <TableCell>Tự động duyệt</TableCell>
                <TableCell>Giá trị tối đa</TableCell>
                <TableCell>Danh mục được phép</TableCell>
                <TableCell>Ngày hết hạn</TableCell>
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
                      backgroundColor: isPermissionActive(permission) ? 'inherit' : '#f5f5f5'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {permission.User?.name || `ID: ${permission.userId}`}
                        {!isPermissionActive(permission) && (
                          <Tooltip title="Quyền đã hết hạn">
                            <BlockIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {permission.canAutoApprove ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <BlockIcon color="disabled" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {permission.maxOrderValue > 0
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(permission.maxOrderValue)
                        : 'Không giới hạn'}
                    </TableCell>
                    <TableCell>
                      {permission.allowedCategories
                        ? (() => {
                            try {
                              // Kiểm tra xem chuỗi có phải là JSON hợp lệ không
                              if (permission.allowedCategories.startsWith('[') && permission.allowedCategories.endsWith(']')) {
                                const categories = JSON.parse(permission.allowedCategories);
                                return categories.map((category) => (
                                  <Chip
                                    key={category}
                                    label={category}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ));
                              } else {
                                // Nếu không phải JSON array, xử lý như chuỗi đơn giản
                                const categories = permission.allowedCategories.split(',').map(item => item.trim());
                                return categories.map((category) => (
                                  <Chip
                                    key={category}
                                    label={category}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ));
                              }
                            } catch (error) {
                              // Nếu không phải JSON hợp lệ hoặc có lỗi khác, hiển thị chuỗi gốc
                              return <span>{permission.allowedCategories}</span>;
                            }
                          })()
                        : 'Tất cả danh mục'}
                    </TableCell>
                    <TableCell>{formatDate(permission.expiryDate)}</TableCell>
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
                      <Tooltip title="Thu hồi quyền">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDeleteDialog(permission)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
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
                label="Cho phép tự động duyệt đơn hàng"
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
              <FormControl fullWidth>
                <InputLabel>Danh mục được phép</InputLabel>
                <Select
                  multiple
                  name="allowedCategories"
                  value={formData.allowedCategories}
                  onChange={handleCategoryChange}
                  label="Danh mục được phép"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: '1/-1', mb: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                <DatePicker
                  label="Ngày hết hạn (để trống = không giới hạn)"
                  value={formData.expiryDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </LocalizationProvider>
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

      {/* Dialog for revoking permission */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận thu hồi quyền</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn thu hồi quyền của{' '}
            <strong>{currentPermission?.User?.name || `ID: ${currentPermission?.userId}`}</strong>?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button onClick={handleRevokePermission} color="error" variant="contained">
            Thu hồi
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