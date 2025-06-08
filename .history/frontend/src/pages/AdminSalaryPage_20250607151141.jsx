import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Chip, Grid, Card, CardContent,
  FormControl, Select, MenuItem, InputLabel, Button, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Tabs, Tab, Tooltip
} from '@mui/material';
import { 
  getAllSalaries, createOrUpdateSalary, markSalaryAsPaid, 
  deleteSalary, batchCreateSalaries, calculateTotalSalary, 
  getCurrentMonthYear 
} from '../services/salaryService';
import { formatCurrency, formatDate } from '../utils/formatters';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const AdminSalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear().month);
  const [selectedYear, setSelectedYear] = useState(getCurrentMonthYear().year);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openBatchDialog, setOpenBatchDialog] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    month: getCurrentMonthYear().month,
    year: getCurrentMonthYear().year,
    baseSalary: 0,
    bonus: 0,
    deduction: 0,
    workingDays: 0,
    note: ''
  });
  
  // Batch form state
  const [batchFormData, setbatchFormData] = useState({
    month: getCurrentMonthYear().month,
    year: getCurrentMonthYear().year,
    defaultBaseSalary: 0,
    defaultWorkingDays: 0
  });

  // Lấy dữ liệu lương
  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth, selectedYear, selectedStatus]);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const filters = {
        month: selectedMonth !== 'all' ? selectedMonth : undefined,
        year: selectedYear,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      
      const data = await getAllSalaries(filters);
      setSalaries(data);
    } catch (err) {
      console.error('Error fetching salaries:', err);
      setError('Không thể tải dữ liệu lương. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'userId' ? value : 
        ['baseSalary', 'bonus', 'deduction', 'workingDays'].includes(name) ? 
        parseFloat(value) : value
    });
  };

  // Xử lý thay đổi form batch
  const handleBatchFormChange = (e) => {
    const { name, value } = e.target;
    setbatchFormData({
      ...batchFormData,
      [name]: ['defaultBaseSalary', 'defaultWorkingDays'].includes(name) ? 
        parseFloat(value) : value
    });
  };

  // Mở dialog tạo mới
  const handleOpenCreateDialog = () => {
    setEditingSalary(null);
    setFormData({
      userId: '',
      month: getCurrentMonthYear().month,
      year: getCurrentMonthYear().year,
      baseSalary: 0,
      bonus: 0,
      deduction: 0,
      workingDays: 0,
      note: ''
    });
    setOpenDialog(true);
  };

  // Mở dialog chỉnh sửa
  const handleOpenEditDialog = (salary) => {
    setEditingSalary(salary);
    setFormData({
      userId: salary.userId,
      month: salary.month,
      year: salary.year,
      baseSalary: parseFloat(salary.baseSalary),
      bonus: parseFloat(salary.bonus),
      deduction: parseFloat(salary.deduction),
      workingDays: salary.workingDays,
      note: salary.note || ''
    });
    setOpenDialog(true);
  };

  // Mở dialog tạo hàng loạt
  const handleOpenBatchDialog = () => {
    setOpenBatchDialog(true);
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrUpdateSalary(formData);
      setOpenDialog(false);
      setSuccess(editingSalary ? 'Cập nhật lương thành công!' : 'Tạo bản ghi lương thành công!');
      fetchSalaries();
      
      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving salary:', err);
      setError('Có lỗi xảy ra khi lưu dữ liệu lương.');
    }
  };

  // Xử lý submit form batch
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      await batchCreateSalaries(batchFormData);
      setOpenBatchDialog(false);
      setSuccess('Tạo bản ghi lương hàng loạt thành công!');
      fetchSalaries();
      
      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error batch creating salaries:', err);
      setError('Có lỗi xảy ra khi tạo lương hàng loạt.');
    }
  };

  // Xử lý thanh toán lương
  const handlePaySalary = async (salaryId) => {
    try {
      await markSalaryAsPaid(salaryId);
      setSuccess('Đánh dấu lương đã thanh toán thành công!');
      fetchSalaries();
      
      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error marking salary as paid:', err);
      setError('Có lỗi xảy ra khi đánh dấu lương đã thanh toán.');
    }
  };

  // Xử lý xóa bản ghi lương
  const handleDeleteSalary = async (salaryId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi lương này?')) {
      try {
        await deleteSalary(salaryId);
        setSuccess('Xóa bản ghi lương thành công!');
        fetchSalaries();
        
        // Xóa thông báo thành công sau 3 giây
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } catch (err) {
        console.error('Error deleting salary:', err);
        setError('Có lỗi xảy ra khi xóa bản ghi lương.');
      }
    }
  };

  // Tính tổng lương đã thanh toán
  const totalPaidAmount = salaries
    .filter(salary => salary.status === 'paid')
    .reduce((sum, salary) => sum + calculateTotalSalary(salary), 0);

  // Tính tổng lương chưa thanh toán
  const totalPendingAmount = salaries
    .filter(salary => salary.status === 'pending')
    .reduce((sum, salary) => sum + calculateTotalSalary(salary), 0);

  // Xử lý thay đổi tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedStatus(newValue === 0 ? 'all' : newValue === 1 ? 'pending' : 'paid');
  };

  if (loading && salaries.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Quản lý lương nhân viên
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<GroupAddIcon />}
            onClick={handleOpenBatchDialog}
            sx={{ mr: 2 }}
          >
            Tạo lương hàng loạt
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Thêm bản ghi lương
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Thống kê */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Tổng lương đã thanh toán
              </Typography>
              <Typography variant="h5" component="div">
                {formatCurrency(totalPaidAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Tổng lương chưa thanh toán
              </Typography>
              <Typography variant="h5" component="div">
                {formatCurrency(totalPendingAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Bộ lọc và tabs */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Tất cả" />
            <Tab label="Chưa thanh toán" />
            <Tab label="Đã thanh toán" />
          </Tabs>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tháng</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              label="Tháng"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Năm</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              label="Năm"
            >
              {Array.from({ length: 5 }, (_, i) => getCurrentMonthYear().year - i).map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Bảng dữ liệu lương */}
        {salaries.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell>Tháng/Năm</TableCell>
                  <TableCell align="right">Lương cơ bản</TableCell>
                  <TableCell align="right">Thưởng</TableCell>
                  <TableCell align="right">Khấu trừ</TableCell>
                  <TableCell align="right">Ngày làm việc</TableCell>
                  <TableCell align="right">Tổng lương</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>{salary.User?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={salary.User?.role === 'waiter' ? 'Phục vụ' : 
                               salary.User?.role === 'kitchen' ? 'Nhà bếp' : 
                               salary.User?.role || 'N/A'}
                        size="small"
                        color={salary.User?.role === 'waiter' ? 'primary' : 
                               salary.User?.role === 'kitchen' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{salary.month}/{salary.year}</TableCell>
                    <TableCell align="right">{formatCurrency(salary.baseSalary)}</TableCell>
                    <TableCell align="right">{formatCurrency(salary.bonus)}</TableCell>
                    <TableCell align="right">{formatCurrency(salary.deduction)}</TableCell>
                    <TableCell align="right">{salary.workingDays} ngày</TableCell>
                    <TableCell align="right">{formatCurrency(calculateTotalSalary(salary))}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={salary.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                        color={salary.status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                      {salary.status === 'paid' && salary.paidDate && (
                        <Typography variant="caption" display="block">
                          {formatDate(salary.paidDate)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenEditDialog(salary)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {salary.status === 'pending' && (
                          <Tooltip title="Đánh dấu đã thanh toán">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handlePaySalary(salary.id)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Xóa">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteSalary(salary.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Không có dữ liệu lương phù hợp với bộ lọc.
          </Alert>
        )}
      </Paper>
      
      {/* Dialog tạo/chỉnh sửa lương */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSalary ? 'Chỉnh sửa thông tin lương' : 'Thêm bản ghi lương mới'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ID Nhân viên"
                  name="userId"
                  value={formData.userId}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  disabled={editingSalary}
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lương cơ bản"
                  name="baseSalary"
                  value={formData.baseSalary}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tháng"
                  name="month"
                  value={formData.month}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                  disabled={editingSalary}
                  InputProps={{ inputProps: { min: 1, max: 12 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Năm"
                  name="year"
                  value={formData.year}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                  disabled={editingSalary}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Thưởng"
                  name="bonus"
                  value={formData.bonus}
                  onChange={handleFormChange}
                  fullWidth
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Khấu trừ"
                  name="deduction"
                  value={formData.deduction}
                  onChange={handleFormChange}
                  fullWidth
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Số ngày làm việc"
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ghi chú"
                  name="note"
                  value={formData.note}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button type="submit" variant="contained">Lưu</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Dialog tạo lương hàng loạt */}
      <Dialog open={openBatchDialog} onClose={() => setOpenBatchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Tạo lương hàng loạt cho nhân viên
        </DialogTitle>
        <form onSubmit={handleBatchSubmit}>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Tính năng này sẽ tạo bản ghi lương cho tất cả nhân viên phục vụ và nhà bếp.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tháng"
                  name="month"
                  value={batchFormData.month}
                  onChange={handleBatchFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                  InputProps={{ inputProps: { min: 1, max: 12 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Năm"
                  name="year"
                  value={batchFormData.year}
                  onChange={handleBatchFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lương cơ bản mặc định"
                  name="defaultBaseSalary"
                  value={batchFormData.defaultBaseSalary}
                  onChange={handleBatchFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Số ngày làm việc mặc định"
                  name="defaultWorkingDays"
                  value={batchFormData.defaultWorkingDays}
                  onChange={handleBatchFormChange}
                  fullWidth
                  required
                  type="number"
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBatchDialog(false)}>Hủy</Button>
            <Button type="submit" variant="contained">Tạo</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminSalaryPage; 