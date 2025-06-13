import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
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
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Avatar,
  Divider,
  Badge,
  Zoom,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  QrCode as QrCodeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TableRestaurant as TableIcon,
  People as PeopleIcon,
  CheckCircle as AvailableIcon,
  DoNotDisturb as OccupiedIcon,
  AccessTime as ReservedIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const TableManagementPage = () => {
  const theme = useTheme();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    status: 'available',
  });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTableQR, setSelectedTableQR] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/tables`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải dữ liệu bàn',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenDialog = (table = null) => {
    if (table) {
      if (table.status === 'occupied') {
        setSnackbar({
          open: true,
          message: 'Không thể chỉnh sửa bàn đang được sử dụng',
          severity: 'warning',
        });
        return;
      }
      
      setCurrentTable(table);
      setFormData({
        name: table.name,
        capacity: table.capacity.toString(),
        status: table.status,
      });
    } else {
      setCurrentTable(null);
      setFormData({
        name: '',
        capacity: '4',
        status: 'available',
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
      if (currentTable) {
        // Cập nhật bàn
        await axios.put(
          `${API_URL}/api/tables/${currentTable.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setSnackbar({
          open: true,
          message: 'Cập nhật bàn thành công',
          severity: 'success',
        });
      } else {
        // Thêm bàn mới
        await axios.post(
          `${API_URL}/api/tables`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setSnackbar({
          open: true,
          message: 'Thêm bàn mới thành công',
          severity: 'success',
        });
      }

      // Refresh tables
      fetchTables();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving table:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi lưu thông tin bàn',
        severity: 'error',
      });
    }
  };

  const handleDeleteTable = async (id) => {
    try {
      // Find the table to check its status
      const tableToDelete = tables.find(table => table.id === id);
      
      // Prevent deleting tables that are in use
      if (tableToDelete && tableToDelete.status === 'occupied') {
        setSnackbar({
          open: true,
          message: 'Không thể xóa bàn đang được sử dụng',
          severity: 'warning',
        });
        return;
      }
      
      await axios.delete(`${API_URL}/api/tables/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local state
      setTables(tables.filter(table => table.id !== id));
      
      setSnackbar({
        open: true,
        message: 'Xóa bàn thành công',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi xóa bàn',
        severity: 'error',
      });
    }
  };

  const handleShowQR = (table) => {
    setSelectedTableQR(table);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
  };

  const handleRegenerateQR = async (tableId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/tables/${tableId}/qrcode`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update the table in local state
      setTables(tables.map(table => 
        table.id === tableId ? response.data : table
      ));
      
      // Update selected table QR
      if (selectedTableQR && selectedTableQR.id === tableId) {
        setSelectedTableQR(response.data);
      }
      
      setSnackbar({
        open: true,
        message: 'Tạo mã QR mới thành công',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tạo mã QR mới',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'reserved': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Đang sử dụng';
      case 'reserved': return 'Đã đặt trước';
      default: return status;
    }
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
          Quản lý bàn
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm bàn mới
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {tables.length > 0 ? (
          tables.map((table) => (
            <Grid xs={12} sm={6} md={4} key={table.id}>
              <Card 
                sx={{ 
                  position: 'relative',
                  borderLeft: `4px solid ${
                    table.status === 'available' ? '#4caf50' : 
                    table.status === 'occupied' ? '#f44336' : 
                    '#ff9800'
                  }`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">
                      {table.name}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(table.status)} 
                      color={getStatusColor(table.status)} 
                      size="small" 
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sức chứa: {table.capacity} người
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleShowQR(table)}
                      size="small"
                    >
                      <QrCodeIcon />
                    </IconButton>
                    <Tooltip title={table.status === 'occupied' ? 'Không thể chỉnh sửa bàn đang sử dụng' : 'Chỉnh sửa bàn'}>
                      <span>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(table)}
                          size="small"
                          disabled={table.status === 'occupied'}
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={table.status === 'occupied' ? 'Không thể xóa bàn đang sử dụng' : 'Xóa bàn'}>
                      <span>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteTable(table.id)}
                          size="small"
                          disabled={table.status === 'occupied'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Không có bàn nào được tạo</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {currentTable ? `Chỉnh sửa ${currentTable.name}` : 'Thêm bàn mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Tên bàn"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
              placeholder="Bàn 1"
            />
            
            <TextField
              fullWidth
              label="Sức chứa"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Trạng thái"
              >
                <MenuItem value="available">Trống</MenuItem>
                <MenuItem value="occupied">Đang sử dụng</MenuItem>
                <MenuItem value="reserved">Đã đặt trước</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentTable ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={qrDialogOpen} onClose={handleCloseQrDialog}>
        <DialogTitle>
          Mã QR cho {selectedTableQR?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTableQR && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              {selectedTableQR.qrCode ? (
                <Box>
                  <img 
                    src={`${API_URL}${selectedTableQR.qrCode}`} 
                    alt="QR Code" 
                    style={{ maxWidth: '100%', height: 'auto' }} 
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Quét mã QR để đặt món
                  </Typography>
                </Box>
              ) : (
                <Typography>Chưa có mã QR cho bàn này</Typography>
              )}
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => handleRegenerateQR(selectedTableQR.id)}
              >
                Tạo mã QR mới
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>Đóng</Button>
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

export default TableManagementPage; 