import React, { useState, useEffect } from 'react';
import { 
  Typography, Spin, message, Card, Table, Tag, Button, 
  Row, Col, DatePicker, Statistic, Space, Divider, Badge,
  Empty, Tabs
} from 'antd';
import { 
  UserOutlined, CalendarOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ScheduleOutlined, FileSearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import KitchenLayout from '../../layouts/KitchenLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const KitchenAttendancePage = () => {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('schedule');
  const [stats, setStats] = useState({
    totalSchedules: 0,
    confirmedSchedules: 0,
    totalAttendances: 0,
    onTimeAttendances: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tạo tham số truy vấn
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      
      // Lấy danh sách lịch làm việc của nhân viên bếp
      const schedulesResponse = await axios.get(`${API_URL}/api/schedule/my-schedule`, {
        params: { month, year },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Schedules response:', schedulesResponse.data);
      const schedulesData = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : [];
      setSchedules(schedulesData);
      
      // Lấy danh sách chấm công của nhân viên bếp
      const attendancesResponse = await axios.get(`${API_URL}/api/attendance/my-attendance`, {
        params: { month, year },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Attendances response:', attendancesResponse.data);
      const attendancesData = Array.isArray(attendancesResponse.data) ? attendancesResponse.data : [];
      setAttendances(attendancesData);
      
      // Calculate statistics
      setStats({
        totalSchedules: schedulesData.length,
        confirmedSchedules: schedulesData.filter(s => s && (s.status === 'confirmed' || s.status === 'completed')).length,
        totalAttendances: attendancesData.length,
        onTimeAttendances: attendancesData.filter(a => a && a.status === 'present').length
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Lỗi khi tải dữ liệu: ${error.message}`);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleMonthChange = (date) => {
    setSelectedMonth(date || dayjs());
  };

  // Confirm schedule
  const handleConfirmSchedule = async (scheduleId) => {
    if (!scheduleId) {
      message.error('ID lịch làm việc không hợp lệ');
      return;
    }
    
    try {
      await axios.put(`${API_URL}/api/schedule/confirm/${scheduleId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Xác nhận lịch làm việc thành công');
      fetchData();
    } catch (error) {
      console.error("Error confirming schedule:", error);
      message.error('Không thể xác nhận lịch làm việc');
    }
  };

  // Check in
  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/api/attendance/check-in`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Chấm công vào ca thành công');
      fetchData();
    } catch (error) {
      console.error("Error checking in:", error);
      message.error('Không thể chấm công vào ca');
    }
  };

  // Check out
  const handleCheckOut = async () => {
    try {
      await axios.post(`${API_URL}/api/attendance/check-out`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Chấm công kết thúc ca thành công');
      fetchData();
    } catch (error) {
      console.error("Error checking out:", error);
      message.error('Không thể chấm công kết thúc ca');
    }
  };

  // Check if there's a schedule for today that needs check-in
  const today = dayjs().format('YYYY-MM-DD');
  const todaySchedule = schedules.find(s => {
    if (!s || !s.date) return false;
    try {
      const scheduleDate = dayjs(s.date).format('YYYY-MM-DD');
      return scheduleDate === today && (s.status === 'confirmed' || s.status === 'scheduled');
    } catch (error) {
      return false;
    }
  });
  
  // Check if there's an attendance for today that needs check-out
  const todayAttendance = attendances.find(a => {
    if (!a || !a.date) return false;
    try {
      const attendanceDate = dayjs(a.date).format('YYYY-MM-DD');
      return attendanceDate === today && !a.timeOut;
    } catch (error) {
      return false;
    }
  });

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
        record.status === 'scheduled' && (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleConfirmSchedule(record.id)}
          >
            Xác nhận
          </Button>
        )
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
  ];

  return (
    <KitchenLayout>
      <div style={{ position: 'relative', top: -85, left: -260 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: 12 }} />
              Lịch làm việc & Chấm công
            </Title>
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
            </Space>
          </Col>
        </Row>

        {error && (
          <div style={{ 
            color: '#ff4d4f', 
            marginBottom: 16, 
            padding: 10, 
            border: '1px solid #ffccc7', 
            borderRadius: 4 
          }}>
            {error}
          </div>
        )}

        {/* Today's Check-in/Check-out Card */}
        <Card 
          title="Chấm công hôm nay" 
          style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              {todaySchedule ? (
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    Ca làm việc hôm nay:
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      const shifts = {
                        'morning': <Tag color="blue">Ca sáng</Tag>,
                        'afternoon': <Tag color="green">Ca chiều</Tag>,
                        'evening': <Tag color="purple">Ca tối</Tag>,
                        'night': <Tag color="magenta">Ca đêm</Tag>,
                        'full_day': <Tag color="red">Cả ngày</Tag>,
                      };
                      return shifts[todaySchedule.shift] || todaySchedule.shift;
                    })()}
                    <Text style={{ margin: '0 8px' }}>
                      từ
                    </Text>
                    <Text strong>
                      {todaySchedule.startTime || '—'}
                    </Text>
                    <Text style={{ margin: '0 8px' }}>
                      đến
                    </Text>
                    <Text strong>
                      {todaySchedule.endTime || '—'}
                    </Text>
                  </div>
                </div>
              ) : (
                <Empty description="Không có lịch làm việc hôm nay" />
              )}
            </Col>
            <Col xs={24} md={8} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {todaySchedule && !todayAttendance && (
                <Button
                  type="primary"
                  size="large"
                  icon={<ClockCircleOutlined />}
                  onClick={handleCheckIn}
                >
                  Chấm công vào ca
                </Button>
              )}
              {todayAttendance && !todayAttendance.timeOut && (
                <Button
                  danger
                  size="large"
                  icon={<ClockCircleOutlined />}
                  onClick={handleCheckOut}
                >
                  Chấm công ra ca
                </Button>
              )}
            </Col>
          </Row>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Tổng số lịch làm việc"
                value={stats.totalSchedules}
                prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Lịch đã xác nhận"
                value={stats.confirmedSchedules}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix={stats.totalSchedules > 0 ? `${Math.round(stats.confirmedSchedules / stats.totalSchedules * 100)}%` : '0%'}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Tổng số chấm công"
                value={stats.totalAttendances}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Đi làm đúng giờ"
                value={stats.onTimeAttendances}
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                suffix={stats.totalAttendances > 0 ? `${Math.round(stats.onTimeAttendances / stats.totalAttendances * 100)}%` : '0%'}
              />
            </Card>
          </Col>
        </Row>
        
        <Spin spinning={loading}>
          <Card 
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)', width: '100%', overflowX: 'auto' }}
            tabList={[
              {
                key: 'schedule',
                tab: (
                  <span>
                    <ScheduleOutlined /> Lịch làm việc
                  </span>
                ),
              },
              {
                key: 'attendance',
                tab: (
                  <span>
                    <FileSearchOutlined /> Lịch sử chấm công
                  </span>
                ),
              },
            ]}
            activeTabKey={activeTab}
            onTabChange={key => setActiveTab(key)}
          >
            {activeTab === 'schedule' ? (
              <Table 
                dataSource={schedules} 
                columns={scheduleColumns} 
                rowKey={record => record.id || Math.random().toString()}
                bordered 
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Không có dữ liệu lịch làm việc' }}
                style={{ minWidth: '800px' }}
              />
            ) : (
              <Table 
                dataSource={attendances} 
                columns={attendanceColumns} 
                rowKey={record => record.id || Math.random().toString()}
                bordered 
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Không có dữ liệu chấm công' }}
                style={{ minWidth: '800px' }}
              />
            )}
          </Card>
        </Spin>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage; 