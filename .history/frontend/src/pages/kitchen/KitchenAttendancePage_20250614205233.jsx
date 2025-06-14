import React, { useState, useEffect } from 'react';
import { 
  Typography, Spin, message, Card, Table, Tag, Button, 
  Row, Col, DatePicker, Space, Badge, Empty
} from 'antd';
import { 
  CalendarOutlined, ReloadOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import KitchenLayout from '../../layouts/KitchenLayout';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title, Text } = Typography;

const KitchenAttendancePage = () => {
  const [mySchedules, setMySchedules] = useState([]);
  const [myAttendances, setMyAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('schedule');

  console.log("Rendering KitchenAttendancePage");

  // Fetch dữ liệu khi component mount và khi tháng thay đổi
  useEffect(() => {
    console.log("useEffect triggered");
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      console.log("Fetching data...");
      setLoading(true);
      setError(null);
      
      // Tạo tham số truy vấn
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      console.log(`Fetching data for month: ${month}, year: ${year}`);
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      console.log("Token from localStorage:", token ? "Token exists" : "No token");
      
      // Lấy thông tin user từ localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.id) {
        console.error("No user found in localStorage");
        message.error('Không tìm thấy thông tin người dùng');
        setLoading(false);
        return;
      }
      
      // Lấy danh sách lịch làm việc
      console.log("Fetching schedules...");
      console.log(`API URL: ${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`);
      
      const schedulesResponse = await axios.get(`${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Schedules response:', schedulesResponse);
      console.log('Schedule data received:', schedulesResponse.data);
      
      // Process schedule data
      const scheduleData = Array.isArray(schedulesResponse.data) 
        ? schedulesResponse.data.map((item, index) => ({ ...item, key: item.id || `sch-${index}` }))
        : [];
      console.log("Processed schedule data:", scheduleData);
      setMySchedules(scheduleData);
      
      // Lấy danh sách chấm công
      console.log("Fetching attendances...");
      const attendancesResponse = await axios.get(`${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Attendances response:', attendancesResponse);
      console.log('Attendance data received:', attendancesResponse.data);
      
      // Process attendance data
      const attendanceData = Array.isArray(attendancesResponse.data) 
        ? attendancesResponse.data.map((item, index) => ({ ...item, key: item.id || `att-${index}` }))
        : [];
      console.log("Processed attendance data:", attendanceData);
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
    const token = localStorage.getItem('token');
    console.log(`Confirming schedule with id: ${id}`);
    axios.post(`${API_URL}/api/schedule/confirm/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
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
    const token = localStorage.getItem('token');
    console.log("Clock in attempt");
    axios.post(`${API_URL}/api/attendance/check-in`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((response) => {
      console.log('Clock in response:', response.data);
      message.success('Đã chấm công vào ca thành công');
      fetchData();
    })
    .catch(error => {
      console.error("Error clocking in:", error);
      message.error(error.response?.data?.message || 'Không thể chấm công vào ca');
    });
  };
  
  // Chấm công ra ca
  const handleClockOut = () => {
    const token = localStorage.getItem('token');
    console.log("Clock out attempt");
    axios.post(`${API_URL}/api/attendance/check-out`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((response) => {
      console.log('Clock out response:', response.data);
      message.success('Đã chấm công ra ca thành công');
      fetchData();
    })
    .catch(error => {
      console.error("Error clocking out:", error);
      message.error(error.response?.data?.message || 'Không thể chấm công ra ca');
    });
  };

  // Columns cho Table
  const scheduleColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A',
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
        return shifts[shift] || shift || 'N/A';
      }
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => `${record.startTime || '—'} - ${record.endTime || '—'}`
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
        return statuses[status] || status || 'N/A';
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        record.status === 'scheduled' && (
          <Button onClick={() => handleConfirmSchedule(record.id)}>Xác nhận</Button>
        )
      )
    }
  ];
  
  const attendanceColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Giờ vào',
      dataIndex: 'timeIn',
      key: 'timeIn',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Giờ ra',
      dataIndex: 'timeOut',
      key: 'timeOut',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statuses = {
          'present': <Badge status="success" text="Có mặt" />,
          'absent': <Badge status="error" text="Vắng mặt" />,
          'late': <Badge status="warning" text="Đi muộn" />
        };
        return statuses[status] || status || 'N/A';
      }
    }
  ];

  console.log('schedules length:', mySchedules?.length || 0);
  console.log('attendances length:', myAttendances?.length || 0);

  return (
    <KitchenLayout>
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: '0 0 10px 0' }}>
            <CalendarOutlined style={{ marginRight: 8 }} /> Chấm công & Lịch làm việc
          </Title>
          
          <Space wrap>
            <DatePicker
              picker="month"
              locale={locale}
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date || dayjs())}
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
        <Spin spinning={loading} tip="Đang tải dữ liệu...">
          <Card
            tabList={[
              { key: 'schedule', tab: 'Lịch làm việc của tôi' },
              { key: 'attendance', tab: 'Chấm công của tôi' }
            ]}
            activeTabKey={activeTab}
            onTabChange={(key) => setActiveTab(key)}
            style={{ width: '100%' }}
          >
            {activeTab === 'schedule' ? (
              mySchedules && mySchedules.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    dataSource={mySchedules}
                    columns={scheduleColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10 }}
                    bordered
                  />
                </div>
              ) : (
                <Empty 
                  description="Không có lịch làm việc nào trong tháng này"
                  style={{ margin: '40px 0' }}
                />
              )
            ) : (
              myAttendances && myAttendances.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    dataSource={myAttendances}
                    columns={attendanceColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10 }}
                    bordered
                  />
                </div>
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
                  style={{ margin: '40px 0' }}
                />
              )
            )}
          </Card>
        </Spin>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
