import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Alert } from 'antd';
import axios from 'axios';
import { API_URL } from '../../config';
import KitchenLayout from '../../layouts/KitchenLayout';

const KitchenAttendancePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiResponses, setApiResponses] = useState({
    schedulesResponse: null,
    attendancesResponse: null
  });

  // Lấy dữ liệu khi trang được tải
  useEffect(() => {
    console.log("Component mounted");
    fetchData();
  }, []);

  // Hàm lấy dữ liệu từ API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? token.substring(0, 20) + "..." : 'No token');
      
      // Lấy thông tin current month và year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      console.log(`Fetching data for month: ${month}, year: ${year}`);

      // Lấy lịch làm việc
      const schedulesUrl = `${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`;
      console.log('Schedule URL:', schedulesUrl);
      
      const schedulesResponse = await axios.get(
        schedulesUrl,
        { 
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: function (status) {
            return status < 500; // Resolve cho bất kỳ status nào ngoại trừ server errors
          }
        }
      );
      
      console.log('Schedules response status:', schedulesResponse.status);
      console.log('Schedules response statusText:', schedulesResponse.statusText);
      console.log('Schedules response headers:', schedulesResponse.headers);
      console.log('Schedule data:', schedulesResponse.data);
      
      // Lưu response để debug
      setApiResponses(prev => ({...prev, schedulesResponse: schedulesResponse}));
      
      if (schedulesResponse.status === 200) {
        setSchedules(Array.isArray(schedulesResponse.data) ? schedulesResponse.data : []);
      } else {
        console.error('Schedule API returned non-200 status:', schedulesResponse.status);
        setError(`API trả về lỗi: ${schedulesResponse.status} ${schedulesResponse.statusText}`);
      }

      // Lấy chấm công
      const attendancesUrl = `${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`;
      console.log('Attendance URL:', attendancesUrl);
      
      const attendancesResponse = await axios.get(
        attendancesUrl,
        { 
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: function (status) {
            return status < 500; // Resolve cho bất kỳ status nào ngoại trừ server errors
          }
        }
      );
      
      console.log('Attendances response status:', attendancesResponse.status);
      console.log('Attendances response statusText:', attendancesResponse.statusText);
      console.log('Attendance data:', attendancesResponse.data);
      
      // Lưu response để debug
      setApiResponses(prev => ({...prev, attendancesResponse: attendancesResponse}));
      
      if (attendancesResponse.status === 200) {
        setAttendances(Array.isArray(attendancesResponse.data) ? attendancesResponse.data : []);
      } else {
        console.error('Attendance API returned non-200 status:', attendancesResponse.status);
        setError(prev => prev ? prev : `API trả về lỗi: ${attendancesResponse.status} ${attendancesResponse.statusText}`);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Lỗi khi tải dữ liệu: ${error.message}`);
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
        <Button 
          onClick={fetchData} 
          style={{ marginBottom: '20px' }} 
          type="primary"
          loading={loading}
        >
          Làm mới dữ liệu
        </Button>

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        <Spin spinning={loading} tip="Đang tải dữ liệu...">
          <div>
            <h2>Lịch Làm Việc ({schedules.length})</h2>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <Table 
                dataSource={schedules} 
                columns={scheduleColumns} 
                rowKey={record => record.id || Math.random().toString()} 
                pagination={false}
                bordered
                locale={{ emptyText: 'Không có dữ liệu' }}
                size="small"
              />
            </div>
            
            <h2>Chấm Công ({attendances.length})</h2>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <Table 
                dataSource={attendances} 
                columns={attendanceColumns} 
                rowKey={record => record.id || Math.random().toString()}
                pagination={false}
                bordered
                locale={{ emptyText: 'Không có dữ liệu' }}
                size="small"
              />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h2>Debug Information</h2>
            
            <h3>User Info from localStorage</h3>
            <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(JSON.parse(localStorage.getItem('user') || '{}'), null, 2)}
            </pre>

            <h3>API URLs</h3>
            <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
              API URL config: {API_URL}
            </pre>
            
            <h3>Schedule API Response</h3>
            <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
              Status: {apiResponses.schedulesResponse?.status} {apiResponses.schedulesResponse?.statusText}
              <br />
              Headers: {JSON.stringify(apiResponses.schedulesResponse?.headers, null, 2)}
              <br />
              Data: {JSON.stringify(apiResponses.schedulesResponse?.data, null, 2)}
            </pre>
            
            <h3>Attendance API Response</h3>
            <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
              Status: {apiResponses.attendancesResponse?.status} {apiResponses.attendancesResponse?.statusText}
              <br />
              Headers: {JSON.stringify(apiResponses.attendancesResponse?.headers, null, 2)}
              <br />
              Data: {JSON.stringify(apiResponses.attendancesResponse?.data, null, 2)}
            </pre>
          </div>
        </Spin>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
