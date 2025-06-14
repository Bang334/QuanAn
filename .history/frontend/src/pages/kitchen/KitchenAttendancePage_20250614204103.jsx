import React, { useState, useEffect } from 'react';
import { 
  Typography, Spin, message, Card, Table, Tag, Button, 
  Row, Col, Select, DatePicker, Statistic, Space, Divider, Badge,
  Modal, Form, Input, TimePicker, Popconfirm, Empty
} from 'antd';
import { 
  UserOutlined, CalendarOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ScheduleOutlined, FileSearchOutlined,
  ReloadOutlined, FilterOutlined, ExclamationCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import KitchenLayout from '../../layouts/KitchenLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';
import { Box, Paper, Container } from '@mui/material';

const { Title, Text } = Typography;
const { Option } = Select;

const KitchenAttendancePage = () => {
  const [mySchedules, setMySchedules] = useState([]);
  const [myAttendances, setMyAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs());
  const [activeTab, setActiveTab] = useState('schedule');
  const [currentTime, setCurrentTime] = useState(() => dayjs());
  const [stats, setStats] = useState({
    totalSchedules: 0,
    confirmedSchedules: 0,
    totalAttendances: 0,
    onTimeAttendances: 0,
    lateAttendances: 0
  });
  
  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Modal states
  const [isAttendanceDetailVisible, setIsAttendanceDetailVisible] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [isScheduleDetailVisible, setIsScheduleDetailVisible] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);

  // Fetch data when component mounts or month changes
  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tạo tham số truy vấn
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      
      // Lấy thông tin user hiện tại từ localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.id) {
        message.error('Không tìm thấy thông tin người dùng');
        setMySchedules([]);
        setMyAttendances([]);
        setLoading(false);
        return;
      }
      
      // Lấy danh sách lịch làm việc của tôi
      const schedulesResponse = await axios.get(
        `${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      console.log('Schedule data received:', schedulesResponse.data);
      
      // Đảm bảo dữ liệu trả về là mảng
      const scheduleData = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : [];
      
      // Transform data if needed (ensure each item has an id)
      const transformedSchedules = scheduleData.map(item => ({
        ...item,
        key: item.id || `schedule-${Math.random().toString(36).substr(2, 9)}` // Ensure each item has a unique key
      }));
      
      setMySchedules(transformedSchedules);
      
      // Lấy danh sách chấm công của tôi
      const attendancesResponse = await axios.get(
        `${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      console.log('Attendance data received:', attendancesResponse.data);
      
      // Đảm bảo dữ liệu trả về là mảng
      const attendanceData = Array.isArray(attendancesResponse.data) ? attendancesResponse.data : [];
      
      // Transform attendance data if needed
      const transformedAttendances = attendanceData.map(item => ({
        ...item,
        key: item.id || `attendance-${Math.random().toString(36).substr(2, 9)}` // Ensure each item has a unique key
      }));
      
      setMyAttendances(transformedAttendances);
      
      // Calculate statistics
      const totalSchedules = transformedSchedules.length;
      const confirmedSchedules = transformedSchedules.filter(s => s.status === 'confirmed' || s.status === 'completed').length;
      const totalAttendances = transformedAttendances.length;
      const onTimeAttendances = transformedAttendances.filter(a => a.status === 'present').length;
      const lateAttendances = transformedAttendances.filter(a => a.status === 'late').length;
      
      setStats({
        totalSchedules,
        confirmedSchedules,
        totalAttendances,
        onTimeAttendances,
        lateAttendances
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", error.response ? error.response.data : 'No response data');
      setError(`Lỗi khi tải dữ liệu: ${error.message}`);
      message.error('Không thể tải dữ liệu');
      // Đặt các state về mảng rỗng để tránh lỗi
      setMySchedules([]);
      setMyAttendances([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý xem chi tiết chấm công
  const handleViewAttendanceDetail = (record) => {
    console.log("Viewing attendance detail:", record);
    setCurrentAttendance(record);
    setIsAttendanceDetailVisible(true);
  };
  
  // Xử lý xem chi tiết lịch làm việc
  const handleViewScheduleDetail = (record) => {
    console.log("Viewing schedule detail:", record);
    setCurrentSchedule(record);
    setIsScheduleDetailVisible(true);
  };
  
  // Xác nhận lịch làm việc 
  const handleConfirmSchedule = (id) => {
    axios.post(`${API_URL}/api/schedule/confirm/${id}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      message.success('Đã xác nhận lịch làm việc');
      fetchData();
    })
    .catch(error => {
      console.error("Error confirming schedule:", error);
      message.error('Không thể xác nhận lịch làm việc: ' + error.message);
    });
  };
  
  // Chấm công vào ca
  const handleClockIn = () => {
    axios.post(`${API_URL}/api/attendance/check-in`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then((response) => {
      console.log('Clock in response:', response.data);
      message.success('Đã chấm công vào ca thành công');
      fetchData();
    })
    .catch(error => {
      console.error("Error clocking in:", error);
      const errorMsg = error.response?.data?.message || 'Không thể chấm công vào ca';
      message.error(errorMsg);
    });
  };
  
  // Chấm công ra ca
  const handleClockOut = () => {
    axios.post(`${API_URL}/api/attendance/check-out`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then((response) => {
      console.log('Clock out response:', response.data);
      message.success('Đã chấm công ra ca thành công');
      fetchData();
    })
    .catch(error => {
      console.error("Error clocking out:", error);
      const errorMsg = error.response?.data?.message || 'Không thể chấm công ra ca';
      message.error(errorMsg);
    });
  };
  
  // Handle filter changes
  const handleMonthChange = (date) => {
    setSelectedMonth(date || dayjs());
  };

  // Schedule columns
  const scheduleColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (text) => {
        const date = dayjs(text);
        return (
          <div>
            <Text strong>{date.format('DD/MM/YYYY')}</Text>
            <br />
            <Text type="secondary">{date.format('dddd')}</Text>
          </div>
        );
      },
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift) => {
        const shifts = {
          'morning': <Tag color="blue">Ca sáng</Tag>,
          'afternoon': <Tag color="green">Ca chiều</Tag>,
          'evening': <Tag color="purple">Ca tối</Tag>,
          'night': <Tag color="magenta">Ca đêm</Tag>,
          'full_day': <Tag color="red">Cả ngày</Tag>,
        };
        return shifts[shift] || shift;
      },
      filters: [
        { text: 'Ca sáng', value: 'morning' },
        { text: 'Ca chiều', value: 'afternoon' },
        { text: 'Ca tối', value: 'evening' },
        { text: 'Ca đêm', value: 'night' },
        { text: 'Cả ngày', value: 'full_day' },
      ],
      onFilter: (value, record) => record.shift === value,
    },
    {
      title: 'Thời gian',
      dataIndex: 'startTime',
      key: 'time',
      render: (startTime, record) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <Text>{startTime || '—'} - {record.endTime || '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statuses = {
          'scheduled': <Badge status="default" text="Đã lên lịch" />,
          'confirmed': <Badge status="processing" text="Đã xác nhận" />,
          'completed': <Badge status="success" text="Đã hoàn thành" />,
          'cancelled': <Badge status="error" text="Đã hủy" />,
        };
        return statuses[status] || status;
      },
      filters: [
        { text: 'Đã lên lịch', value: 'scheduled' },
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Đã hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleViewScheduleDetail(record)}>Xem</Button>
          {record.status === 'scheduled' && (
            <Button type="default" size="small" onClick={() => handleConfirmSchedule(record.id)}>Xác nhận</Button>
          )}
        </Space>
      ),
    },
  ];

  // Attendance columns
  const attendanceColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (text) => {
        const date = dayjs(text);
        return (
          <div>
            <Text strong>{date.format('DD/MM/YYYY')}</Text>
            <br />
            <Text type="secondary">{date.format('dddd')}</Text>
          </div>
        );
      },
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Giờ vào',
      dataIndex: 'timeIn',
      key: 'timeIn',
      render: (timeIn) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          <Text>{timeIn || '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Giờ ra',
      dataIndex: 'timeOut',
      key: 'timeOut',
      render: (timeOut) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#f5222d' }} />
          <Text>{timeOut || '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statuses = {
          'present': <Badge status="success" text="Có mặt" />,
          'absent': <Badge status="error" text="Vắng mặt" />,
          'late': <Badge status="warning" text="Đi muộn" />,
        };
        return statuses[status] || status;
      },
      filters: [
        { text: 'Có mặt', value: 'present' },
        { text: 'Vắng mặt', value: 'absent' },
        { text: 'Đi muộn', value: 'late' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => handleViewAttendanceDetail(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <KitchenLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <CalendarOutlined style={{ marginRight: 12 }} />
            Chấm công & Lịch làm việc
          </Typography>
          <div>
            <Text type="secondary" style={{ display: 'block', textAlign: 'right' }}>
              Thời gian hiện tại: {currentTime.format('DD/MM/YYYY HH:mm')}
            </Text>
          </div>
        </Box>

        {/* Controls section */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <DatePicker
              picker="month"
              locale={locale}
              value={selectedMonth}
              onChange={handleMonthChange}
              format="MM/YYYY"
              allowClear={false}
              style={{ width: 120 }}
            />
            <Button 
              type="default" 
              icon={<ReloadOutlined />} 
              onClick={fetchData}
            >
              Làm mới
            </Button>
          </Space>
          <Space>
            <Button 
              type="primary"
              style={{ backgroundColor: '#52c41a' }}
              onClick={handleClockIn}
              icon={<ClockCircleOutlined />}
            >
              Chấm công vào
            </Button>
            <Button 
              type="primary"
              danger
              onClick={handleClockOut}
              icon={<ClockCircleOutlined />}
            >
              Chấm công ra
            </Button>
          </Space>
        </Paper>

        {/* Error message */}
        {error && (
          <Paper sx={{ p: 2, mb: 3, color: 'error.main' }}>
            {error}
          </Paper>
        )}
        
        {/* Statistics Cards */}
        <Box sx={{ mb: 3 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Tổng số lịch làm việc"
                  value={stats.totalSchedules}
                  prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Lịch đã xác nhận"
                  value={stats.confirmedSchedules}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  suffix={stats.totalSchedules > 0 ? `${Math.round(stats.confirmedSchedules / stats.totalSchedules * 100)}%` : '0%'}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Đi làm đúng giờ"
                  value={stats.onTimeAttendances}
                  prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                  suffix={stats.totalAttendances > 0 ? `${Math.round(stats.onTimeAttendances / stats.totalAttendances * 100)}%` : '0%'}
                />
              </Card>
            </Col>
          </Row>
        </Box>
        
        {/* Main content */}
        <Paper sx={{ p: 2 }}>
          <Card
            tabList={[
              {
                key: 'schedule',
                tab: (
                  <span>
                    <ScheduleOutlined /> Lịch làm việc của tôi
                  </span>
                ),
              },
              {
                key: 'attendance',
                tab: (
                  <span>
                    <FileSearchOutlined /> Chấm công của tôi
                  </span>
                ),
              },
            ]}
            activeTabKey={activeTab}
            onTabChange={key => setActiveTab(key)}
            style={{ width: '100%' }}
          >
            <Spin spinning={loading}>
              {activeTab === 'schedule' ? (
                mySchedules && mySchedules.length > 0 ? (
                  <Table 
                    dataSource={mySchedules} 
                    columns={scheduleColumns} 
                    rowKey="key"
                    bordered 
                    pagination={{ pageSize: 10 }}
                    style={{ overflowX: 'auto' }}
                  />
                ) : (
                  <Empty 
                    description={
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Không có lịch làm việc nào trong tháng này.</p>
                        <p>Vui lòng liên hệ quản lý để biết thêm chi tiết.</p>
                      </div>
                    }
                    style={{ margin: '40px 0' }}
                  />
                )
              ) : (
                myAttendances && myAttendances.length > 0 ? (
                  <Table 
                    dataSource={myAttendances} 
                    columns={attendanceColumns} 
                    rowKey="key"
                    bordered 
                    pagination={{ pageSize: 10 }}
                    style={{ overflowX: 'auto' }}
                  />
                ) : (
                  <Empty 
                    description={
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Không có dữ liệu chấm công nào trong tháng này.</p>
                        <div style={{ marginTop: '20px' }}>
                          <Space>
                            <Button 
                              type="primary" 
                              style={{ backgroundColor: '#52c41a' }} 
                              onClick={handleClockIn}
                              icon={<ClockCircleOutlined />}
                            >
                              Chấm công vào
                            </Button>
                            <Button 
                              type="primary" 
                              danger 
                              onClick={handleClockOut}
                              icon={<ClockCircleOutlined />}
                            >
                              Chấm công ra
                            </Button>
                          </Space>
                        </div>
                      </div>
                    }
                    style={{ margin: '40px 0' }}
                  />
                )
              )}
            </Spin>
          </Card>
        </Paper>
        
        {/* Modal xem chi tiết chấm công */}
        <Modal
          title="Chi tiết chấm công"
          open={isAttendanceDetailVisible}
          onCancel={() => setIsAttendanceDetailVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsAttendanceDetailVisible(false)}>
              Đóng
            </Button>
          ]}
        >
          {currentAttendance && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Ngày:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{dayjs(currentAttendance.date).format('DD/MM/YYYY')}</Typography.Text>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Giờ vào:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{currentAttendance.timeIn || 'N/A'}</Typography.Text>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Giờ ra:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{currentAttendance.timeOut || 'N/A'}</Typography.Text>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Trạng thái:</Typography.Text>
                </Col>
                <Col span={12}>
                  {currentAttendance.status === 'present' && <Badge status="success" text="Có mặt" />}
                  {currentAttendance.status === 'absent' && <Badge status="error" text="Vắng mặt" />}
                  {currentAttendance.status === 'late' && <Badge status="warning" text="Đi muộn" />}
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Ghi chú:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{currentAttendance.note || 'Không có'}</Typography.Text>
                </Col>
              </Row>
            </Space>
          )}
        </Modal>

        {/* Modal xem chi tiết lịch làm việc */}
        <Modal
          title="Chi tiết lịch làm việc"
          open={isScheduleDetailVisible}
          onCancel={() => setIsScheduleDetailVisible(false)}
          footer={[
            <Button 
              key="confirm" 
              type="primary"
              onClick={() => {
                handleConfirmSchedule(currentSchedule.id);
                setIsScheduleDetailVisible(false);
              }}
              disabled={currentSchedule && currentSchedule.status !== 'scheduled'}
            >
              Xác nhận lịch
            </Button>,
            <Button key="close" onClick={() => setIsScheduleDetailVisible(false)}>
              Đóng
            </Button>
          ]}
        >
          {currentSchedule && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Ngày:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{dayjs(currentSchedule.date).format('DD/MM/YYYY')} ({dayjs(currentSchedule.date).format('dddd')})</Typography.Text>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Ca làm việc:</Typography.Text>
                </Col>
                <Col span={12}>
                  {currentSchedule.shift === 'morning' && <Tag color="blue">Ca sáng</Tag>}
                  {currentSchedule.shift === 'afternoon' && <Tag color="green">Ca chiều</Tag>}
                  {currentSchedule.shift === 'evening' && <Tag color="purple">Ca tối</Tag>}
                  {currentSchedule.shift === 'night' && <Tag color="magenta">Ca đêm</Tag>}
                  {currentSchedule.shift === 'full_day' && <Tag color="red">Cả ngày</Tag>}
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Thời gian:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{currentSchedule.startTime || '—'} - {currentSchedule.endTime || '—'}</Typography.Text>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Trạng thái:</Typography.Text>
                </Col>
                <Col span={12}>
                  {currentSchedule.status === 'scheduled' && <Badge status="default" text="Đã lên lịch" />}
                  {currentSchedule.status === 'confirmed' && <Badge status="processing" text="Đã xác nhận" />}
                  {currentSchedule.status === 'completed' && <Badge status="success" text="Đã hoàn thành" />}
                  {currentSchedule.status === 'cancelled' && <Badge status="error" text="Đã hủy" />}
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>Ghi chú:</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text>{currentSchedule.note || 'Không có'}</Typography.Text>
                </Col>
              </Row>
            </Space>
          )}
        </Modal>
      </Container>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
