import React, { useState, useEffect } from 'react';
import { 
  Typography, Tabs, Spin, message, Card, Table, Tag, Button, 
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
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const KitchenAttendancePage = () => {
  const [mySchedules, setMySchedules] = useState([]);
  const [myAttendances, setMyAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('schedule');
  const [currentTime, setCurrentTime] = useState(dayjs());
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
  
  // Modal states chỉ cho phép xem chi tiết chứ không cho phép chỉnh sửa
  const [isAttendanceDetailVisible, setIsAttendanceDetailVisible] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  
  // Schedule detail modal state
  const [isScheduleDetailVisible, setIsScheduleDetailVisible] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

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
        return;
      }
      
      // Lấy danh sách lịch làm việc của tôi
      const schedulesResponse = await axios.get(`${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Schedule data received:', schedulesResponse.data);
      setMySchedules(schedulesResponse.data);
      
      // Lấy danh sách chấm công của tôi
      const attendancesResponse = await axios.get(`${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Attendance data received:', attendancesResponse.data);
      setMyAttendances(attendancesResponse.data);
      
      // Calculate statistics
      const totalSchedules = schedulesResponse.data.length;
      const confirmedSchedules = schedulesResponse.data.filter(s => s.status === 'confirmed' || s.status === 'completed').length;
      const totalAttendances = attendancesResponse.data.length;
      const onTimeAttendances = attendancesResponse.data.filter(a => a.status === 'present').length;
      const lateAttendances = attendancesResponse.data.filter(a => a.status === 'late').length;
      
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
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý xem chi tiết chấm công
  const handleViewAttendanceDetail = (record) => {
    setCurrentAttendance(record);
    setIsAttendanceDetailVisible(true);
  };
  
  // Xử lý xem chi tiết lịch làm việc
  const handleViewScheduleDetail = (record) => {
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
      <Box sx={{ padding: 2 }}>
        <Box sx={{ marginBottom: 3 }}>
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <CalendarOutlined style={{ marginRight: 12 }} />
                Chấm công & Lịch làm việc
              </Title>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Thời gian hiện tại: {currentTime.format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
            </Col>
            <Col>
              <Space size="large">
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
                <Button 
                  type="primary"
                  style={{ backgroundColor: '#52c41a' }}
                  onClick={handleClockIn}
                >
                  Chấm công vào
                </Button>
                <Button 
                  type="primary"
                  danger
                  onClick={handleClockOut}
                >
                  Chấm công ra
                </Button>
              </Space>
            </Col>
          </Row>
        </Box>
        
        {error && (
          <Box sx={{ 
            color: 'error.main', 
            mb: 2.5, 
            p: 1.25, 
            border: '1px solid', 
            borderColor: 'error.light', 
            borderRadius: 1 
          }}>
            {error}
          </Box>
        )}
        
        {/* Statistics Cards */}
        <Box component={Row} sx={{ marginBottom: 3 }} gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Tổng số lịch làm việc"
                value={stats.totalSchedules}
                prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Lịch đã xác nhận"
                value={stats.confirmedSchedules}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix={stats.totalSchedules > 0 ? `${Math.round(stats.confirmedSchedules / stats.totalSchedules * 100)}%` : '0%'}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Đi làm đúng giờ"
                value={stats.onTimeAttendances}
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                suffix={stats.totalAttendances > 0 ? `${Math.round(stats.onTimeAttendances / stats.totalAttendances * 100)}%` : '0%'}
              />
            </Card>
          </Col>
        </Box>
        
        <Spin spinning={loading}>
          <Card 
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)', width: '100%', overflowX: 'auto' }}
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
          >
            {activeTab === 'schedule' ? (
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                  <Table 
                  dataSource={mySchedules || []} 
                  columns={scheduleColumns} 
                  rowKey="id" 
                  bordered 
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'Không có dữ liệu lịch làm việc' }}
                  style={{ minWidth: '800px' }}
                />
                  {mySchedules?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Không có lịch làm việc nào trong tháng này.</p>
                      <p>Vui lòng liên hệ quản lý để biết thêm chi tiết.</p>
                    </div>
                  )}
              </Box>
            ) : (
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                  <Table 
                  dataSource={myAttendances || []} 
                  columns={attendanceColumns} 
                  rowKey="id" 
                  bordered 
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'Không có dữ liệu chấm công' }}
                  style={{ minWidth: '800px' }}
                />
                  {myAttendances?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Không có dữ liệu chấm công nào trong tháng này.</p>
                      <p>Vui lòng bắt đầu chấm công hoặc liên hệ quản lý.</p>
                    </div>
                  )}
              </Box>
            )}
          </Card>
        </Spin>
        
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
      </Box>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
