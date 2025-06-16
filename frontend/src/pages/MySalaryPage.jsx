import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Alert, Chip, Card, CardContent,
  FormControl, Select, MenuItem, InputLabel, Divider, Grid,
  Dialog, DialogTitle, DialogContent, IconButton, Button
} from '@mui/material';
import { getMyAllSalaries, getCurrentMonthYear, getSalaryDailyDetails, getAllSalaryRates } from '../services/salaryService';
import { formatCurrency } from '../utils/formatters';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';

const MySalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(getCurrentMonthYear().year);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 means all months
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [salaryRates, setSalaryRates] = useState([]);
  const [isSalaryRateModalOpen, setIsSalaryRateModalOpen] = useState(false);
  
  const uniqueYears = [...new Set(salaries.map(salary => salary.year))];
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];
  
  // Hàm tính tổng lương
  const calculateTotalSalary = (salary) => {
    if (!salary) return 0;
    
    const hourlyPay = parseFloat(salary.totalHourlyPay) || 0;
    const bonus = parseFloat(salary.bonus) || 0;
    const deduction = parseFloat(salary.deduction) || 0;
    
    return hourlyPay + bonus - deduction;
  };
  
  // Lấy dữ liệu lương của nhân viên đang đăng nhập
  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        setLoading(true);
        const data = await getMyAllSalaries();
        setSalaries(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching salaries:', err);
        setError('Không thể tải dữ liệu lương. Vui lòng thử lại sau.');
        setSalaries([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSalaries();
  }, []);
  
  // Lọc lương theo năm và tháng đã chọn
  const filteredSalaries = salaries.filter(salary => {
    if (selectedYear && salary.year !== selectedYear) return false;
    if (selectedMonth && salary.month !== selectedMonth) return false;
    return true;
  });
  
  // Tính tổng lương đã nhận trong năm
  const totalPaidSalary = filteredSalaries
    .filter(salary => salary.status === 'paid')
    .reduce((sum, salary) => sum + calculateTotalSalary(salary), 0);
  
  // Tính tổng lương chưa nhận trong năm
  const totalPendingSalary = filteredSalaries
    .filter(salary => salary.status === 'pending')
    .reduce((sum, salary) => sum + calculateTotalSalary(salary), 0);
  
  // Lấy bản ghi lương của tháng hiện tại
  const currentMonthYear = getCurrentMonthYear();
  const currentMonthSalary = salaries.find(
    salary => salary.month === currentMonthYear.month && salary.year === currentMonthYear.year
  );

  // Lấy danh sách mức lương khi mở modal
  const handleOpenSalaryRateModal = async () => {
    try {
      // Lấy tất cả mức lương
      const rates = await getAllSalaryRates();
      console.log('SalaryRate data:', rates);
      setSalaryRates(rates);
      setIsSalaryRateModalOpen(true);
    } catch (err) {
      setSalaryRates([]);
      setIsSalaryRateModalOpen(true);
    }
  };

  // Lấy role hiện tại của user từ localStorage hoặc từ lương gần nhất có role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const myRole = user.role || (salaries.find(s => !!s.role)?.role) || null;

  // Hàm xử lý khi người dùng muốn xem chi tiết lương theo ngày
  const handleOpenDetailModal = async (salary) => {
    setSelectedSalary(salary);
    setOpenDetailModal(true);
    
    try {
      setLoadingDetails(true);
      const details = await getSalaryDailyDetails(salary.id);
      setSalaryDetails(details);
      console.log('SalaryPage chi tiết lương:', details);
    } catch (err) {
      console.error('Error fetching salary details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Đóng modal chi tiết
  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setSalaryDetails(null);
  };

  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Format time to display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Chip size="small" label="Có mặt" color="success" />;
      case 'absent':
        return <Chip size="small" label="Vắng mặt" color="error" />;
      case 'late':
        return <Chip size="small" label="Đi muộn" color="warning" />;
      default:
        return <Chip size="small" label={status || 'N/A'} />;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Thông tin lương của tôi
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Thông tin lương tháng hiện tại */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Lương tháng hiện tại ({currentMonthYear.month}/{currentMonthYear.year})
        </Typography>
        
        {currentMonthSalary ? (
          <Grid container spacing={3}>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Số giờ làm việc
                  </Typography>
                  <Typography variant="h5" component="div">
                    {parseFloat(currentMonthSalary.totalHours || 0).toFixed(2)} giờ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Lương theo giờ
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(currentMonthSalary.totalHourlyPay || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Số ngày làm việc
                  </Typography>
                  <Typography variant="h5" component="div">
                    {currentMonthSalary.workingDays || 0} ngày
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 6' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Thưởng
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'green' }}>
                    + {formatCurrency(currentMonthSalary.bonus || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 6' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Khấu trừ
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'red' }}>
                    - {formatCurrency(currentMonthSalary.deduction || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Tổng lương
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(calculateTotalSalary(currentMonthSalary))}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip 
                      label={currentMonthSalary.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                      color={currentMonthSalary.status === 'paid' ? 'success' : 'warning'}
                      size="small"
                    />
                    {currentMonthSalary.paidAt && (
                      <Typography variant="caption" color="text.secondary">
                        Thanh toán vào: {new Date(currentMonthSalary.paidAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                  <Box mt={2}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDetailModal(currentMonthSalary)}
                    >
                      Xem chi tiết ngày làm việc
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {currentMonthSalary.note && (
              <Grid sx={{ gridColumn: 'span 12' }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary">
                      Ghi chú
                    </Typography>
                    <Typography variant="body1">
                      {currentMonthSalary.note}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="info">
            Chưa có dữ liệu lương cho tháng hiện tại.
          </Alert>
        )}
      </Paper>
      
      {/* Thống kê lương theo năm */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Lịch sử lương
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpenSalaryRateModal}>
            Xem mức lương
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tháng</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              label="Tháng"
            >
              <MenuItem value={0}>Tất cả</MenuItem>
              {months.map(month => (
                <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
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
              {uniqueYears.length > 0 ? 
                uniqueYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                )) : 
                <MenuItem value={currentMonthYear.year}>{currentMonthYear.year}</MenuItem>
              }
            </Select>
          </FormControl>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Tổng lương đã nhận {selectedMonth ? `tháng ${selectedMonth}` : ''} năm {selectedYear}
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: 'success.main' }}>
                  {formatCurrency(totalPaidSalary)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Tổng lương chưa nhận {selectedMonth ? `tháng ${selectedMonth}` : ''} năm {selectedYear}
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: 'warning.main' }}>
                  {formatCurrency(totalPendingSalary)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Bảng lịch sử lương */}
        {filteredSalaries.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tháng/Năm</TableCell>
                  <TableCell align="right">Số giờ làm việc</TableCell>
                  <TableCell align="right">Lương theo giờ</TableCell>
                  <TableCell align="right">Thưởng</TableCell>
                  <TableCell align="right">Khấu trừ</TableCell>
                  <TableCell align="right">Tổng lương</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSalaries.map((salary) => (
                  <TableRow key={`${salary.month}-${salary.year}`}>
                    <TableCell>{salary.month}/{salary.year}</TableCell>
                    <TableCell align="right">{parseFloat(salary.totalHours || 0).toFixed(2)} giờ</TableCell>
                    <TableCell align="right">{formatCurrency(salary.totalHourlyPay || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(salary.bonus || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(salary.deduction || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(calculateTotalSalary(salary))}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={salary.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                        color={salary.status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenDetailModal(salary)}
                        title="Xem chi tiết"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Không có dữ liệu lương {selectedMonth ? `cho tháng ${selectedMonth}` : ''} năm {selectedYear}.
          </Alert>
        )}
      </Paper>

      {/* Modal chi tiết lương theo ngày */}
      <Dialog open={openDetailModal} onClose={handleCloseDetailModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Chi tiết lương tháng {selectedSalary?.month}/{selectedSalary?.year}
            </Typography>
            <IconButton aria-label="close" onClick={handleCloseDetailModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : !salaryDetails ? (
            <Typography color="error" align="center">Không thể tải chi tiết lương</Typography>
          ) : salaryDetails.dailyDetails ? (
            <>
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng số ngày làm việc
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {salaryDetails.dailyDetails.length} ngày
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng giờ làm việc
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {parseFloat(salaryDetails.salary.totalHours || 0).toFixed(2)} giờ
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng lương theo giờ
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(salaryDetails.salary.totalHourlyPay || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      <Chip 
                        label={salaryDetails.salary.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                        color={salaryDetails.salary.status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {salaryDetails.dailyDetails.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ngày</TableCell>
                        <TableCell align="center">Giờ vào</TableCell>
                        <TableCell align="center">Giờ ra</TableCell>
                        <TableCell align="center">Số giờ làm</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="center">Mức lương/giờ</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salaryDetails.dailyDetails.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell>{formatDate(detail.date)}</TableCell>
                          <TableCell align="center">
                            {detail.Attendance && formatTime(detail.Attendance.timeIn)}
                          </TableCell>
                          <TableCell align="center">
                            {detail.Attendance && formatTime(detail.Attendance.timeOut)}
                          </TableCell>
                          <TableCell align="center">
                            {detail.Attendance && parseFloat(detail.Attendance.hoursWorked || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            {detail.Attendance && getStatusBadge(detail.Attendance.status)}
                          </TableCell>
                          <TableCell align="center">
                            {detail.hourlyRate ? formatCurrency(detail.hourlyRate) : (detail.SalaryRate && detail.SalaryRate.hourlyRate ? formatCurrency(detail.SalaryRate.hourlyRate) : '0 đ')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(detail.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" align="center" py={3}>
                  Không có dữ liệu chi tiết cho tháng này.
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body1" align="center" py={3}>
              Không có dữ liệu
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal xem mức lương theo role */}
      <Dialog open={isSalaryRateModalOpen} onClose={() => setIsSalaryRateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Danh sách mức lương</DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vị trí</TableCell>
                  <TableCell>Ca làm việc</TableCell>
                  <TableCell>Ngày áp dụng</TableCell>
                  <TableCell>Lương cơ bản</TableCell>
                  <TableCell>Lương theo giờ</TableCell>
                  <TableCell>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaryRates.map(rate => (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.role === 'waiter' ? 'Phục vụ' : (rate.role === 'kitchen' ? 'Bếp' : rate.role)}</TableCell>
                    <TableCell>{(() => {
                      const shiftMap = {
                        morning: 'Sáng',
                        afternoon: 'Chiều',
                        evening: 'Tối',
                        night: 'Đêm',
                        full_day: 'Cả ngày',
                      };
                      return rate.shift ? (shiftMap[rate.shift] || rate.shift) : '---';
                    })()}</TableCell>
                    <TableCell>{new Date(rate.effectiveDate).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{formatCurrency(rate.baseSalary)}</TableCell>
                    <TableCell>{formatCurrency(rate.hourlyRate)}</TableCell>
                    <TableCell>
                      <Chip label={rate.isActive ? 'Đang áp dụng' : 'Không áp dụng'} color={rate.isActive ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MySalaryPage; 