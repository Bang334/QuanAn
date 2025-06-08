import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  TableBar as TableBarIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeUsers: 0,
    availableTables: 0,
    totalTables: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [salaryStats, setSalaryStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    avgSalary: 0,
    employeeCount: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Lấy thống kê từ API
        const statsResponse = await axios.get(`${API_URL}/api/orders/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Lấy đơn hàng gần đây
        const ordersResponse = await axios.get(`${API_URL}/api/orders?limit=5`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Lấy dữ liệu lương
        const salaryResponse = await axios.get(`${API_URL}/api/salaries/admin`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Xử lý dữ liệu lương
        const salaries = salaryResponse.data;
        const totalPaid = salaries
          .filter(salary => salary.status === 'paid')
          .reduce((sum, salary) => sum + parseFloat(salary.baseSalary) + parseFloat(salary.bonus) - parseFloat(salary.deduction), 0);
        
        const totalPending = salaries
          .filter(salary => salary.status === 'pending')
          .reduce((sum, salary) => sum + parseFloat(salary.baseSalary) + parseFloat(salary.bonus) - parseFloat(salary.deduction), 0);
        
        // Tính số lượng nhân viên duy nhất
        const uniqueEmployees = [...new Set(salaries.map(salary => salary.userId))];
        const employeeCount = uniqueEmployees.length;
        
        // Tính lương trung bình
        const avgSalary = employeeCount > 0 
          ? (totalPaid + totalPending) / employeeCount 
          : 0;
        
        setSalaryStats({
          totalPaid,
          totalPending,
          avgSalary,
          employeeCount,
        });
        
        // Tạo dữ liệu biểu đồ doanh thu
        // Nhóm đơn hàng theo ngày trong 7 ngày gần đây
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();
        
        // Lấy dữ liệu đơn hàng trong 7 ngày gần đây
        const revenueByDay = {};
        last7Days.forEach(day => {
          revenueByDay[day] = 0;
        });
        
        // Tính tổng doanh thu theo ngày
        ordersResponse.data.forEach(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          if (revenueByDay[orderDate] !== undefined && order.paymentStatus === 'paid') {
            revenueByDay[orderDate] += parseFloat(order.totalAmount);
          }
        });
        
        // Chuyển đổi dữ liệu cho biểu đồ
        const chartData = Object.keys(revenueByDay).map(date => ({
          date: date.slice(5), // Chỉ hiển thị MM-DD
          revenue: revenueByDay[date]
        }));
        
        setRevenueData(chartData);
        setStats(statsResponse.data);
        
        // Format dữ liệu đơn hàng để hiển thị
        const formattedOrders = ordersResponse.data.map(order => ({
          id: order.id,
          tableId: order.tableId,
          status: order.status,
          total: order.totalAmount,
          items: order.OrderItems.length,
          time: new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }));
        
        setRecentOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setStats({
          totalOrders: 0,
          todayOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          activeUsers: 0,
          availableTables: 0,
          totalTables: 0,
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'preparing': return 'warning.main';
      case 'ready': return 'info.main';
      case 'served': return 'success.main';
      case 'completed': return 'success.main';
      case 'cancelled': return 'error.main';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'served': return 'Đã phục vụ';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };
  
  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
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
      <Typography variant="h4" gutterBottom>
        Bảng điều khiển
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.totalOrders}</Typography>
                <Typography variant="body2" color="text.secondary">Tổng đơn hàng</Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
              +{stats.todayOrders} hôm nay
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RestaurantIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{formatPrice(stats.totalRevenue)}</Typography>
                <Typography variant="body2" color="text.secondary">Tổng doanh thu</Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
              +{formatPrice(stats.todayRevenue)} hôm nay
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.activeUsers}</Typography>
                <Typography variant="body2" color="text.secondary">Nhân viên hoạt động</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TableBarIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.availableTables}/{stats.totalTables}</Typography>
                <Typography variant="body2" color="text.secondary">Bàn trống</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Thống kê lương */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Thống kê lương nhân viên
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{formatPrice(salaryStats.totalPaid)}</Typography>
                <Typography variant="body2" color="text.secondary">Lương đã thanh toán</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{formatPrice(salaryStats.totalPending)}</Typography>
                <Typography variant="body2" color="text.secondary">Lương chưa thanh toán</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{formatPrice(salaryStats.avgSalary)}</Typography>
                <Typography variant="body2" color="text.secondary">Lương trung bình</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{salaryStats.employeeCount}</Typography>
                <Typography variant="body2" color="text.secondary">Số nhân viên</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Đơn hàng gần đây" />
            <Divider />
            <CardContent>
              <List>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <Box key={order.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" aria-label="view" onClick={() => handleViewOrder(order.id)}>
                            <VisibilityIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`Đơn #${order.id} - Bàn ${order.tableId}`}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" component="span">
                                {order.items} món - {formatPrice(order.total)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                component="span" 
                                sx={{ color: getStatusColor(order.status) }}
                              >
                                {getStatusText(order.status)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                    Không có đơn hàng gần đây
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Thống kê doanh thu" />
            <Divider />
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Không có dữ liệu doanh thu
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage; 