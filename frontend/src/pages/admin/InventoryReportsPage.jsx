import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Tabs, Tab, Button, 
  TextField, Card, CardContent, CardHeader, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Alert, Snackbar, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, InputAdornment, Avatar
} from '@mui/material';
import { 
  Refresh, Search, Warning, TrendingUp, 
  Assessment, BarChart, PieChart, Timeline, DateRange
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as inventoryService from '../../services/inventoryService';
import { format, subDays, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const InventoryReportsPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Report data states
  const [summaryData, setSummaryData] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [purchaseCosts, setPurchaseCosts] = useState(null);
  const [supplierPerformance, setSupplierPerformance] = useState(null);
  
  // Fetch data on component mount and when date range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Calculate date range
        const endDate = new Date();
        let startDate;
        
        switch (dateRange) {
          case 'week':
            startDate = subDays(endDate, 7);
            break;
          case 'month':
            startDate = subMonths(endDate, 1);
            break;
          case 'quarter':
            startDate = subMonths(endDate, 3);
            break;
          case 'year':
            startDate = subMonths(endDate, 12);
            break;
          default:
            startDate = subMonths(endDate, 1);
        }
        
        const dateParams = {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        };
        
        // Fetch all report data
        const [summary, usage, costs, suppliers] = await Promise.all([
          inventoryService.getInventorySummary(),
          inventoryService.getIngredientUsageStats(dateParams),
          inventoryService.getPurchaseCostStats(dateParams),
          inventoryService.getSupplierPerformance(dateParams)
        ]);
        
        setSummaryData(summary);
        setUsageStats(usage);
        setPurchaseCosts(costs);
        setSupplierPerformance(suppliers);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu báo cáo');
        showSnackbar('Có lỗi xảy ra khi tải dữ liệu báo cáo', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle date range change
  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Render summary cards
  const renderSummaryCards = () => {
    if (!summaryData) return null;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng số nguyên liệu
              </Typography>
              <Typography variant="h4">
                {summaryData.totalIngredients}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Đang sử dụng: {summaryData.activeIngredients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Nguyên liệu sắp hết
              </Typography>
              <Typography variant="h4" color={summaryData.lowStockCount > 0 ? "error" : "inherit"}>
                {summaryData.lowStockCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Cần đặt hàng ngay
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Giá trị kho hiện tại
              </Typography>
              <Typography variant="h4">
                {summaryData.totalInventoryValue?.toLocaleString('vi-VN')}₫
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tính theo giá nhập
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đơn đặt hàng chờ duyệt
              </Typography>
              <Typography variant="h4">
                {summaryData.pendingPurchaseOrders}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Giá trị: {summaryData.pendingOrdersValue?.toLocaleString('vi-VN')}₫
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render usage stats chart
  const renderUsageStatsChart = () => {
    if (!usageStats || !usageStats.ingredients || usageStats.ingredients.length === 0) {
      return (
        <Alert severity="info">
          Không có dữ liệu sử dụng nguyên liệu trong khoảng thời gian đã chọn
        </Alert>
      );
    }
    
    // Sort by usage quantity
    const sortedIngredients = [...usageStats.ingredients]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10); // Top 10 ingredients
    
    return (
      <Box>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nguyên liệu</TableCell>
                <TableCell align="right">Số lượng đã sử dụng</TableCell>
                <TableCell align="right">Đơn vị</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedIngredients.map((ingredient) => (
                <TableRow key={ingredient.ingredientId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {ingredient.image ? (
                        <Avatar
                          src={ingredient.image}
                          alt={ingredient.name}
                          sx={{ width: 40, height: 40, mr: 2 }}
                          variant="rounded"
                        />
                      ) : (
                        <Avatar 
                          sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.light' }}
                          variant="rounded"
                        >
                          {ingredient.name.charAt(0)}
                        </Avatar>
                      )}
                      {ingredient.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{ingredient.totalQuantity}</TableCell>
                  <TableCell align="right">{ingredient.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ height: 400 }}>
          <Bar 
            data={{
              labels: sortedIngredients.map(item => item.name),
              datasets: [
                {
                  label: 'Số lượng sử dụng',
                  data: sortedIngredients.map(item => item.totalQuantity),
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                  borderColor: 'rgba(53, 162, 235, 1)',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Top 10 nguyên liệu được sử dụng nhiều nhất',
                },
              },
            }}
          />
        </Box>
      </Box>
    );
  };

  // Render purchase costs chart
  const renderPurchaseCostsChart = () => {
    if (!purchaseCosts || !purchaseCosts.monthlyData || purchaseCosts.monthlyData.length === 0) {
      return (
        <Alert severity="info">
          Không có dữ liệu chi phí mua nguyên liệu trong khoảng thời gian đã chọn
        </Alert>
      );
    }
    
    const chartData = {
      labels: purchaseCosts.monthlyData.map(item => item.month),
      datasets: [
        {
          label: 'Chi phí mua nguyên liệu',
          data: purchaseCosts.monthlyData.map(item => item.totalCost),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        },
      ],
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Chi phí mua nguyên liệu theo thời gian',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString('vi-VN') + '₫';
            }
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </Box>
    );
  };

  // Render supplier performance chart
  const renderSupplierPerformanceChart = () => {
    if (!supplierPerformance || !supplierPerformance.suppliers || supplierPerformance.suppliers.length === 0) {
      return (
        <Alert severity="info">
          Không có dữ liệu hiệu quả nhà cung cấp trong khoảng thời gian đã chọn
        </Alert>
      );
    }
    
    // Table view for supplier performance
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nhà cung cấp</TableCell>
              <TableCell align="right">Số đơn hàng</TableCell>
              <TableCell align="right">Tổng chi phí</TableCell>
              <TableCell align="right">Tỷ lệ giao hàng đúng hạn</TableCell>
              <TableCell align="right">Tỷ lệ chất lượng đạt yêu cầu</TableCell>
              <TableCell align="center">Đánh giá</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supplierPerformance.suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.name}</TableCell>
                <TableCell align="right">{supplier.orderCount}</TableCell>
                <TableCell align="right">{supplier.totalSpent.toLocaleString('vi-VN')}₫</TableCell>
                <TableCell align="right">{(supplier.onTimeDeliveryRate * 100).toFixed(1)}%</TableCell>
                <TableCell align="right">{(supplier.qualityRate * 100).toFixed(1)}%</TableCell>
                <TableCell align="center">
                  <Rating value={supplier.rating} readOnly precision={0.5} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render low stock ingredients table
  const renderLowStockTable = () => {
    if (!summaryData || !summaryData.lowStockIngredients || summaryData.lowStockIngredients.length === 0) {
      return (
        <Alert severity="success">
          Không có nguyên liệu nào dưới ngưỡng cảnh báo
        </Alert>
      );
    }
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nguyên liệu</TableCell>
              <TableCell align="right">Số lượng hiện tại</TableCell>
              <TableCell align="right">Ngưỡng cảnh báo</TableCell>
              <TableCell align="right">Cần đặt thêm</TableCell>
              <TableCell align="right">Giá đơn vị</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.lowStockIngredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {ingredient.image ? (
                      <Avatar
                        src={ingredient.image}
                        alt={ingredient.name}
                        sx={{ width: 40, height: 40, mr: 2 }}
                        variant="rounded"
                      />
                    ) : (
                      <Avatar 
                        sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.light' }}
                        variant="rounded"
                      >
                        {ingredient.name.charAt(0)}
                      </Avatar>
                    )}
                    {ingredient.name}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography color="error">
                    {ingredient.currentQuantity} {ingredient.unit}
                  </Typography>
                </TableCell>
                <TableCell align="right">{ingredient.alertThreshold} {ingredient.unit}</TableCell>
                <TableCell align="right">{(ingredient.alertThreshold * 2 - ingredient.currentQuantity).toFixed(2)} {ingredient.unit}</TableCell>
                <TableCell align="right">{ingredient.unitPrice?.toLocaleString('vi-VN')}₫</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Mock Rating component (since it's not imported)
  const Rating = ({ value, readOnly, precision }) => {
    // Simple implementation for display purposes
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const starColor = i <= value ? 'gold' : 'lightgray';
      stars.push(
        <span key={i} style={{ color: starColor, fontSize: '1.2rem' }}>★</span>
      );
    }
    return <div>{stars}</div>;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Báo cáo kho
        </Typography>
        <Box>
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={dateRange}
              onChange={handleDateRangeChange}
              label="Khoảng thời gian"
            >
              <MenuItem value="week">7 ngày qua</MenuItem>
              <MenuItem value="month">30 ngày qua</MenuItem>
              <MenuItem value="quarter">3 tháng qua</MenuItem>
              <MenuItem value="year">12 tháng qua</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => setDateRange(dateRange)} // Trigger re-fetch
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Box sx={{ mb: 4 }}>
            {renderSummaryCards()}
          </Box>

          {/* Tabs for different reports */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable" 
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<Warning />} iconPosition="start" label="Nguyên liệu sắp hết" />
              <Tab icon={<BarChart />} iconPosition="start" label="Sử dụng nguyên liệu" />
              <Tab icon={<Timeline />} iconPosition="start" label="Chi phí mua nguyên liệu" />
              <Tab icon={<Assessment />} iconPosition="start" label="Hiệu quả nhà cung cấp" />
            </Tabs>
          </Paper>

          {/* Tab content */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {tabValue === 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Nguyên liệu dưới ngưỡng cảnh báo
                </Typography>
                {renderLowStockTable()}
              </>
            )}
            
            {tabValue === 1 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Thống kê sử dụng nguyên liệu
                </Typography>
                {renderUsageStatsChart()}
              </>
            )}
            
            {tabValue === 2 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Chi phí mua nguyên liệu theo thời gian
                </Typography>
                {renderPurchaseCostsChart()}
              </>
            )}
            
            {tabValue === 3 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Đánh giá hiệu quả nhà cung cấp
                </Typography>
                {renderSupplierPerformanceChart()}
              </>
            )}
          </Paper>
        </>
      )}

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

export default InventoryReportsPage;