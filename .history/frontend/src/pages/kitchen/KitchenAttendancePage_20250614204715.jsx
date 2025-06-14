import React, { useState, useEffect } from 'react';
import { 
  Typography, Tabs, Spin, message, Card, Table, Tag, Button, 
  Row, Col, DatePicker, Space, Badge, Modal, Empty
} from 'antd';
import { 
  CalendarOutlined, ReloadOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import KitchenLayout from '../../layouts/KitchenLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';
import 'dayjs/locale/vi';

// Đặt ngôn ngữ tiếng Việt cho dayjs
dayjs.locale('vi');

const { Title, Text } = Typography;

const KitchenAttendancePage = () => {
  // States cơ bản
  const [mySchedules, setMySchedules] = useState([]);
  const [myAttendances, setMyAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('schedule');
  const [error, setError] = useState(null);

  // Fetch dữ liệu khi mount hoặc khi thay đổi tháng
  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Hàm fetch dữ liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tạo tham số truy vấn
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      
      // Lấy thông tin user từ localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.id) {
        message.error('Không tìm thấy thông tin người dùng');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching data for month: ${month}, year: ${year}`);

      // Lấy danh sách lịch làm việc
      const schedulesResponse = await axios.get(`${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Schedules response:', schedulesResponse);
      console.log('Schedule data received:', schedulesResponse.data);
      
      const scheduleData = Array.isArray(schedulesResponse.data) 
        ? schedulesResponse.data.map(item => ({ ...item, key: item.id || `sch-${Math.random()}` }))
        : [];
      
      setMySchedules(scheduleData);
      
      // Lấy danh sách chấm công
      const attendancesResponse = await axios.get(`${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Attendances response:', attendancesResponse);
      console.log('Attendance data received:', attendancesResponse.data);
      
      const attendanceData = Array.isArray(attendancesResponse.data) 
        ? attendancesResponse.data.map(item => ({ ...item, key: item.id || `att-${Math.random()}` }))
        : [];
      
      setMyAttendances(attendanceData);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", error.response ? error.response.data : 'No response data');
      setError(`Lỗi khi tải dữ liệu: ${error.message}`);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
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
      message.error('Không thể xác nhận lịch làm việc: ' + error.message);
    });
  };
  
  // Chấm công vào/ra ca
  const handleClockIn = () => {
    axios.post(`${API_URL}/api/attendance/check-in`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      message.success('Đã chấm công vào ca thành công');
      fetchData();
    })
    .catch(error => {
      message.error(error.response?.data?.message || 'Không thể chấm công vào ca');
    });
  };
  
  const handleClockOut = () => {
    axios.post(`${API_URL}/api/attendance/check-out`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      message.success('Đã chấm công ra ca thành công');
      fetchData();
    })
    .catch(error => {
      message.error(error.response?.data?.message || 'Không thể chấm công ra ca');
    });
  };

  // Columns cho Table
  const scheduleColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: text => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'shift',
      key: 'shift',
      render: shift => {
        const shifts = {
          'morning': <Tag color="blue">Ca sáng</Tag>,
          'afternoon': <Tag color="green">Ca chiều</Tag>,
          'evening': <Tag color="purple">Ca tối</Tag>,
          'night': <Tag color="magenta">Ca đêm</Tag>,
          'full_day': <Tag color="red">Cả ngày</Tag>,
        };
        return shifts[shift] || shift;
      }
    },
    {
      title: 'Thời gian',
      render: (_, record) => `${record.startTime || '—'} - ${record.endTime || '—'}`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const statuses = {
          'scheduled': <Badge status="default" text="Đã lên lịch" />,
          'confirmed': <Badge status="processing" text="Đã xác nhận" />,
          'completed': <Badge status="success" text="Đã hoàn thành" />,
          'cancelled': <Badge status="error" text="Đã hủy" />
        };
        return statuses[status] || status;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'scheduled' && (
            <Button onClick={() => handleConfirmSchedule(record.id)}>Xác nhận</Button>
          )}
        </Space>
      )
    }
  ];
  
  const attendanceColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: text => dayjs(text).format('DD/MM/YYYY')
    },
    {
      title: 'Giờ vào',
      dataIndex: 'timeIn',
      key: 'timeIn'
    },
    {
      title: 'Giờ ra',
      dataIndex: 'timeOut',
      key: 'timeOut'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const statuses = {
          'present': <Badge status="success" text="Có mặt" />,
          'absent': <Badge status="error" text="Vắng mặt" />,
          'late': <Badge status="warning" text="Đi muộn" />
        };
        return statuses[status] || status;
      }
    }
  ];

  return (
    <KitchenLayout>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>
            <CalendarOutlined /> Chấm công & Lịch làm việc
          </Title>
          
          <Space>
            <DatePicker
              picker="month"
              locale={locale}
              value={selectedMonth}
              onChange={date => setSelectedMonth(date || dayjs())}
              format="MM/YYYY"
            />
            <Button onClick={fetchData} icon={<ReloadOutlined />}>
              Làm mới
            </Button>
            <Button type="primary" style={{ backgroundColor: 'green' }} onClick={handleClockIn}>
              Chấm công vào
            </Button>
            <Button type="primary" danger onClick={handleClockOut}>
              Chấm công ra
            </Button>
          </Space>
        </div>
        
        {/* Hiển thị lỗi nếu có */}
        {error && (
          <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
            {error}
          </div>
        )}
        
        {/* Tab nội dung */}
        <Spin spinning={loading}>
          <Card
            tabList={[
              { key: 'schedule', tab: 'Lịch làm việc của tôi' },
              { key: 'attendance', tab: 'Chấm công của tôi' }
            ]}
            activeTabKey={activeTab}
            onTabChange={key => setActiveTab(key)}
          >
            {activeTab === 'schedule' ? (
              // Tab lịch làm việc
              <>
                {console.log('Rendering schedules:', mySchedules)}
                {mySchedules && mySchedules.length > 0 ? (
                  <Table
                    dataSource={mySchedules}
                    columns={scheduleColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10 }}
                  />
                ) : (
                  <Empty description="Không có lịch làm việc nào trong tháng này" />
                )}
              </>
            ) : (
              // Tab chấm công
              <>
                {console.log('Rendering attendances:', myAttendances)}
                {myAttendances && myAttendances.length > 0 ? (
                  <Table
                    dataSource={myAttendances}
                    columns={attendanceColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10 }}
                  />
                ) : (
                  <Empty 
                    description={
                      <div>
                        <p>Không có dữ liệu chấm công nào trong tháng này</p>
                        <div style={{ marginTop: '20px' }}>
                          <Space>
                            <Button type="primary" style={{ backgroundColor: 'green' }} onClick={handleClockIn}>
                              Chấm công vào
                            </Button>
                            <Button type="primary" danger onClick={handleClockOut}>
                              Chấm công ra
                            </Button>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                )}
              </>
            )}
          </Card>
        </Spin>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
