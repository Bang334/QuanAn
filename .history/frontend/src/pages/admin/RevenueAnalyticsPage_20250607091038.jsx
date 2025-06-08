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
        fetchRevenueStats(),
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

  const fetchRevenueStats = async () => {
    try {
      const data = await paymentService.getRevenueStats(
        period, 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      setRevenueData(data.revenueByPeriod);
      
      // Calculate summary
      const totalRevenue = data.revenueByPeriod.reduce((sum, item) => sum + item.revenue, 0);
      const totalOrders = data.revenueByPeriod.reduce((sum, item) => sum + item.orderCount, 0);
      
      setSummary({
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        comparedToLastPeriod: data.comparedToLastPeriod || 0
      });
    } catch (err) {
      console.error('Error fetching revenue stats:', err);
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
    // This would normally come from the backend
    // For now we'll generate sample data
    // In a real app, you would add this endpoint to the backend
    
    // Sample data
    const methods = [
      { name: 'Cash', value: 65 },
      { name: 'Credit Card', value: 20 },
      { name: 'MoMo', value: 8 },
      { name: 'ZaloPay', value: 5 },
      { name: 'VNPay', value: 2 }
    ];
    
    setPaymentMethodData(methods);
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
    if (range === 'today' || range === 'yesterday') {
      setPeriod('hourly');
    } else if (range === 'week' || range === 'month') {
      setPeriod('daily');
    } else {
      setPeriod('monthly');
    }
  };

  const formatChartData = (value) => {
    return formatCurrency(value);
  };

  const renderSummaryCards = () => {
    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Revenue</h6>
              <h3 className="mb-2">{formatCurrency(summary.totalRevenue)}</h3>
              <div className={`small ${summary.comparedToLastPeriod >= 0 ? 'text-success' : 'text-danger'}`}>
                {summary.comparedToLastPeriod >= 0 ? '↑' : '↓'} {Math.abs(summary.comparedToLastPeriod)}% from previous period
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Orders</h6>
              <h3 className="mb-2">{formatNumber(summary.totalOrders)}</h3>
              <div className="small text-muted">During selected period</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Average Order Value</h6>
              <h3 className="mb-2">{formatCurrency(summary.averageOrderValue)}</h3>
              <div className="small text-muted">Per order</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Successful Payments</h6>
              <h3 className="mb-2">98.5%</h3>
              <div className="small text-success">↑ 1.2% from previous period</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderRevenueChart = () => {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5><FaChartLine className="me-2" /> Revenue Trend</h5>
        </Card.Header>
        <Card.Body>
          {revenueData.length === 0 ? (
            <Alert variant="info">No revenue data available for the selected period.</Alert>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={formatChartData} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="orderCount" 
                  stroke="#82ca9d" 
                  name="Order Count" 
                  yAxisId={1} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderCategoryChart = () => {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5><FaChartBar className="me-2" /> Revenue by Category</h5>
        </Card.Header>
        <Card.Body>
          {categoryData.length === 0 ? (
            <Alert variant="info">No category data available for the selected period.</Alert>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoryName" />
                <YAxis tickFormatter={formatChartData} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#8884d8" 
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="orderCount" 
                  name="Order Count" 
                  fill="#82ca9d" 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderPaymentMethodChart = () => {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5><FaChartPie className="me-2" /> Payment Methods</h5>
        </Card.Header>
        <Card.Body>
          {paymentMethodData.length === 0 ? (
            <Alert variant="info">No payment method data available for the selected period.</Alert>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderTopItemsChart = () => {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5><FaChartBar className="me-2" /> Top Selling Items</h5>
        </Card.Header>
        <Card.Body>
          {topItemsData.length === 0 ? (
            <Alert variant="info">No top items data available for the selected period.</Alert>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topItemsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatChartData} />
                <YAxis type="category" dataKey="itemName" width={100} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#8884d8" 
                >
                  {topItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="quantity" 
                  name="Quantity Sold" 
                  fill="#82ca9d" 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">
            <FaChartLine className="me-2" />
            Revenue Analytics
          </h2>
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col md={8}>
                  <h5><FaCalendarAlt className="me-2" /> Date Range</h5>
                </Col>
                <Col md={4} className="text-end">
                  <Button variant="success" onClick={handleExportData}>
                    <FaDownload className="me-2" />
                    Export Data
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>From</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateRangeChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>To</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateRangeChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Period</Form.Label>
                    <Form.Select
                      name="period"
                      value={period}
                      onChange={handlePeriodChange}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('today')}>
                      Today
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('yesterday')}>
                      Yesterday
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('week')}>
                      Last 7 Days
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('month')}>
                      This Month
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('quarter')}>
                      This Quarter
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePresetRange('year')}>
                      This Year
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {renderSummaryCards()}
          
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4"
          >
            <Tab eventKey="overview" title="Overview">
              <Row>
                <Col md={12}>
                  {renderRevenueChart()}
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  {renderCategoryChart()}
                </Col>
                <Col md={6}>
                  {renderPaymentMethodChart()}
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="revenue" title="Revenue Details">
              <Row>
                <Col md={12}>
                  {renderRevenueChart()}
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="categories" title="Categories">
              <Row>
                <Col md={12}>
                  {renderCategoryChart()}
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="products" title="Top Products">
              <Row>
                <Col md={12}>
                  {renderTopItemsChart()}
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="payment" title="Payment Methods">
              <Row>
                <Col md={12}>
                  {renderPaymentMethodChart()}
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
};

export default RevenueAnalyticsPage; 