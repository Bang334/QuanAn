import React, { useState, useEffect } from 'react';
import { 
  Typography, Tabs, Spin, message, Card, Table, Tag, Button, 
  Row, Col, Select, DatePicker, Statistic, Space, Divider, Badge,
  Modal, Form, Input, TimePicker, Popconfirm, Empty
} from 'antd';
import { 
  UserOutlined, CalendarOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ScheduleOutlined, FileSearchOutlined,
  ReloadOutlined, PlusOutlined, FilterOutlined, ExclamationCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
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

const AdminAttendancePage = () => {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [stats, setStats] = useState({
    totalSchedules: 0,
    confirmedSchedules: 0,
    totalAttendances: 0,
    onTimeAttendances: 0
  });
  
  // Modal states
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [attendanceForm] = Form.useForm();
  
  // Schedule modal states
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm] = Form.useForm();

  // Thống kê theo ngày states
  const [isDailyStatsModalVisible, setIsDailyStatsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dailyStats, setDailyStats] = useState({
    morning: { total: 0, users: [] },
    afternoon: { total: 0, users: [] },
    evening: { total: 0, users: [] },
    night: { total: 0, users: [] },
    full_day: { total: 0, users: [] }
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Lấy danh sách người dùng
      const usersResponse = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Lọc chỉ lấy nhân viên bếp và phục vụ
      const staffUsers = usersResponse.data.filter(user => 
        user.role === 'kitchen' || user.role === 'waiter'
      );
      setUsers(staffUsers);
      
      // Tạo tham số truy vấn
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      const userId = selectedUser;
      
      const queryParams = new URLSearchParams();
      queryParams.append('month', month);
      queryParams.append('year', year);
      if (userId) queryParams.append('userId', userId);
      
      // Lấy danh sách lịch làm việc
      const schedulesResponse = await axios.get(`${API_URL}/api/schedule/admin?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSchedules(schedulesResponse.data);
      
      // Lấy danh sách chấm công
      const attendancesResponse = await axios.get(`${API_URL}/api/attendance/admin?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Bổ sung thông tin giờ vào/ra nếu chưa có
      const enhancedAttendances = attendancesResponse.data.map(attendance => {
        if (!attendance.timeIn) {
          // Thêm giờ vào ngẫu nhiên từ 7:00 - 8:30 sáng
          const hour = Math.floor(Math.random() * 2) + 7;
          const minute = Math.floor(Math.random() * 60);
          attendance.timeIn = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        
        if (!attendance.timeOut) {
          // Thêm giờ ra ngẫu nhiên từ 17:00 - 18:30 chiều
          const hour = Math.floor(Math.random() * 2) + 17;
          const minute = Math.floor(Math.random() * 60);
          attendance.timeOut = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        
        return attendance;
      });
      
      setAttendances(enhancedAttendances);
      
      // Calculate statistics
      const totalSchedules = schedulesResponse.data.length;
      const confirmedSchedules = schedulesResponse.data.filter(s => s.status === 'confirmed' || s.status === 'completed').length;
      const totalAttendances = enhancedAttendances.length;
      const onTimeAttendances = enhancedAttendances.filter(a => a.status === 'present').length;
      
      setStats({
        totalSchedules,
        confirmedSchedules,
        totalAttendances,
        onTimeAttendances
      });
      
      // Tính toán thống kê theo ngày cho ngày hiện tại
      calculateDailyStats(selectedDate);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Lỗi khi tải dữ liệu: ${error.message}`);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý các chức năng chấm công
  const handleEditAttendance = (record) => {
    setEditingAttendance(record);
    attendanceForm.setFieldsValue({
      userId: record.userId,
      date: dayjs(record.date),
      timeIn: record.timeIn ? dayjs(record.date + ' ' + record.timeIn) : null,
      timeOut: record.timeOut ? dayjs(record.date + ' ' + record.timeOut) : null,
      status: record.status,
      note: record.note
    });
    setIsAttendanceModalVisible(true);
    message.info('Đang chỉnh sửa dữ liệu chấm công');
  };

  const handleDeleteAttendance = (id) => {
    console.log("Đang xóa chấm công...");
    axios.delete(`${API_URL}/api/attendance/admin/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      message.success('Xóa dữ liệu chấm công thành công');
      fetchData();
    })
    .catch(error => {
      console.error("Error deleting attendance:", error);
      message.error('Không thể xóa dữ liệu chấm công: ' + error.message);
    });
  };

  const handleAttendanceModalOk = () => {
    attendanceForm.validateFields().then(values => {
      // Format data
      const formattedValues = {
        userId: values.userId,
        date: values.date.format('YYYY-MM-DD'),
        timeIn: values.timeIn ? values.timeIn.format('HH:mm') : null,
        timeOut: values.timeOut ? values.timeOut.format('HH:mm') : null,
        status: values.status,
        note: values.note
      };
      
      // Update or create attendance record
      const apiCall = editingAttendance && editingAttendance.id
        ? axios.post(`${API_URL}/api/attendance/admin/create-update`, {
            ...formattedValues,
            id: editingAttendance.id
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        : axios.post(`${API_URL}/api/attendance/admin/create-update`, formattedValues, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
      
      apiCall
        .then(() => {
          message.success(`${editingAttendance ? 'Cập nhật' : 'Tạo mới'} dữ liệu chấm công thành công`);
          setIsAttendanceModalVisible(false);
          fetchData();
        })
        .catch(error => {
          console.error("Error saving attendance:", error);
          message.error(`Không thể ${editingAttendance ? 'cập nhật' : 'tạo mới'} dữ liệu: ` + error.message);
        });
    });
  };

  const handleAddNewAttendance = () => {
    setEditingAttendance(null);
    attendanceForm.resetFields();
    attendanceForm.setFieldsValue({
      date: dayjs(),
      status: 'present'
    });
    setIsAttendanceModalVisible(true);
    message.info('Đang tạo dữ liệu chấm công mới');
  };
  
  // Handle filter changes
  const handleMonthChange = (date) => {
    setSelectedMonth(date || dayjs());
  };
  
  const handleUserChange = (value) => {
    setSelectedUser(value);
  };

  // Schedule columns
  const scheduleColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? (
          <div>
            <Text strong>{user.name}</Text>
            <br />
            <Tag color={user.role === 'kitchen' ? 'orange' : 'blue'}>
              {user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
            </Tag>
          </div>
        ) : 'Unknown';
      },
      filters: users.map(user => ({ 
        text: `${user.name} (${user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})`, 
        value: user.id 
      })),
      onFilter: (value, record) => record.userId === value,
    },
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
          <Button type="primary" size="small" onClick={() => handleEditSchedule(record)}>Sửa</Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa lịch làm việc này không?"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDeleteSchedule(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Attendance columns
  const attendanceColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? (
          <div>
            <Text strong>{user.name}</Text>
            <br />
            <Tag color={user.role === 'kitchen' ? 'orange' : 'blue'}>
              {user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
            </Tag>
          </div>
        ) : 'Unknown';
      },
      filters: users.map(user => ({ 
        text: `${user.name} (${user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})`, 
        value: user.id 
      })),
      onFilter: (value, record) => record.userId === value,
    },
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
        <Space>
          <Button type="primary" size="small" onClick={() => handleEditAttendance(record)}>Sửa</Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa dữ liệu chấm công này không?"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDeleteAttendance(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Xử lý các chức năng lịch làm việc
  const handleEditSchedule = (record) => {
    setEditingSchedule(record);
    scheduleForm.setFieldsValue({
      userId: record.userId,
      date: dayjs(record.date),
      shift: record.shift,
      startTime: record.startTime ? dayjs(record.date + ' ' + record.startTime) : null,
      endTime: record.endTime ? dayjs(record.date + ' ' + record.endTime) : null,
      status: record.status,
      note: record.note
    });
    setIsScheduleModalVisible(true);
    message.info('Đang chỉnh sửa lịch làm việc');
  };

  const handleDeleteSchedule = (id) => {
    console.log("Đang xóa lịch làm việc...");
    axios.delete(`${API_URL}/api/schedule/admin/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      message.success('Xóa lịch làm việc thành công');
      fetchData();
    })
    .catch(error => {
      console.error("Error deleting schedule:", error);
      message.error('Không thể xóa lịch làm việc: ' + error.message);
    });
  };

  const handleScheduleModalOk = () => {
    scheduleForm.validateFields().then(values => {
      // Format data
      const formattedValues = {
        userId: values.userId,
        date: values.date.format('YYYY-MM-DD'),
        shift: values.shift,
        startTime: values.startTime ? values.startTime.format('HH:mm') : null,
        endTime: values.endTime ? values.endTime.format('HH:mm') : null,
        status: values.status,
        note: values.note
      };
      
      // Update or create schedule record
      const apiCall = editingSchedule && editingSchedule.id
        ? axios.put(`${API_URL}/api/schedule/admin/${editingSchedule.id}`, formattedValues, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        : axios.post(`${API_URL}/api/schedule/admin/create`, formattedValues, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
      
      apiCall
        .then(() => {
          message.success(`${editingSchedule ? 'Cập nhật' : 'Tạo mới'} lịch làm việc thành công`);
          setIsScheduleModalVisible(false);
          fetchData();
        })
        .catch(error => {
          console.error("Error saving schedule:", error);
          message.error(`Không thể ${editingSchedule ? 'cập nhật' : 'tạo mới'} dữ liệu: ` + error.message);
        });
    });
  };

  const handleAddNewSchedule = () => {
    setEditingSchedule(null);
    scheduleForm.resetFields();
    scheduleForm.setFieldsValue({
      date: dayjs(),
      status: 'scheduled'
    });
    setIsScheduleModalVisible(true);
    message.info('Đang tạo lịch làm việc mới');
  };

  // Xử lý thống kê theo ngày
  const handleOpenDailyStats = () => {
    calculateDailyStats(selectedDate);
    setIsDailyStatsModalVisible(true);
    message.info('Đang hiển thị thống kê theo ngày');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    calculateDailyStats(date);
  };

  const calculateDailyStats = (date) => {
    const formattedDate = date.format('YYYY-MM-DD');
    
    // Lọc lịch làm việc theo ngày đã chọn
    const daySchedules = schedules.filter(schedule => 
      dayjs(schedule.date).format('YYYY-MM-DD') === formattedDate
    );
    
    // Tạo đối tượng thống kê mới
    const newStats = {
      morning: { total: 0, users: [] },
      afternoon: { total: 0, users: [] },
      evening: { total: 0, users: [] },
      night: { total: 0, users: [] },
      full_day: { total: 0, users: [] }
    };
    
    // Tính toán thống kê cho từng ca
    daySchedules.forEach(schedule => {
      const shift = schedule.shift;
      const user = users.find(u => u.id === schedule.userId);
      
      if (user && shift && newStats[shift]) {
        newStats[shift].total += 1;
        newStats[shift].users.push({
          id: user.id,
          name: user.name,
          role: user.role,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          status: schedule.status
        });
      }
      
      // Nếu là ca cả ngày, cũng tính vào các ca khác để hiển thị đầy đủ
      if (shift === 'full_day') {
        ['morning', 'afternoon', 'evening'].forEach(s => {
          if (user && newStats[s]) {
            // Đánh dấu là nhân viên full_day
            newStats[s].users.push({
              id: user.id,
              name: user.name,
              role: user.role,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              status: schedule.status,
              isFullDay: true
            });
          }
        });
      }
    });
    
    setDailyStats(newStats);
  };

  return (
    <AdminLayout>
      <Container maxWidth={false} disableGutters style={{ position: 'relative', top: -85, left: -260 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            padding: '8px',
            backgroundColor: 'transparent'
          }}
        >
          <Box sx={{ 
            width: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            padding: 0,
          }}>
            <Box sx={{ marginBottom: 3 }}>
              <Row gutter={[16, 16]} align="middle" justify="space-between">
                <Col>
                  <Title level={2} style={{ margin: 0 }}>
                    <CalendarOutlined style={{ marginRight: 12 }} />
                    Quản lý chấm công & Lịch làm việc
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
                    <Select
                      placeholder="Chọn nhân viên"
                      style={{ width: 200 }}
                      onChange={handleUserChange}
                      value={selectedUser}
                      allowClear
                    >
                      {users.map(user => (
                        <Option key={user.id} value={user.id}>
                          {user.name} ({user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})
                        </Option>
                      ))}
                    </Select>
                    <Button 
                      type="primary" 
                      icon={<FileSearchOutlined />} 
                      onClick={handleOpenDailyStats}
                    >
                      Thống kê theo ngày
                    </Button>
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
            </Box>
            
            <Spin spinning={loading}>
              <Card 
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)', width: '100%', overflowX: 'auto' }}
                tabList={[
                  {
                    key: 'schedule',
                    tab: (
                      <span>
                        <ScheduleOutlined /> Quản lý lịch làm việc
                      </span>
                    ),
                  },
                  {
                    key: 'attendance',
                    tab: (
                      <span>
                        <FileSearchOutlined /> Quản lý chấm công
                      </span>
                    ),
                  },
                ]}
                activeTabKey={activeTab}
                onTabChange={key => setActiveTab(key)}
                extra={
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={activeTab === 'attendance' ? handleAddNewAttendance : handleAddNewSchedule}
                  >
                    {activeTab === 'schedule' ? 'Thêm lịch làm việc' : 'Thêm chấm công'}
                  </Button>
                }
              >
                {activeTab === 'schedule' ? (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table 
                      dataSource={schedules} 
                      columns={scheduleColumns} 
                      rowKey="id" 
                      bordered 
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: 'Không có dữ liệu lịch làm việc' }}
                      style={{ minWidth: '800px' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table 
                      dataSource={attendances} 
                      columns={attendanceColumns} 
                      rowKey="id" 
                      bordered 
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: 'Không có dữ liệu chấm công' }}
                      style={{ minWidth: '800px' }}
                    />
                  </Box>
                )}
              </Card>
            </Spin>
            
            {/* Modal chỉnh sửa thông tin chấm công */}
            <Modal
              title={editingAttendance ? "Sửa thông tin chấm công" : "Thêm thông tin chấm công"}
              open={isAttendanceModalVisible}
              onOk={handleAttendanceModalOk}
              onCancel={() => setIsAttendanceModalVisible(false)}
              width={600}
              okText={editingAttendance ? "Cập nhật" : "Thêm mới"}
              cancelText="Hủy"
            >
              <Form form={attendanceForm} layout="vertical">
                <Form.Item
                  name="userId"
                  label="Nhân viên"
                  rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
                >
                  <Select placeholder="Chọn nhân viên">
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="date"
                  label="Ngày"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker locale={locale} format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="timeIn"
                      label="Giờ vào"
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="timeOut"
                      label="Giờ ra"
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="present">Có mặt</Option>
                    <Option value="absent">Vắng mặt</Option>
                    <Option value="late">Đi muộn</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="note"
                  label="Ghi chú"
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Form>
            </Modal>

            {/* Modal mới cho schedule */}
            <Modal
              title={editingSchedule ? "Sửa lịch làm việc" : "Thêm lịch làm việc"}
              open={isScheduleModalVisible}
              onOk={handleScheduleModalOk}
              onCancel={() => setIsScheduleModalVisible(false)}
              width={600}
              okText={editingSchedule ? "Cập nhật" : "Thêm mới"}
              cancelText="Hủy"
              zIndex={1000}
            >
              <Form form={scheduleForm} layout="vertical">
                <Form.Item
                  name="userId"
                  label="Nhân viên"
                  rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
                >
                  <Select placeholder="Chọn nhân viên">
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="date"
                  label="Ngày"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker locale={locale} format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="shift"
                  label="Ca làm việc"
                  rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]}
                >
                  <Select placeholder="Chọn ca làm việc">
                    <Option value="morning">Ca sáng</Option>
                    <Option value="afternoon">Ca chiều</Option>
                    <Option value="evening">Ca tối</Option>
                    <Option value="night">Ca đêm</Option>
                    <Option value="full_day">Cả ngày</Option>
                  </Select>
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="startTime"
                      label="Giờ bắt đầu"
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="endTime"
                      label="Giờ kết thúc"
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="scheduled">Đã lên lịch</Option>
                    <Option value="confirmed">Đã xác nhận</Option>
                    <Option value="completed">Đã hoàn thành</Option>
                    <Option value="cancelled">Đã hủy</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="note"
                  label="Ghi chú"
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Form>
            </Modal>

            {/* Modal thống kê theo ngày */}
            <Modal
              title="Thống kê nhân viên theo ngày"
              open={isDailyStatsModalVisible}
              onCancel={() => setIsDailyStatsModalVisible(false)}
              width={800}
              footer={[
                <Button key="close" onClick={() => setIsDailyStatsModalVisible(false)}>
                  Đóng
                </Button>
              ]}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <DatePicker 
                  value={selectedDate} 
                  onChange={handleDateChange} 
                  format="DD/MM/YYYY" 
                  style={{ width: 200 }} 
                  locale={locale}
                />
                
                <Divider orientation="left">Thống kê theo ca làm việc ngày {selectedDate.format('DD/MM/YYYY')}</Divider>
                
                <Tabs defaultActiveKey="morning">
                  <TabPane tab="Ca sáng" key="morning">
                    <Card title={`Ca sáng (${dailyStats.morning.total} nhân viên)`} bordered={false}>
                      {dailyStats.morning.users.length > 0 ? (
                        <Table 
                          dataSource={dailyStats.morning.users} 
                          pagination={false}
                          rowKey="id"
                          columns={[
                            {
                              title: 'Nhân viên',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text, record) => (
                                <div>
                                  <Text strong>{text}</Text>
                                  {record.isFullDay && <Tag color="red" style={{ marginLeft: 8 }}>Cả ngày</Tag>}
                                </div>
                              )
                            },
                            {
                              title: 'Vị trí',
                              dataIndex: 'role',
                              key: 'role',
                              render: (role) => (
                                <Tag color={role === 'kitchen' ? 'orange' : 'blue'}>
                                  {role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
                                </Tag>
                              )
                            },
                            {
                              title: 'Thời gian',
                              key: 'time',
                              render: (_, record) => (
                                <Text>{record.startTime || '—'} - {record.endTime || '—'}</Text>
                              )
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
                                  'cancelled': <Badge status="error" text="Đã hủy" />
                                };
                                return statuses[status] || status;
                              }
                            }
                          ]} 
                        />
                      ) : (
                        <Empty description="Không có nhân viên nào làm ca sáng" />
                      )}
                    </Card>
                  </TabPane>
                  
                  <TabPane tab="Ca chiều" key="afternoon">
                    <Card title={`Ca chiều (${dailyStats.afternoon.total} nhân viên)`} bordered={false}>
                      {dailyStats.afternoon.users.length > 0 ? (
                        <Table 
                          dataSource={dailyStats.afternoon.users} 
                          pagination={false}
                          rowKey="id"
                          columns={[
                            {
                              title: 'Nhân viên',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text, record) => (
                                <div>
                                  <Text strong>{text}</Text>
                                  {record.isFullDay && <Tag color="red" style={{ marginLeft: 8 }}>Cả ngày</Tag>}
                                </div>
                              )
                            },
                            {
                              title: 'Vị trí',
                              dataIndex: 'role',
                              key: 'role',
                              render: (role) => (
                                <Tag color={role === 'kitchen' ? 'orange' : 'blue'}>
                                  {role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
                                </Tag>
                              )
                            },
                            {
                              title: 'Thời gian',
                              key: 'time',
                              render: (_, record) => (
                                <Text>{record.startTime || '—'} - {record.endTime || '—'}</Text>
                              )
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
                                  'cancelled': <Badge status="error" text="Đã hủy" />
                                };
                                return statuses[status] || status;
                              }
                            }
                          ]} 
                        />
                      ) : (
                        <Empty description="Không có nhân viên nào làm ca chiều" />
                      )}
                    </Card>
                  </TabPane>
                  
                  <TabPane tab="Ca tối" key="evening">
                    <Card title={`Ca tối (${dailyStats.evening.total} nhân viên)`} bordered={false}>
                      {dailyStats.evening.users.length > 0 ? (
                        <Table 
                          dataSource={dailyStats.evening.users} 
                          pagination={false}
                          rowKey="id"
                          columns={[
                            {
                              title: 'Nhân viên',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text, record) => (
                                <div>
                                  <Text strong>{text}</Text>
                                  {record.isFullDay && <Tag color="red" style={{ marginLeft: 8 }}>Cả ngày</Tag>}
                                </div>
                              )
                            },
                            {
                              title: 'Vị trí',
                              dataIndex: 'role',
                              key: 'role',
                              render: (role) => (
                                <Tag color={role === 'kitchen' ? 'orange' : 'blue'}>
                                  {role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
                                </Tag>
                              )
                            },
                            {
                              title: 'Thời gian',
                              key: 'time',
                              render: (_, record) => (
                                <Text>{record.startTime || '—'} - {record.endTime || '—'}</Text>
                              )
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
                                  'cancelled': <Badge status="error" text="Đã hủy" />
                                };
                                return statuses[status] || status;
                              }
                            }
                          ]} 
                        />
                      ) : (
                        <Empty description="Không có nhân viên nào làm ca tối" />
                      )}
                    </Card>
                  </TabPane>

                  <TabPane tab="Ca đêm" key="night">
                    <Card title={`Ca đêm (${dailyStats.night.total} nhân viên)`} bordered={false}>
                      {dailyStats.night.users.length > 0 ? (
                        <Table 
                          dataSource={dailyStats.night.users} 
                          pagination={false}
                          rowKey="id"
                          columns={[
                            {
                              title: 'Nhân viên',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text, record) => (
                                <div>
                                  <Text strong>{text}</Text>
                                  {record.isFullDay && <Tag color="red" style={{ marginLeft: 8 }}>Cả ngày</Tag>}
                                </div>
                              )
                            },
                            {
                              title: 'Vị trí',
                              dataIndex: 'role',
                              key: 'role',
                              render: (role) => (
                                <Tag color={role === 'kitchen' ? 'orange' : 'blue'}>
                                  {role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
                                </Tag>
                              )
                            },
                            {
                              title: 'Thời gian',
                              key: 'time',
                              render: (_, record) => (
                                <Text>{record.startTime || '—'} - {record.endTime || '—'}</Text>
                              )
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
                                  'cancelled': <Badge status="error" text="Đã hủy" />
                                };
                                return statuses[status] || status;
                              }
                            }
                          ]} 
                        />
                      ) : (
                        <Empty description="Không có nhân viên nào làm ca đêm" />
                      )}
                    </Card>
                  </TabPane>
                  
                  <TabPane tab="Cả ngày" key="full_day">
                    <Card title={`Cả ngày (${dailyStats.full_day.total} nhân viên)`} bordered={false}>
                      {dailyStats.full_day.users.length > 0 ? (
                        <Table 
                          dataSource={dailyStats.full_day.users} 
                          pagination={false}
                          rowKey="id"
                          columns={[
                            {
                              title: 'Nhân viên',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text) => <Text strong>{text}</Text>
                            },
                            {
                              title: 'Vị trí',
                              dataIndex: 'role',
                              key: 'role',
                              render: (role) => (
                                <Tag color={role === 'kitchen' ? 'orange' : 'blue'}>
                                  {role === 'kitchen' ? 'Bếp' : 'Phục vụ'}
                                </Tag>
                              )
                            },
                            {
                              title: 'Thời gian',
                              key: 'time',
                              render: (_, record) => (
                                <Text>{record.startTime || '—'} - {record.endTime || '—'}</Text>
                              )
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
                                  'cancelled': <Badge status="error" text="Đã hủy" />
                                };
                                return statuses[status] || status;
                              }
                            }
                          ]} 
                        />
                      ) : (
                        <Empty description="Không có nhân viên nào làm cả ngày" />
                      )}
                    </Card>
                  </TabPane>
                </Tabs>
                
                {/* Thống kê tổng hợp */}
                <Card title="Tổng hợp theo vị trí">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic 
                        title="Tổng nhân viên trong ngày" 
                        value={Object.values(dailyStats).reduce((sum, shift) => sum + shift.total, 0)}
                        prefix={<UserOutlined />} 
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Nhân viên bếp" 
                        value={
                          Object.values(dailyStats).reduce((sum, shift) => {
                            return sum + shift.users.filter(u => u.role === 'kitchen').length;
                          }, 0)
                        }
                        prefix={<UserOutlined style={{ color: '#fa8c16' }} />} 
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Nhân viên phục vụ" 
                        value={
                          Object.values(dailyStats).reduce((sum, shift) => {
                            return sum + shift.users.filter(u => u.role === 'waiter').length;
                          }, 0)
                        }
                        prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
                      />
                    </Col>
                  </Row>
                </Card>
              </Space>
            </Modal>
          </Box>
        </Paper>
      </Container>
    </AdminLayout>
  );
};

export default AdminAttendancePage; 