import React, { useState, useEffect } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';
import { API_URL } from '../../config';
import KitchenLayout from '../../layouts/KitchenLayout';

const KitchenAttendancePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy dữ liệu khi trang được tải
  useEffect(() => {
    fetchData();
  }, []);

  // Hàm lấy dữ liệu từ API
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Token exists' : 'No token');
      
      // Lấy thông tin current month và year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      console.log(`Fetching data for month: ${month}, year: ${year}`);

      // Lấy lịch làm việc
      console.log(`${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`);
      const schedulesResponse = await axios.get(
        `${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Schedules response:', schedulesResponse);
      console.log('Schedule data:', schedulesResponse.data);
      setSchedules(schedulesResponse.data || []);

      // Lấy chấm công
      console.log(`${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`);
      const attendancesResponse = await axios.get(
        `${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Attendances response:', attendancesResponse);
      console.log('Attendance data:', attendancesResponse.data);
      setAttendances(attendancesResponse.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Không thể tải dữ liệu từ API');
    } finally {
      setLoading(false);
    }
  };

  // Cột đơn giản cho lịch làm việc
  const scheduleColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
    { title: 'Ca', dataIndex: 'shift', key: 'shift' },
    { title: 'Giờ bắt đầu', dataIndex: 'startTime', key: 'startTime' },
    { title: 'Giờ kết thúc', dataIndex: 'endTime', key: 'endTime' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
  ];

  // Cột đơn giản cho chấm công
  const attendanceColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
    { title: 'Giờ vào', dataIndex: 'timeIn', key: 'timeIn' },
    { title: 'Giờ ra', dataIndex: 'timeOut', key: 'timeOut' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
  ];

  return (
    <KitchenLayout>
      <div style={{ padding: '20px' }}>
        <h1>Trang Chấm Công và Lịch Làm Việc</h1>
        <Button onClick={fetchData} style={{ marginBottom: '20px' }}>
          Làm mới dữ liệu
        </Button>

        <div>
          <h2>Lịch Làm Việc</h2>
          <div style={{ overflowX: 'auto' }}>
            <Table 
              dataSource={schedules} 
              columns={scheduleColumns} 
              rowKey={record => record.id || Math.random().toString()} 
              loading={loading}
              pagination={false}
              bordered
            />
          </div>
          
          <h2 style={{ marginTop: '30px' }}>Chấm Công</h2>
          <div style={{ overflowX: 'auto' }}>
            <Table 
              dataSource={attendances} 
              columns={attendanceColumns} 
              rowKey={record => record.id || Math.random().toString()}
              loading={loading}
              pagination={false}
              bordered
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <p><strong>Raw Schedule Data:</strong></p>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(schedules, null, 2)}
          </pre>
          
          <p><strong>Raw Attendance Data:</strong></p>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(attendances, null, 2)}
          </pre>
        </div>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
