import React, { useState, useEffect } from 'react';
import { 
  Typography, Table, Card, Button, Space, Modal, Form, Input, 
  Select, InputNumber, DatePicker, message, Statistic, Tag,
  Row, Col, Popconfirm, Tooltip, Descriptions, Divider, Spin, Alert, Avatar, Empty
} from 'antd';
import { 
  DollarOutlined, UserOutlined, CalendarOutlined, 
  ReloadOutlined, FileExcelOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TeamOutlined, QuestionCircleOutlined,
  SettingOutlined, EyeOutlined, EditOutlined, LoadingOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { Box, Container, Grid, Paper } from '@mui/material';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SalaryManagementPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [statistics, setStatistics] = useState({
    month: dayjs().month() + 1,
    year: dayjs().year(),
    employeeCount: 0,
    totalBaseSalary: 0,
    totalHourlyPay: 0,
    totalBonus: 0,
    totalDeduction: 0,
    totalSalary: 0,
    roleStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [salaryRates, setSalaryRates] = useState([]);
  const navigate = useNavigate();
  const [isSalaryRateModalVisible, setIsSalaryRateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailSalary, setDetailSalary] = useState(null);
  const [salaryRateForm] = Form.useForm();
  const [editingSalaryRate, setEditingSalaryRate] = useState(null);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchSalaryRates();
  }, [selectedMonth]);

  // Lấy danh sách lương
  const fetchData = async () => {
    try {
      setLoading(true);
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      
      // Lấy thống kê lương
      const statsResponse = await axios.get(`${API_URL}/api/salary/admin/statistics?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setStatistics(statsResponse.data);
      setSalaries(statsResponse.data.salaries || []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      message.error('Không thể tải dữ liệu lương');
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách nhân viên
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Lọc chỉ lấy nhân viên bếp và phục vụ
      const staffUsers = response.data.filter(user => 
        user.role === 'kitchen' || user.role === 'waiter'
      );
      setUsers(staffUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  // Lấy danh sách mức lương
  const fetchSalaryRates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/salary-rate`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSalaryRates(response.data);
    } catch (error) {
      console.error('Error fetching salary rates:', error);
      message.error('Không thể tải mức lương');
    }
  };

  // Xử lý thay đổi tháng
  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  // Xử lý khi muốn chỉnh sửa lương
  const handleEditSalary = (record) => {
    form.setFieldsValue({
      userId: record.userId,
      month: record.month,
      year: record.year,
      totalHours: parseFloat(record.totalHours || 0),
      totalHourlyPay: parseFloat(record.totalHourlyPay || 0),
      bonus: parseFloat(record.bonus || 0),
      deduction: parseFloat(record.deduction || 0),
      note: record.note
    });
    setEditingSalary(record);
    setIsEditModalVisible(true);
  };

  // Lưu chỉnh sửa lương
  const handleSaveSalary = () => {
    form.validateFields().then(async (values) => {
      try {
        const month = selectedMonth.month() + 1;
        const year = selectedMonth.year();
        
        await axios.post(`${API_URL}/api/salary/admin/create-update`, {
          ...values,
          month,
          year,
          id: editingSalary.id
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        message.success('Cập nhật lương thành công');
        setIsEditModalVisible(false);
        fetchData();
      } catch (error) {
        console.error('Error updating salary:', error);
        message.error('Không thể cập nhật lương');
      }
    });
  };

  // Đánh dấu lương đã thanh toán
  const handlePaySalary = async (id) => {
    try {
      await axios.put(`${API_URL}/api/salary/admin/${id}/pay`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      message.success('Đã đánh dấu lương đã thanh toán');
      fetchData();
    } catch (error) {
      console.error('Error marking salary as paid:', error);
      message.error('Không thể đánh dấu lương đã thanh toán');
    }
  };

  // Lấy thông tin mức lương cho nhân viên
  const getApplicableSalaryRate = (userId, role) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    // Lấy mức lương mới nhất cho vị trí này
    const applicableRates = salaryRates.filter(rate => 
      rate.role === role && rate.isActive
    );
    
    if (applicableRates.length === 0) return null;
    
    // Sắp xếp theo ngày áp dụng mới nhất
    return applicableRates.sort((a, b) => 
      new Date(b.effectiveDate) - new Date(a.effectiveDate)
    )[0];
  };

  // Mở modal quản lý mức lương
  const handleManageSalaryRates = () => {
    setIsSalaryRateModalVisible(true);
  };

  // Mở modal chỉnh sửa mức lương
  const handleEditSalaryRate = (record) => {
    setEditingSalaryRate(record);
    salaryRateForm.setFieldsValue({
      role: record.role,
      baseSalary: record.baseSalary,
      hourlyRate: record.hourlyRate,
      effectiveDate: dayjs(record.effectiveDate)
    });
  };

  // Lưu mức lương
  const handleSaveSalaryRate = () => {
    salaryRateForm.validateFields().then(async (values) => {
      try {
        const endpoint = editingSalaryRate 
          ? `${API_URL}/api/salary-rate/${editingSalaryRate.id}`
          : `${API_URL}/api/salary-rate`;
        
        const method = editingSalaryRate ? 'put' : 'post';
        
        await axios[method](endpoint, {
          ...values,
          effectiveDate: values.effectiveDate.format('YYYY-MM-DD')
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        message.success(`${editingSalaryRate ? 'Cập nhật' : 'Thêm mới'} mức lương thành công`);
        setEditingSalaryRate(null);
        fetchSalaryRates();
      } catch (error) {
        console.error('Error saving salary rate:', error);
        message.error(`Không thể ${editingSalaryRate ? 'cập nhật' : 'thêm mới'} mức lương`);
      }
    });
  };

  // Xem chi tiết lương
  const handleViewSalaryDetail = async (record) => {
    try {
      setDetailSalary(record);
      setIsDetailModalVisible(true);
      setLoadingDetails(true);
      
      // Gọi API để lấy chi tiết lương theo ngày
      const response = await axios.get(`${API_URL}/api/salary/admin/${record.id}/daily-details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('API trả về dữ liệu chi tiết lương:', response.data);
      
      // Chuẩn bị dữ liệu với đầy đủ thông tin Attendance
      const processingDetails = response.data.dailyDetails.map(detail => {
        let hourlyRate = detail.hourlyRate;
        if (!hourlyRate && detail.SalaryRate && detail.SalaryRate.hourlyRate) {
          hourlyRate = detail.SalaryRate.hourlyRate;
        }
        if (detail.Attendance) {
          return {
            ...detail,
            timeIn: detail.Attendance.timeIn,
            timeOut: detail.Attendance.timeOut,
            hoursWorked: detail.Attendance.hoursWorked,
            status: detail.Attendance.status,
            hourlyRate
          };
        }
        return {
          ...detail,
          hourlyRate
        };
      });
      
      setDailyDetails(processingDetails);
    } catch (error) {
      console.error('Error fetching salary details:', error);
      message.error('Không thể tải chi tiết lương');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Hiển thị modal chỉnh sửa lương
  const renderEditModal = () => (
    <Modal
      title="Chỉnh sửa thông tin lương"
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      onOk={handleSaveSalary}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="userId"
          label="Nhân viên"
          rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
        >
          <Select placeholder="Chọn nhân viên" disabled>
            {users.map(user => (
              <Option key={user.id} value={user.id}>
                {user.name} ({user.role === 'waiter' ? 'Phục vụ' : 'Bếp'})
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="totalHours"
              label="Số giờ làm việc"
              rules={[{ required: true, message: 'Vui lòng nhập số giờ làm việc' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.5}
                precision={1}
                placeholder="Nhập số giờ làm việc"
                formatter={value => value ? Number(value).toFixed(1) : ''}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="totalHourlyPay"
              label="Lương theo giờ"
              rules={[{ required: true, message: 'Vui lòng nhập lương theo giờ' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={1000}
                placeholder="Nhập lương theo giờ"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bonus"
              label="Thưởng"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000}
                placeholder="Nhập tiền thưởng"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deduction"
              label="Khấu trừ"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000}
                placeholder="Nhập tiền khấu trừ"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <Input.TextArea rows={4} placeholder="Nhập ghi chú" />
        </Form.Item>
      </Form>
    </Modal>
  );

  // Cấu hình cột cho bảng lương
  const salaryColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId, record) => {
        const user = users.find(u => u.id === userId);
        return (
          <Space>
            <Avatar icon={<UserOutlined />} />
            <div>
              <div>{user?.name || record.User?.name || "Không có tên"}</div>
              <Tag color={user?.role === 'waiter' || record.User?.role === 'waiter' ? 'blue' : 'orange'}>
                {user?.role === 'waiter' || record.User?.role === 'waiter' ? 'Phục vụ' : 'Bếp'}
              </Tag>
            </div>
          </Space>
        );
      },
      sorter: (a, b) => {
        const userA = users.find(u => u.id === a.userId);
        const userB = users.find(u => u.id === b.userId);
        return (userA?.name || a.User?.name || '').localeCompare(userB?.name || b.User?.name || '');
      }
    },
    {
      title: 'Số giờ làm việc',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours) => (
        <Space>
          <ClockCircleOutlined />
          {parseFloat(hours || 0).toFixed(2)} giờ
        </Space>
      ),
      sorter: (a, b) => parseFloat(a.totalHours || 0) - parseFloat(b.totalHours || 0)
    },
    {
      title: 'Lương theo giờ',
      dataIndex: 'totalHourlyPay',
      key: 'totalHourlyPay',
      render: value => formatCurrency(parseFloat(value) || 0),
      sorter: (a, b) => parseFloat(a.totalHourlyPay || 0) - parseFloat(b.totalHourlyPay || 0)
    },
    {
      title: 'Thưởng',
      dataIndex: 'bonus',
      key: 'bonus',
      render: value => (
        <Tag color="green">
          +{formatCurrency(parseFloat(value) || 0)}
        </Tag>
      ),
      sorter: (a, b) => parseFloat(a.bonus || 0) - parseFloat(b.bonus || 0)
    },
    {
      title: 'Khấu trừ',
      dataIndex: 'deduction',
      key: 'deduction',
      render: value => (
        <Tag color="red">
          -{formatCurrency(parseFloat(value) || 0)}
        </Tag>
      ),
      sorter: (a, b) => parseFloat(a.deduction || 0) - parseFloat(b.deduction || 0)
    },
    {
      title: 'Tổng lương',
      dataIndex: 'total',
      key: 'total',
      render: (_, record) => {
        const hourlyPay = parseFloat(record.totalHourlyPay || 0);
        const bonus = parseFloat(record.bonus || 0);
        const deduction = parseFloat(record.deduction || 0);
        const total = hourlyPay + bonus - deduction;
        return <strong>{formatCurrency(total)}</strong>;
      },
      sorter: (a, b) => {
        const totalA = parseFloat(a.totalHourlyPay || 0) + parseFloat(a.bonus || 0) - parseFloat(a.deduction || 0);
        const totalB = parseFloat(b.totalHourlyPay || 0) + parseFloat(b.bonus || 0) - parseFloat(b.deduction || 0);
        return totalA - totalB;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </Tag>
      ),
      filters: [
        { text: 'Đã thanh toán', value: 'paid' },
        { text: 'Chưa thanh toán', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewSalaryDetail(record)}
            title="Xem chi tiết"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditSalary(record)}
            title="Chỉnh sửa"
          />
          {record.status !== 'paid' && (
            <Popconfirm
              title="Xác nhận thanh toán lương?"
              onConfirm={() => handlePaySalary(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                title="Thanh toán lương"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Modal chi tiết lương
  const renderDetailModal = () => (
    <Modal
      title="Chi tiết lương"
      open={isDetailModalVisible}
      onCancel={() => setIsDetailModalVisible(false)}
      width={700}
      footer={[
        <Button key="back" onClick={() => setIsDetailModalVisible(false)}>
          Đóng
        </Button>
      ]}
    >
      {loadingDetails ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Đang tải dữ liệu...
          </Typography.Text>
        </div>
      ) : (
        <>
          {detailSalary && (
            <>
              <Descriptions title="Thông tin nhân viên" bordered column={2}>
                <Descriptions.Item label="Tên nhân viên">{detailSalary.User?.name}</Descriptions.Item>
                <Descriptions.Item label="Vị trí">
                  <Tag color={detailSalary.User?.role === 'waiter' ? 'blue' : 'orange'}>
                    {detailSalary.User?.role === 'waiter' ? 'Phục vụ' : 'Bếp'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Email">{detailSalary.User?.email}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{detailSalary.User?.phone || 'N/A'}</Descriptions.Item>
              </Descriptions>
              
              <Divider />
              
              <Descriptions title="Thông tin lương" bordered column={2}>
                <Descriptions.Item label="Tháng/Năm">{detailSalary.month}/{detailSalary.year}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={detailSalary.status === 'paid' ? 'green' : 'orange'}>
                    {detailSalary.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Số giờ làm việc">{parseFloat(detailSalary.totalHours || 0).toFixed(2)} giờ</Descriptions.Item>
                <Descriptions.Item label="Lương theo giờ">{formatCurrency(detailSalary.totalHourlyPay || 0)}</Descriptions.Item>
                <Descriptions.Item label="Thưởng">{formatCurrency(detailSalary.bonus || 0)}</Descriptions.Item>
                <Descriptions.Item label="Khấu trừ">{formatCurrency(detailSalary.deduction || 0)}</Descriptions.Item>
                <Descriptions.Item label="Tổng lương" span={2}>
                  <Typography.Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {formatCurrency(
                      parseFloat(detailSalary.totalHourlyPay || 0) + 
                      parseFloat(detailSalary.bonus || 0) - 
                      parseFloat(detailSalary.deduction || 0)
                    )}
                  </Typography.Text>
                </Descriptions.Item>
                {detailSalary.note && (
                  <Descriptions.Item label="Ghi chú" span={2}>{detailSalary.note}</Descriptions.Item>
                )}
              </Descriptions>
              
              <Divider />
              
              <Typography.Title level={5}>Chi tiết lương theo ngày</Typography.Title>
              {dailyDetails.length > 0 ? (
                <Table 
                  columns={[
                    {
                      title: 'Ngày',
                      dataIndex: 'date',
                      key: 'date',
                      render: date => new Date(date).toLocaleDateString('vi-VN')
                    },
                    {
                      title: 'Ca làm việc',
                      dataIndex: 'shift',
                      key: 'shift',
                      render: shift => {
                        const shiftMap = {
                          morning: 'Sáng',
                          afternoon: 'Chiều',
                          evening: 'Tối',
                          night: 'Đêm',
                          full_day: 'Cả ngày'
                        };
                        return shiftMap[shift] || shift;
                      }
                    },
                    {
                      title: 'Số giờ',
                      dataIndex: 'hoursWorked',
                      key: 'hoursWorked',
                      render: hours => `${parseFloat(hours || 0).toFixed(2)} giờ`
                    },
                    {
                      title: 'Mức lương/giờ',
                      dataIndex: 'hourlyRate',
                      key: 'hourlyRate',
                      align: 'center',
                      render: (rate, detail) =>
                        rate && parseFloat(rate) > 0
                          ? formatCurrency(rate)
                          : (detail.SalaryRate && detail.SalaryRate.hourlyRate
                              ? formatCurrency(detail.SalaryRate.hourlyRate)
                              : '0 đ')
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: amount => formatCurrency(parseFloat(amount || 0))
                    }
                  ]}
                  dataSource={dailyDetails.map(detail => ({
                    ...detail,
                    key: detail.id
                  }))}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="Chưa có dữ liệu chi tiết" />
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} style={{ position: 'relative', top: -85, left: -260 }}>
        <Box mb={3}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Title level={2}>
                <DollarOutlined style={{ marginRight: 12 }} />
                Quản lý lương nhân viên
              </Title>
            </Grid>
            <Grid item>
              <Space>
                <DatePicker
                  picker="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  format="MM/YYYY"
                  allowClear={false}
                />
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={fetchData}
                >
                  Làm mới
                </Button>
                <Button
                  type="default"
                  icon={<SettingOutlined />}
                  onClick={handleManageSalaryRates}
                >
                  Quản lý mức lương
                </Button>
              </Space>
            </Grid>
          </Grid>
        </Box>

        <Box mb={4}>
          <Paper sx={{ p: 2 }}>
            <Title level={4}>Thống kê lương tháng {statistics.month}/{statistics.year}</Title>
            <Row gutter={16}>
              <Col span={6}>
                <Card variant="outlined">
                  <Statistic
                    title="Tổng số nhân viên"
                    value={statistics.employeeCount}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card variant="outlined">
                  <Statistic
                    title="Tổng lương cơ bản"
                    value={parseFloat(statistics.totalBaseSalary || 0)}
                    precision={0}
                    formatter={(value) => formatCurrency(value)}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card variant="outlined">
                  <Statistic
                    title="Tổng lương theo giờ"
                    value={parseFloat(statistics.totalHourlyPay || 0)}
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                    formatter={(value) => formatCurrency(value)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card variant="outlined">
                  <Statistic
                    title="Tổng chi phí lương"
                    value={parseFloat(statistics.totalSalary || 0)}
                    precision={0}
                    valueStyle={{ color: '#1890ff' }}
                    formatter={(value) => formatCurrency(value)}
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Paper>
        </Box>

        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Table
            columns={salaryColumns}
            dataSource={salaries}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            summary={(pageData) => {
              let totalSalary = 0;
              let totalHours = 0;
              let totalHourlyPay = 0;
              let totalBaseSalary = 0;
              let totalBonus = 0;
              let totalDeduction = 0;

              pageData.forEach(({ totalHourlyPay: hourlyPay, totalHours: hours, bonus, deduction }) => {
                totalHourlyPay += parseFloat(hourlyPay || 0);
                totalHours += parseFloat(hours || 0);
                totalBonus += parseFloat(bonus || 0);
                totalDeduction += parseFloat(deduction || 0);
                totalSalary += parseFloat(hourlyPay || 0) + parseFloat(bonus || 0) - parseFloat(deduction || 0);
              });

              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell><Text strong>Tổng</Text></Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <Text strong>{totalHours.toFixed(2)} giờ</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <Text strong>{formatCurrency(totalHourlyPay)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <Text strong style={{ color: '#52c41a' }}>+{formatCurrency(totalBonus)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <Text strong type="danger">-{formatCurrency(totalDeduction)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        {formatCurrency(totalSalary)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell colSpan={2}></Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </Paper>

        {renderEditModal()}

        {/* Modal quản lý mức lương */}
        <Modal
          title="Quản lý mức lương"
          open={isSalaryRateModalVisible}
          onCancel={() => {
            setIsSalaryRateModalVisible(false);
            setEditingSalaryRate(null);
            salaryRateForm.resetFields();
          }}
          footer={null}
          width={800}
        >
          {!editingSalaryRate ? (
            <>
              <Button 
                type="primary" 
                style={{ marginBottom: 16 }}
                icon={<DollarOutlined />}
                onClick={() => {
                  setEditingSalaryRate({});
                  salaryRateForm.resetFields();
                }}
              >
                Thêm mức lương mới
              </Button>
            </>
          ) : (
            <>
              <Divider orientation="left">Thêm/Chỉnh sửa mức lương</Divider>
              <Form
                form={salaryRateForm}
                layout="horizontal"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 16 }}
                onFinish={handleSaveSalaryRate}
              >
                <Form.Item
                  name="role"
                  label="Vị trí"
                  rules={[{ required: true, message: 'Vui lòng chọn vị trí' }]}
                >
                  <Select>
                    <Option value="waiter">Phục vụ</Option>
                    <Option value="kitchen">Bếp</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="baseSalary"
                  label="Lương cơ bản (VND)"
                  rules={[{ required: true, message: 'Vui lòng nhập lương cơ bản' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
                <Form.Item
                  name="hourlyRate"
                  label="Lương theo giờ (VND)"
                  rules={[{ required: true, message: 'Vui lòng nhập lương theo giờ' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
                <Form.Item
                  name="effectiveDate"
                  label="Ngày áp dụng"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày áp dụng' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      {editingSalaryRate.id ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                    <Button onClick={() => {
                      setEditingSalaryRate(null);
                      salaryRateForm.resetFields();
                    }}>
                      Hủy
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}

          <Divider orientation="left">Danh sách mức lương</Divider>
          <Table
            dataSource={salaryRates}
            rowKey="id"
            size="small"
            columns={[
              {
                title: 'Vị trí',
                dataIndex: 'role',
                key: 'role',
                render: (role) => (
                  <Tag color={role === 'waiter' ? 'blue' : 'orange'}>
                    {role === 'waiter' ? 'Phục vụ' : 'Bếp'}
                  </Tag>
                )
              },
              {
                title: 'Ca làm việc',
                dataIndex: 'shift',
                key: 'shift',
                render: (shift) => {
                  const shiftMap = {
                    morning: 'Sáng',
                    afternoon: 'Chiều',
                    evening: 'Tối',
                    night: 'Đêm',
                    full_day: 'Cả ngày',
                  };
                  return shift ? (shiftMap[shift] || shift) : '---';
                }
              },
              {
                title: 'Lương cơ bản',
                dataIndex: 'baseSalary',
                key: 'baseSalary',
                render: (value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'
              },
              {
                title: 'Lương theo giờ',
                dataIndex: 'hourlyRate',
                key: 'hourlyRate',
                render: (value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ/giờ'
              },
              {
                title: 'Ngày áp dụng',
                dataIndex: 'effectiveDate',
                key: 'effectiveDate',
                render: (date) => dayjs(date).format('DD/MM/YYYY')
              },
              {
                title: 'Trạng thái',
                dataIndex: 'isActive',
                key: 'isActive',
                render: (isActive) => (
                  <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Đang áp dụng' : 'Không áp dụng'}
                  </Tag>
                )
              },
              {
                title: 'Thao tác',
                key: 'action',
                render: (_, record) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleEditSalaryRate(record)}
                  >
                    Sửa
                  </Button>
                )
              }
            ]}
            pagination={false}
          />
        </Modal>

        {renderDetailModal()}
      </Container>
    </AdminLayout>
  );
};

export default SalaryManagementPage; 