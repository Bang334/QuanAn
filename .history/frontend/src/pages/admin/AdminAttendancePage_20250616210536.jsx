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
  QuestionCircleOutlined, EditOutlined, DeleteOutlined, BarChartOutlined
} from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';
import { Box, Paper, Container } from '@mui/material';
import { getAllAttendances } from '../../services/attendanceService';
import { 
  getAllSchedules, createSchedule, updateSchedule, deleteSchedule 
} from '../../services/scheduleService';

const { Title, Text } = Typography;
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

  // Effect để fetch lại dữ liệu khi các giá trị lọc thay đổi
  useEffect(() => {
    if (users.length > 0) {  // Chỉ fetch dữ liệu khi danh sách users đã được tải
      fetchData();
    }
  }, [selectedMonth, selectedUser]);

  useEffect(() => {
    // Fetch các dữ liệu cần thiết khi component mount
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Lấy danh sách người dùng
        const usersResponse = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Lọc chỉ lấy nhân viên bếp và phục vụ
        const staffUsers = usersResponse.data.filter(user => 
          user.role === 'kitchen' || user.role === 'waiter'
        );
        setUsers(staffUsers);
        
        // Lấy dữ liệu attendances và schedules
        fetchData();
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Không thể tải thông tin người dùng");
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Thiết lập ngày mặc định cho modal thống kê theo ngày
    setSelectedDate(dayjs());
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy thông tin tháng năm cho filter
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      
      // Lấy danh sách chấm công
      const attendanceData = await getAllAttendances(null, selectedUser, month, year, null);
      setAttendances(attendanceData);

      // Lấy danh sách lịch làm việc
      const scheduleData = await getAllSchedules(null, selectedUser, month, year, null, null);
      setSchedules(scheduleData);
      
      // Cập nhật thống kê
      calculateStats(attendanceData, scheduleData);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, maxHeight: 300, overflow: 'auto' }}>
          <Select
            style={{ width: 200, marginBottom: 8 }}
            placeholder="Chọn nhân viên"
            value={selectedKeys[0]}
            onChange={value => setSelectedKeys(value ? [value] : [])}
            options={users.map(user => ({ 
              value: user.id, 
              label: `${user.name} (${user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})` 
            }))}
          />
          <div>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Lọc
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const uniqueDates = Array.from(new Set(schedules.map(s => dayjs(s.date).format('YYYY-MM-DD'))));
        
        return (
          <div style={{ padding: 8, maxHeight: 300, overflow: 'auto' }}>
            <Select
              style={{ width: 150, marginBottom: 8 }}
              placeholder="Chọn ngày"
              value={selectedKeys[0]}
              onChange={value => setSelectedKeys(value ? [value] : [])}
              options={uniqueDates.map(dateStr => ({
                value: dateStr,
                label: dayjs(dateStr).format('DD/MM/YYYY')
              }))}
            />
            <div>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90, marginRight: 8 }}
              >
                Lọc
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  confirm();
                }}
                size="small"
                style={{ width: 90 }}
              >
                Xóa lọc
              </Button>
            </div>
          </div>
        );
      },
      onFilter: (value, record) => dayjs(record.date).format('YYYY-MM-DD') === value,
      defaultFilteredValue: Array.from(new Set(schedules.map(s => dayjs(s.date).format('YYYY-MM-DD')))).includes(dayjs().format('YYYY-MM-DD')) ? [dayjs().format('YYYY-MM-DD')] : undefined,
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift) => {
        const shifts = {
          'morning': <Tag color="blue">Ca sáng</Tag>,
          'afternoon': <Tag color="green">Ca chiều</Tag>,
          'evening': <Tag color="orange">Ca tối</Tag>,
          'night': <Tag color="purple">Ca đêm</Tag>,
          'full_day': <Tag color="red">Cả ngày</Tag>
        };
        return shifts[shift] || shift;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 120, marginBottom: 8 }}
            placeholder="Chọn ca"
            value={selectedKeys[0]}
            onChange={value => setSelectedKeys(value ? [value] : [])}
            options={[
              { value: 'morning', label: 'Ca sáng' },
              { value: 'afternoon', label: 'Ca chiều' },
              { value: 'evening', label: 'Ca tối' },
              { value: 'night', label: 'Ca đêm' },
              { value: 'full_day', label: 'Cả ngày' },
            ]}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Lọc
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      ),
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
          'scheduled': <Badge status="warning" text="Chờ xác nhận" />,
          'confirmed': <Badge status="success" text="Đã xác nhận" />,
          'cancelled': <Badge status="error" text="Đã hủy" />,
          'rejected': <Badge status="default" text="Bị từ chối" />
        };
        return statuses[status] || status;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 150, marginBottom: 8 }}
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={value => setSelectedKeys(value ? [value] : [])}
            options={[
              { value: 'scheduled', label: 'Chờ xác nhận' },
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'cancelled', label: 'Đã hủy' },
              { value: 'rejected', label: 'Bị từ chối' },
            ]}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Lọc
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Tạo bởi',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (text) => text === 'admin' ? 'Admin' : text === 'staff' ? 'Nhân viên' : text || '—',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Nhân viên', value: 'staff' },
      ],
      onFilter: (value, record) => record.createdBy === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'scheduled' && record.createdBy === 'staff') {
          return (
            <Space>
              <Button type="primary" size="small" onClick={() => handleAcceptSchedule(record.id)}>
                Chấp nhận
              </Button>
              <Button danger size="small" onClick={() => handleRejectSchedule(record.id)}>
                Từ chối
              </Button>
            </Space>
          );
        }
        // Nếu được tạo bởi admin, hiển thị Sửa/Xóa như mặc định
        if (record.createdBy === 'admin') {
          return (
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
          );
        }
        // Trường hợp khác (nếu có)
        return null;
      },
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, maxHeight: 300, overflow: 'auto' }}>
          <Select
            style={{ width: 200, marginBottom: 8 }}
            placeholder="Chọn nhân viên"
            value={selectedKeys[0]}
            onChange={value => setSelectedKeys(value ? [value] : [])}
            options={users.map(user => ({ 
              value: user.id, 
              label: `${user.name} (${user.role === 'kitchen' ? 'Bếp' : 'Phục vụ'})` 
            }))}
          />
          <div>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Lọc
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 150, marginBottom: 8 }}
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={value => setSelectedKeys(value ? [value] : [])}
            options={[
              { value: 'present', label: 'Có mặt' },
              { value: 'absent', label: 'Vắng mặt' },
              { value: 'late', label: 'Đi muộn' },
            ]}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Lọc
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '—',
    },
  ];

  // Xử lý các chức năng lịch làm việc
  const handleEditSchedule = (record) => {
    setEditingSchedule(record);
    scheduleForm.setFieldsValue({
      userId: record.userId,
      date: dayjs(record.date),
      shift: record.shift,
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
        date: values.date,  // Giữ nguyên đối tượng dayjs, để scheduleService xử lý
        shift: values.shift,
        status: editingSchedule ? values.status || 'scheduled' : 'scheduled',
        note: values.note
      };
      
      // Kiểm tra dữ liệu trước khi gửi
      if (!formattedValues.userId || !formattedValues.date || !formattedValues.shift) {
        message.error('Vui lòng điền đầy đủ thông tin người dùng, ngày và ca làm việc');
        return;
      }
      
      // Gọi service thay vì API trực tiếp
      const apiCall = editingSchedule && editingSchedule.id
        ? updateSchedule(editingSchedule.id, formattedValues)
        : createSchedule(formattedValues);
      
      apiCall
        .then(() => {
          message.success(`${editingSchedule ? 'Cập nhật' : 'Tạo mới'} lịch làm việc thành công`);
          setIsScheduleModalVisible(false);
          fetchData();
        })
        .catch(error => {
          console.error("Error saving schedule:", error);
          const errorMessage = error.message || `Không thể ${editingSchedule ? 'cập nhật' : 'tạo mới'} dữ liệu`;
          message.error(errorMessage);
        });
    });
  };

  const handleAddNewSchedule = () => {
    setEditingSchedule(null);
    scheduleForm.resetFields();
    
    const currentDate = dayjs();
    console.log("Setting initial date:", currentDate.format('YYYY-MM-DD'));
    
    scheduleForm.setFieldsValue({
      date: currentDate
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
    if (date) {
      calculateDailyStats(date);
    }
  };

  const calculateDailyStats = (date) => {
    if (!date) return;
    
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
      night: { total: 0, users: [] }
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
    });
    
    setDailyStats(newStats);
  };

  const calculateStats = (attendanceData, scheduleData) => {
    // Calculate statistics
    const totalSchedules = scheduleData.length;
    const confirmedSchedules = scheduleData.filter(s => s.status === 'confirmed' || s.status === 'completed').length;
    const totalAttendances = attendanceData.length;
    const onTimeAttendances = attendanceData.filter(a => a.status === 'present').length;
    
    setStats({
      totalSchedules,
      confirmedSchedules,
      totalAttendances,
      onTimeAttendances
    });
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
                <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }} variant="outlined">
                  <Statistic
                    title="Tổng số lịch làm việc"
                    value={stats.totalSchedules}
                    prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }} variant="outlined">
                  <Statistic
                    title="Lịch đã xác nhận"
                    value={stats.confirmedSchedules}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    suffix={stats.totalSchedules > 0 ? `${Math.round(stats.confirmedSchedules / stats.totalSchedules * 100)}%` : '0%'}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }} variant="outlined">
                  <Statistic
                    title="Tổng số chấm công"
                    value={stats.totalAttendances}
                    prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }} variant="outlined">
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
                variant="outlined"
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
              <Form
                form={scheduleForm}
                layout="vertical"
              >
                <Form.Item
                  name="userId"
                  label="Nhân viên"
                  rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
                >
                  <Select placeholder="Chọn nhân viên">
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'kitchen' ? 'Bếp' : user.role === 'waiter' ? 'Phục vụ' : user.role})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="date"
                  label="Ngày"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker 
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }} 
                    locale={locale}
                    onChange={(date) => {
                      console.log("Selected date:", date ? date.format('YYYY-MM-DD') : null);
                    }}
                  />
                </Form.Item>
                
                <Form.Item
                  name="shift"
                  label="Ca làm việc"
                  rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]}
                >
                  <Select placeholder="Chọn ca làm việc">
                    <Option value="morning">Ca sáng (6:00 - 12:00)</Option>
                    <Option value="afternoon">Ca chiều (12:00 - 18:00)</Option>
                    <Option value="evening">Ca tối (18:00 - 00:00)</Option>
                    <Option value="night">Ca đêm (00:00 - 6:00)</Option>
                  </Select>
                </Form.Item>
                
                {editingSchedule && (
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select placeholder="Chọn trạng thái">
                      <Option value="scheduled">Đã lên lịch</Option>
                      <Option value="confirmed">Đã xác nhận</Option>
                      <Option value="cancelled">Đã hủy</Option>
                    </Select>
                  </Form.Item>
                )}
                
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
                
                <Divider orientation="left">Thống kê theo ca làm việc ngày {selectedDate ? selectedDate.format('DD/MM/YYYY') : ''}</Divider>
                
                <Tabs defaultActiveKey="morning"
                  items={[
                    {
                      key: 'morning',
                      label: 'Ca sáng',
                      children: (
                        <Card title={`Ca sáng (${dailyStats.morning.total} nhân viên)`} variant="outlined">
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
                      )
                    },
                    {
                      key: 'afternoon',
                      label: 'Ca chiều',
                      children: (
                        <Card title={`Ca chiều (${dailyStats.afternoon.total} nhân viên)`} variant="outlined">
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
                      )
                    },
                    {
                      key: 'evening',
                      label: 'Ca tối',
                      children: (
                        <Card title={`Ca tối (${dailyStats.evening.total} nhân viên)`} variant="outlined">
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
                      )
                    },
                    {
                      key: 'night',
                      label: 'Ca đêm',
                      children: (
                        <Card title={`Ca đêm (${dailyStats.night.total} nhân viên)`} variant="outlined">
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
                      )
                    }
                  ]}
                />
                
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