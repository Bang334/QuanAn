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
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  DateRange,
  AttachMoney,
  Person
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

const IngredientPriceHistoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ingredient, setIngredient] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin nguyên liệu
        const ingredientData = await inventoryService.getIngredientById(id);
        setIngredient(ingredientData);
        
        // Lấy lịch sử giá
        const priceHistoryData = await inventoryService.getIngredientPriceHistory(id);
        console.log('Dữ liệu lịch sử giá:', priceHistoryData);
        setPriceHistory(priceHistoryData || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Dữ liệu cho biểu đồ
  const chartData = {
    labels: priceHistory.map(item => format(new Date(item.changeDate), 'dd/MM/yyyy', { locale: vi })),
    datasets: [
      {
        label: 'Giá nguyên liệu',
        data: priceHistory.map(item => item.newPrice),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
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
        text: 'Biến động giá nguyên liệu theo thời gian'
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('vi-VN') + 'đ';
          }
        }
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
          onClick={() => navigate('/admin/inventory')}
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
          onClick={() => navigate('/admin/inventory')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Lịch sử giá nguyên liệu
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
                      <Avatar
                        src={ingredient.imageUrl || ingredient.image}
                        alt={ingredient.name}
                        sx={{ width: 80, height: 80, mr: 2 }}
                        variant="rounded"
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          mr: 2,
                          bgcolor: 'primary.main'
                        }}
                        variant="rounded"
                      >
                        {ingredient.name.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        {ingredient.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Danh mục: {ingredient.category || 'Chưa phân loại'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đơn vị: {ingredient.unit}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Giá hiện tại: <strong>{new Intl.NumberFormat('vi-VN').format(ingredient.costPerUnit || 0)}đ</strong>
                    </Typography>
                    <Typography variant="body1">
                      Số lần thay đổi giá: <strong>{priceHistory.length}</strong>
                    </Typography>
                    {priceHistory.length > 0 && (
                      <Typography variant="body1">
                        Thay đổi gần nhất: <strong>{format(new Date(priceHistory[0].changeDate), 'dd/MM/yyyy HH:mm', { locale: vi })}</strong>
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {priceHistory.length > 0 ? (
            <>
              <Box mb={4}>
                <Typography variant="h5" component="h2" fontWeight="bold" mb={2}>
                  Biểu đồ biến động giá
                </Typography>
                <Paper sx={{ p: 3 }}>
                  <Line data={chartData} options={chartOptions} height={80} />
                </Paper>
              </Box>

              <Typography variant="h5" component="h2" fontWeight="bold" mb={2}>
                Chi tiết lịch sử giá
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ngày thay đổi</TableCell>
                      <TableCell align="right">Giá cũ</TableCell>
                      <TableCell align="right">Giá mới</TableCell>
                      <TableCell align="right">Chênh lệch</TableCell>
                      <TableCell>Lý do thay đổi</TableCell>
                      <TableCell>Người thay đổi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {priceHistory.map((record) => {
                      const priceDiff = record.newPrice - record.oldPrice;
                      const percentChange = record.oldPrice !== 0 
                        ? ((priceDiff / record.oldPrice) * 100).toFixed(2) 
                        : 'N/A';
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.changeDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('vi-VN').format(record.oldPrice)}đ
                          </TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('vi-VN').format(record.newPrice)}đ
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Chip
                                size="small"
                                label={`${priceDiff > 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN').format(priceDiff)}đ (${priceDiff > 0 ? '+' : ''}${percentChange}%)`}
                                color={priceDiff > 0 ? 'error' : priceDiff < 0 ? 'success' : 'default'}
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{record.changeReason || 'Không có lý do'}</TableCell>
                          <TableCell>
                            {record.priceChanger ? record.priceChanger.name || record.priceChanger.email : 'Không xác định'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Chưa có lịch sử thay đổi giá cho nguyên liệu này.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default IngredientPriceHistoryPage;
