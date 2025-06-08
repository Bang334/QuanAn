import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Alert, Chip, Grid, Card, CardContent,
  FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import { getMyAllSalaries, calculateTotalSalary, getCurrentMonthYear } from '../services/salaryService';
import { formatCurrency } from '../utils/formatters';

const MySalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(getCurrentMonthYear().year);
  
  const uniqueYears = [...new Set(salaries.map(salary => salary.year))];
  
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
  
  // Lọc lương theo năm đã chọn
  const filteredSalaries = salaries.filter(salary => salary.year === selectedYear);
  
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Thông tin lương của tôi
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Thông tin lương tháng hiện tại */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Lương tháng hiện tại ({currentMonthYear.month}/{currentMonthYear.year})
        </Typography>
        
        {currentMonthSalary ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Lương cơ bản
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(currentMonthSalary.baseSalary)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Thưởng
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(currentMonthSalary.bonus)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Khấu trừ
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(currentMonthSalary.deduction)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Số ngày làm việc
                  </Typography>
                  <Typography variant="h5" component="div">
                    {currentMonthSalary.workingDays} ngày
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    Tổng lương
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(calculateTotalSalary(currentMonthSalary))}
                  </Typography>
                  <Chip 
                    label={currentMonthSalary.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                    color={currentMonthSalary.status === 'paid' ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            {currentMonthSalary.note && (
              <Grid size={{ xs: 12 }}>
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
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Năm</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              label="Năm"
            >
              {uniqueYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Tổng lương đã nhận trong năm {selectedYear}
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(totalPaidSalary)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Tổng lương chưa nhận trong năm {selectedYear}
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(totalPendingSalary)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Bảng lịch sử lương */}
        {filteredSalaries.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tháng/Năm</TableCell>
                  <TableCell align="right">Lương cơ bản</TableCell>
                  <TableCell align="right">Thưởng</TableCell>
                  <TableCell align="right">Khấu trừ</TableCell>
                  <TableCell align="right">Ngày làm việc</TableCell>
                  <TableCell align="right">Tổng lương</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSalaries.map((salary) => (
                  <TableRow key={`${salary.month}-${salary.year}`}>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Không có dữ liệu lương cho năm {selectedYear}.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default MySalaryPage; 