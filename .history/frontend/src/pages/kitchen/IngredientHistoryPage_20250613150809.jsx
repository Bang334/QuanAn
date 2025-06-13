import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  DateRange,
  Info,
  LocalShipping,
  Restaurant,
  Settings,
  Delete,
  Warning,
  History
} from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Colors
} from 'chart.js';
import * as inventoryService from '../../services/inventoryService';

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Colors
);

export const IngredientHistoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ingredient, setIngredient] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin nguyên liệu
        const ingredientData = await inventoryService.getIngredientById(id);
        setIngredient(ingredientData);
        
        // Lấy lịch sử biến động tồn kho
        const historyData = await inventoryService.getIngredientStockHistory(id, { period });
        setStockHistory(historyData.stockHistory || []);
        
        // Lấy lịch sử giao dịch
        const transactionData = await inventoryService.getIngredientTransactions(id);
        setTransactions(transactionData || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, period]);
  
  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };
  
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'purchase': return 'success';
      case 'usage': return 'error';
      case 'adjustment': return 'warning';
      case 'waste': return 'secondary';
      case 'return': return 'info';
      default: return 'default';
    }
  };
  
  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'purchase': return 'Nhập hàng';
      case 'usage': return 'Sử dụng';
      case 'adjustment': return 'Điều chỉnh';
      case 'waste': return 'Hủy bỏ';
      case 'return': return 'Trả lại';
      default: return type;
    }
  };
  
  // Dữ liệu cho biểu đồ
  const chartData = {
    labels: stockHistory.map(item => item.date),
    datasets: [
      {
        label: 'Nhập kho',
        data: stockHistory.map(item => item.inflow),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Xuất kho',
        data: stockHistory.map(item => item.outflow),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      },
      {
        label: 'Thay đổi ròng',
        data: stockHistory.map(item => item.netChange),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Biến động tồn kho theo thời gian'
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/kitchen/inventory')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/kitchen/inventory')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Lịch sử nguyên liệu
        </Typography>
      </Box>
      
      {ingredient && (
        <>
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center">
                    {ingredient.imageUrl || ingredient.image ? (
                      <Box
                        component="img"
                        src={ingredient.imageUrl || ingredient.image}
                        alt={ingredient.name}
                        sx={{ width: 80, height: 80, borderRadius: 2, mr: 2, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          mr: 2,
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '2rem'
                        }}
                      >
                        {ingredient.name.charAt(0)}
                      </Box>
                    )}
                    <Box>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        {ingredient.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Danh mục: {ingredient.category || 'Chưa phân loại'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Số lượng hiện tại
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {ingredient.currentStock} {ingredient.unit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngưỡng cảnh báo
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {ingredient.minStockLevel} {ingredient.unit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Đơn giá
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {new Intl.NumberFormat('vi-VN').format(ingredient.costPerUnit || 0)}đ
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tổng giá trị
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {new Intl.NumberFormat('vi-VN').format((ingredient.currentStock || 0) * (ingredient.costPerUnit || 0))}đ
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2" fontWeight="bold">
                Biểu đồ biến động tồn kho
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select
                  value={period}
                  onChange={handlePeriodChange}
                  label="Khoảng thời gian"
                >
                  <MenuItem value="daily">Theo ngày</MenuItem>
                  <MenuItem value="weekly">Theo tuần</MenuItem>
                  <MenuItem value="monthly">Theo tháng</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Paper sx={{ p: 3 }}>
              {stockHistory.length > 0 ? (
                <Line data={chartData} options={chartOptions} height={80} />
              ) : (
                <Alert severity="info">
                  Không có dữ liệu biến động tồn kho cho nguyên liệu này.
                </Alert>
              )}
            </Paper>
          </Box>

          <Typography variant="h5" component="h2" fontWeight="bold" mb={2}>
            Lịch sử giao dịch
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Loại giao dịch</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell align="right">Đơn giá</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell align="right">Số lượng trước</TableCell>
                  <TableCell align="right">Số lượng sau</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.transactionDate || transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTransactionTypeText(transaction.type)}
                          color={getTransactionTypeColor(transaction.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} {ingredient.unit}
                      </TableCell>
                      <TableCell align="right">
                        {transaction.unitPrice ? `${new Intl.NumberFormat('vi-VN').format(transaction.unitPrice)}đ` : '-'}
                      </TableCell>
                      <TableCell>{transaction.notes || '-'}</TableCell>
                      <TableCell align="right">{transaction.previousQuantity} {ingredient.unit}</TableCell>
                      <TableCell align="right">{transaction.newQuantity} {ingredient.unit}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Không có dữ liệu giao dịch cho nguyên liệu này.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

// Default export is removed as we're using named export