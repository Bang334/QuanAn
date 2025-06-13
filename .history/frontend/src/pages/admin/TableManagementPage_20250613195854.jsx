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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <AvailableIcon />;
      case 'occupied': return <OccupiedIcon />;
      case 'reserved': return <ReservedIcon />;
      default: return <TableIcon />;
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
    <Box sx={{ 
      padding: 3,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.01)',
      borderRadius: 2,
      minHeight: 'calc(100vh - 100px)'
    }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              backgroundColor: theme.palette.primary.main, 
              mr: 2,
              width: 56,
              height: 56,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <TableIcon fontSize="large" />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Quản lý bàn
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            px: 3,
            py: 1
          }}
        >
          Thêm bàn mới
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {tables.length > 0 ? (
          tables.map((table, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                <Card 
                  sx={{ 
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '8px',
                      backgroundColor: 
                        table.status === 'available' ? theme.palette.success.main : 
                        table.status === 'occupied' ? theme.palette.error.main : 
                        theme.palette.warning.main,
                    }}
                  />
                  <CardContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 
                              table.status === 'available' ? 'success.light' : 
                              table.status === 'occupied' ? 'error.light' : 
                              'warning.light',
                            color: '#fff',
                            mr: 2,
                          }}
                        >
                          {getStatusIcon(table.status)}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {table.name}
                        </Typography>
                      </Box>
                      <Chip 
                        label={getStatusLabel(table.status)} 
                        color={getStatusColor(table.status)} 
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          px: 1,
                          borderRadius: '12px',
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      mb: 2
                    }}>
                      <PeopleIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        Sức chứa: <strong>{table.capacity} người</strong>
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Tooltip title="Xem mã QR" arrow>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleShowQR(table)}
                          sx={{ 
                            bgcolor: theme.palette.primary.light + '20',
                            '&:hover': {
                              bgcolor: theme.palette.primary.light + '40',
                            }
                          }}
                        >
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Box>
                        <Tooltip title={table.status === 'occupied' ? 'Không thể chỉnh sửa bàn đang sử dụng' : 'Chỉnh sửa bàn'} arrow>
                          <span>
                            <IconButton 
                              color="info" 
                              onClick={() => handleOpenDialog(table)}
                              disabled={table.status === 'occupied'}
                              sx={{ 
                                mx: 1,
                                bgcolor: theme.palette.info.light + '20',
                                '&:hover': {
                                  bgcolor: theme.palette.info.light + '40',
                                },
                                '&.Mui-disabled': {
                                  bgcolor: theme.palette.action.disabledBackground,
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title={table.status === 'occupied' ? 'Không thể xóa bàn đang sử dụng' : 'Xóa bàn'} arrow>
                          <span>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteTable(table.id)}
                              disabled={table.status === 'occupied'}
                              sx={{ 
                                bgcolor: theme.palette.error.light + '20',
                                '&:hover': {
                                  bgcolor: theme.palette.error.light + '40',
                                },
                                '&.Mui-disabled': {
                                  bgcolor: theme.palette.action.disabledBackground,
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Fade in={true}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}
              >
                <TableIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Không có bàn nào được tạo</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 2 }}
                >
                  Thêm bàn mới
                </Button>
              </Paper>
            </Fade>
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