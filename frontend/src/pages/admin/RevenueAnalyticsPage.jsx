import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { FaChartLine, FaChartBar, FaChartPie, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const RevenueAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [period, setPeriod] = useState('daily');
  
  // Data states
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topItemsData, setTopItemsData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    comparedToLastPeriod: 0
  });

  useEffect(() => {
    fetchData();
  }, [dateRange, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data
      await Promise.all([
        fetchDashboardData(),
        fetchCategoryRevenue(),
        fetchTopSellingItems(),
        fetchPaymentMethodStats()
      ]);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics data. Please try again later.');
      setLoading(false);
      console.error('Error fetching analytics data:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const data = await paymentService.getAnalyticsDashboard(
        period, 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      setRevenueData(data.revenueByPeriod.map(item => ({
        name: item.period,
        revenue: parseFloat(item.revenue),
        orderCount: parseInt(item.orderCount)
      })));
      
      setSummary({
        totalRevenue: data.summary.totalRevenue,
        totalOrders: data.summary.totalOrders,
        averageOrderValue: data.summary.averageOrderValue,
        comparedToLastPeriod: data.summary.comparedToLastPeriod
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      throw err;
    }
  };

  const fetchCategoryRevenue = async () => {
    try {
      const data = await paymentService.getCategoryRevenue(
        dateRange.startDate,
        dateRange.endDate
      );
      setCategoryData(data);
    } catch (err) {
      console.error('Error fetching category revenue:', err);
      throw err;
    }
  };

  const fetchTopSellingItems = async () => {
    try {
      const data = await paymentService.getTopSellingItems(
        10,
        dateRange.startDate,
        dateRange.endDate
      );
      setTopItemsData(data);
    } catch (err) {
      console.error('Error fetching top selling items:', err);
      throw err;
    }
  };

  const fetchPaymentMethodStats = async () => {
    try {
      const data = await paymentService.getPaymentMethodStats(
        dateRange.startDate,
        dateRange.endDate
      );
      
      // Transform data for pie chart
      const transformedData = data.map(item => ({
        name: item.paymentMethod === 'cash' ? 'Tiền mặt' :
              item.paymentMethod === 'card' ? 'Thẻ tín dụng' :
              item.paymentMethod === 'momo' ? 'MoMo' :
              item.paymentMethod === 'zalopay' ? 'ZaloPay' :
              item.paymentMethod === 'vnpay' ? 'VNPay' : item.paymentMethod,
        value: parseFloat(item.totalAmount)
      }));
      
      setPaymentMethodData(transformedData);
    } catch (err) {
      console.error('Error fetching payment method stats:', err);
      throw err;
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleExportData = () => {
    // This would export data to CSV or PDF
    alert('Export functionality would be implemented here');
  };

  // Predefined date ranges
  const handlePresetRange = (range) => {
    const today = new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(today);
        quarterStart.setMonth(Math.floor(today.getMonth() / 3) * 3);
        quarterStart.setDate(1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today);
        yearStart.setMonth(0);
        yearStart.setDate(1);
        startDate = yearStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }
    
    setDateRange({ startDate, endDate });
    
    // Adjust period based on range
    if (range === 'year') {
      setPeriod('monthly');
    } else if (range === 'quarter' || range === 'month') {
      setPeriod('daily');
    }
  };

  const formatChartData = (value) => {
    return formatCurrency(value);
  };

  const renderSummaryCards = () => {
    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="text-muted">Tổng doanh thu</Card.Title>
              <h3 className="mb-0">{formatCurrency(summary.totalRevenue)}</h3>
              <small className={`text-${summary.comparedToLastPeriod >= 0 ? 'success' : 'danger'}`}>
                {summary.comparedToLastPeriod >= 0 ? '↑' : '↓'} {Math.abs(summary.comparedToLastPeriod).toFixed(1)}% so với kỳ trước
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="text-muted">Tổng đơn hàng</Card.Title>
              <h3 className="mb-0">{formatNumber(summary.totalOrders)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="text-muted">Giá trị trung bình</Card.Title>
              <h3 className="mb-0">{formatCurrency(summary.averageOrderValue)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="text-muted">Tỷ lệ hoàn thành</Card.Title>
              <h3 className="mb-0">98.2%</h3>
              <small className="text-success">↑ 1.2% so với kỳ trước</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderRevenueChart = () => {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FaChartLine className="me-2" />
            Biểu đồ doanh thu
          </div>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={revenueData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatChartData} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Doanh thu"
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };

  const renderCategoryChart = () => {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FaChartBar className="me-2" />
            Doanh thu theo danh mục
          </div>
        </Card.Header>
        <Card.Body>
          {categoryData && categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={formatChartData} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar 
                  dataKey="totalRevenue" 
                  name="Doanh thu"
                  fill="#82ca9d" 
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <p className="text-muted">Không có dữ liệu doanh thu theo danh mục</p>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderPaymentMethodChart = () => {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FaChartPie className="me-2" />
            Phương thức thanh toán
          </div>
        </Card.Header>
        <Card.Body>
          {paymentMethodData && paymentMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <p className="text-muted">Không có dữ liệu về phương thức thanh toán</p>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderTopItemsChart = () => {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FaChartBar className="me-2" />
            Top 10 món ăn bán chạy
          </div>
        </Card.Header>
        <Card.Body>
          {topItemsData && topItemsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topItemsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatChartData} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar 
                  dataKey="totalRevenue" 
                  name="Doanh thu"
                  fill="#8884d8" 
                >
                  {topItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <p className="text-muted">Không có dữ liệu về món ăn bán chạy</p>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Phân Tích Doanh Thu</h1>
      
      {/* Filters and controls */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Từ ngày</Form.Label>
                <Form.Control 
                  type="date" 
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Đến ngày</Form.Label>
                <Form.Control 
                  type="date" 
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Thời kỳ</Form.Label>
                <Form.Select 
                  value={period}
                  onChange={handlePeriodChange}
                >
                  <option value="daily">Theo ngày</option>
                  <option value="monthly">Theo tháng</option>
                  <option value="yearly">Theo năm</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end mb-3">
              <Button 
                variant="primary" 
                className="w-100"
                onClick={fetchData}
              >
                Áp dụng
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('today')}>
                  <FaCalendarAlt className="me-1" /> Hôm nay
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('yesterday')}>
                  <FaCalendarAlt className="me-1" /> Hôm qua
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('week')}>
                  <FaCalendarAlt className="me-1" /> 7 ngày
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('month')}>
                  <FaCalendarAlt className="me-1" /> Tháng này
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('quarter')}>
                  <FaCalendarAlt className="me-1" /> Quý này
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('year')}>
                  <FaCalendarAlt className="me-1" /> Năm nay
                </Button>
              </div>
            </Col>
            <Col xs="auto">
              <Button variant="success" size="sm" onClick={handleExportData}>
                <FaDownload className="me-1" /> Xuất dữ liệu
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Loading and error states */}
      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      )}
      
      {error && (
        <Alert variant="danger" className="my-3">
          {error}
        </Alert>
      )}
      
      {/* Content */}
      {!loading && !error && (
        <>
          {renderSummaryCards()}
          
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4"
          >
            <Tab eventKey="overview" title="Tổng quan">
              {renderRevenueChart()}
              <Row>
                <Col md={6}>
                  {renderCategoryChart()}
                </Col>
                <Col md={6}>
                  {renderPaymentMethodChart()}
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="revenue" title="Doanh thu">
              {renderRevenueChart()}
            </Tab>
            <Tab eventKey="products" title="Sản phẩm">
              {renderTopItemsChart()}
            </Tab>
            <Tab eventKey="payments" title="Thanh toán">
              {renderPaymentMethodChart()}
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
};

export default RevenueAnalyticsPage; 