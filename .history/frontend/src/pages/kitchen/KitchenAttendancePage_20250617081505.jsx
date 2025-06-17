import React, { useState, useEffect } from 'react';
import { 
  Typography, Spin, message, Card, Table, Tag, Button, 
  Row, Col, DatePicker, Statistic, Space, Divider, Badge,
  Empty, Tabs, Modal, Input, notification
} from 'antd';
import { 
  UserOutlined, CalendarOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ScheduleOutlined, FileSearchOutlined,
  ReloadOutlined, CloseOutlined, CheckOutlined
} from '@ant-design/icons';
import KitchenLayout from '../../layouts/KitchenLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
  
  // State cho modal từ chối
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  // State cho modal đăng ký lịch làm việc
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registerDate, setRegisterDate] = useState(null);
  const [registerShift, setRegisterShift] = useState(null);
  const [registerNote, setRegisterNote] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // State cho modal thông báo lỗi
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalTitle, setErrorModalTitle] = useState('');

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
  
  // Hiển thị modal từ chối lịch làm việc
  const showRejectModal = (scheduleId) => {
    setSelectedScheduleId(scheduleId);
    setRejectModalVisible(true);
  };
  
  // Xử lý từ chối lịch làm việc
  const handleRejectSchedule = async () => {
    if (!selectedScheduleId) return;
    
    try {
      await axios.put(`${API_URL}/api/schedule/reject/${selectedScheduleId}`, 
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      notification.success({
        message: 'Thành công',
        description: 'Đã từ chối lịch làm việc',
        placement: 'topRight',
        duration: 5,
      });
      setRejectModalVisible(false);
      setRejectReason('');
      fetchData();
    } catch (error) {
      console.error("Error rejecting schedule:", error);
      const errorMessage = error.response?.data?.message || 'Không thể từ chối lịch làm việc';
      notification.error({
        message: 'Lỗi từ chối lịch',
        description: errorMessage,
        placement: 'topRight',
        duration: 10,
      });
    }
  };

  // Check in
  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/api/attendance/check-in`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      notification.success({
        message: 'Thành công',
        description: 'Chấm công vào ca thành công',
        placement: 'topRight',
        duration: 5,
      });
      fetchData();
    } catch (error) {
      console.error("Error checking in:", error);
      console.log("Error response data:", error.response?.data);
      
      // Hiển thị thông báo lỗi từ server bằng nhiều cách
      const errorMessage = error.response?.data?.message || 'Không thể chấm công vào ca';
      
      // Hiển thị modal lỗi thay vì alert
      setErrorModalTitle('Lỗi chấm công');
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
      
      // Vẫn giữ notification cho người dùng nhận biết nhanh
      notification.error({
        message: 'Lỗi chấm công',
        description: errorMessage,
        placement: 'topRight',
        duration: 10,
      });
    }
  };

  // Check out
  const handleCheckOut = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/attendance/check-out`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      notification.success({
        message: 'Thành công',
        description: 'Chấm công kết thúc ca thành công',
        placement: 'topRight',
        duration: 5,
      });
      fetchData();
    } catch (error) {
      console.error("Error checking out:", error);
      console.log("Error response data:", error.response?.data);
      
      // Hiển thị thông báo lỗi từ server bằng nhiều cách
      const errorMessage = error.response?.data?.message || 'Không thể chấm công kết thúc ca';
      
      // Hiển thị modal lỗi thay vì alert
      setErrorModalTitle('Lỗi chấm công ra ca');
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
      
      // Vẫn giữ notification cho người dùng nhận biết nhanh
      notification.error({
        message: 'Lỗi chấm công ra ca',
        description: errorMessage,
        placement: 'topRight',
        duration: 10,
      });
    }
  };

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
          'rejected': <Badge status="error" text="Đã từ chối" />,
        };
        return statuses[status] || status;
      },
      filters: [
        { text: 'Đã lên lịch', value: 'scheduled' },
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Đã hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
        { text: 'Đã từ chối', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text, record) => (
        <>
          {text && <div>{text}</div>}
          {record.rejectReason && (
            <div>
              <Text type="danger">Lý do từ chối: {record.rejectReason}</Text>
            </div>
          )}
          {!text && !record.rejectReason && '—'}
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'scheduled') {
          if (record.createdBy === 'staff') {
            // Nhân viên tự đăng ký: chỉ cho phép hủy
            return (
              <Button danger size="small" onClick={() => handleCancelSchedule(record.id)}>
                Hủy
              </Button>
            );
          } else {
            // Lịch do admin tạo: xác nhận hoặc từ chối
            return (
              <Space>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => handleConfirmSchedule(record.id)}
                >
                  Xác nhận
                </Button>
                <Button 
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => showRejectModal(record.id)}
                >
                  Từ chối
                </Button>
              </Space>
            );
          }
        }
        return null;
      }
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

  // Hàm mở modal đăng ký
  const showRegisterModal = () => {
    setRegisterDate(null);
    setRegisterShift(null);
    setRegisterNote('');
    setRegisterModalVisible(true);
  };

  // Hàm gửi đăng ký lịch làm việc
  const handleRegisterSchedule = async () => {
    if (!registerDate || !registerShift) {
      message.error('Vui lòng chọn ngày và ca làm việc!');
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/schedule/register`, {
        date: registerDate.format('YYYY-MM-DD'),
        shift: registerShift,
        note: registerNote
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success(res.data?.message || 'Đăng ký lịch làm việc thành công!');
      setRegisterModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng ký lịch làm việc thất bại!');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Thêm hàm hủy lịch làm việc
  const handleCancelSchedule = async (scheduleId) => {
    if (!scheduleId) return;
    try {
      await axios.delete(`${API_URL}/api/schedule/cancel/${scheduleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Đã hủy đăng ký ca làm việc!');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Hủy ca làm việc thất bại!');
    }
  };

  return (
    <KitchenLayout>
      <div style={{ position: 'relative', top: -85, left: -260 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: 12 }} />
              Chấm công & Lịch làm việc
            </Title>
          </Col>
          <Col>
            <Space>
              <DatePicker
                picker="month"
                locale={locale}
                value={selectedMonth}
                onChange={handleMonthChange}
                format="MM/YYYY"
                allowClear={false}
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
            marginBottom: '20px', 
            padding: '10px', 
            border: '1px solid #ffccc7', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}
        
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card variant="outlined" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Tổng số lịch làm việc"
                value={stats.totalSchedules}
                prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="outlined" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Lịch đã xác nhận"
                value={stats.confirmedSchedules}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix={stats.totalSchedules > 0 ? `${Math.round(stats.confirmedSchedules / stats.totalSchedules * 100)}%` : '0%'}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="outlined" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
              <Statistic
                title="Tổng số chấm công"
                value={stats.totalAttendances}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="outlined" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
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
            variant="outlined"
            style={{ marginTop: '16px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
          >
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'schedule',
                  label: (
                    <span>
                      <ScheduleOutlined /> Lịch làm việc
                    </span>
                  ),
                  children: (
                    <div>
                      <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" onClick={showRegisterModal} icon={<ScheduleOutlined />}>Đăng ký lịch làm việc</Button>
                        {todaySchedule && todaySchedule.status === 'scheduled' && (
                          <>
                            <Button 
                              type="primary" 
                              icon={<CheckOutlined />} 
                              onClick={() => handleConfirmSchedule(todaySchedule.id)}
                            >
                              Xác nhận ca làm việc hôm nay
                            </Button>
                            <Button 
                              danger 
                              icon={<CloseOutlined />} 
                              onClick={() => showRejectModal(todaySchedule.id)}
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                      </Space>
                      
                      <Table 
                        dataSource={schedules} 
                        columns={scheduleColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        bordered
                      />
                    </div>
                  )
                },
                {
                  key: 'attendance',
                  label: (
                    <span>
                      <UserOutlined /> Chấm công
                    </span>
                  ),
                  children: (
                    <div>
                      <Space style={{ marginBottom: 16 }}>
                        {todaySchedule && (todaySchedule.status === 'confirmed' || todaySchedule.status === 'scheduled') && !todayAttendance && (
                          <Button 
                            type="primary" 
                            onClick={handleCheckIn}
                          >
                            Chấm công vào ca
                          </Button>
                        )}
                        
                        {todayAttendance && !todayAttendance.timeOut && (
                          <Button 
                            type="primary" 
                            danger 
                            onClick={handleCheckOut}
                          >
                            Chấm công kết thúc ca
                          </Button>
                        )}
                      </Space>
                      
                      <Table 
                        dataSource={attendances} 
                        columns={attendanceColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        bordered
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Spin>
        
        {/* Modal từ chối lịch làm việc */}
        <Modal
          title="Từ chối lịch làm việc"
          visible={rejectModalVisible}
          onOk={handleRejectSchedule}
          onCancel={() => setRejectModalVisible(false)}
          okText="Xác nhận từ chối"
          cancelText="Hủy"
        >
          <p>Vui lòng nhập lý do từ chối lịch làm việc này:</p>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
          />
        </Modal>

        {/* Modal đăng ký lịch làm việc */}
        <Modal
          title="Đăng ký lịch làm việc"
          visible={registerModalVisible}
          onOk={handleRegisterSchedule}
          onCancel={() => setRegisterModalVisible(false)}
          okText="Đăng ký"
          cancelText="Hủy"
          confirmLoading={registerLoading}
        >
          <div style={{ marginBottom: 12 }}>
            <b>Chọn ngày:</b>
            <DatePicker 
              style={{ width: '100%' }} 
              value={registerDate} 
              onChange={setRegisterDate} 
              format="DD/MM/YYYY" 
              disabledDate={d => d && d < dayjs().startOf('day')}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <b>Chọn ca làm việc:</b>
            <select 
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d9d9d9' }}
              value={registerShift || ''}
              onChange={e => setRegisterShift(e.target.value)}
            >
              <option value="" disabled>Chọn ca</option>
              <option value="morning">Ca sáng</option>
              <option value="afternoon">Ca chiều</option>
              <option value="evening">Ca tối</option>
              <option value="night">Ca đêm</option>
              <option value="full_day">Cả ngày</option>
            </select>
          </div>
          <div>
            <b>Ghi chú (nếu có):</b>
            <TextArea 
              rows={3} 
              value={registerNote} 
              onChange={e => setRegisterNote(e.target.value)} 
              placeholder="Nhập ghi chú..." 
            />
          </div>
        </Modal>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage; 