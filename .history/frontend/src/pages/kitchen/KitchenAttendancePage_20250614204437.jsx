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
      // Đảm bảo dữ liệu trả về là mảng
      const scheduleData = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : [];
      setMySchedules(scheduleData);
      
      // Lấy danh sách chấm công của tôi
      const attendancesResponse = await axios.get(`${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Attendance data received:', attendancesResponse.data);
      // Đảm bảo dữ liệu trả về là mảng
      const attendanceData = Array.isArray(attendancesResponse.data) ? attendancesResponse.data : [];
      setMyAttendances(attendanceData);
      
      // Calculate statistics
      const totalSchedules = scheduleData.length;
      const confirmedSchedules = scheduleData.filter(s => s.status === 'confirmed' || s.status === 'completed').length;
      const totalAttendances = attendanceData.length;
      const onTimeAttendances = attendanceData.filter(a => a.status === 'present').length;
      const lateAttendances = attendanceData.filter(a => a.status === 'late').length;
      
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
        <div>
            Haha
        </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
