import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Card, List, Spin, Alert, Divider 
} from 'antd';
import { 
  ReloadOutlined, CalendarOutlined, CheckOutlined 
} from '@ant-design/icons';
import KitchenLayout from '../../layouts/KitchenLayout';
import axios from 'axios';
import { API_URL } from '../../config';

const KitchenAttendancePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      console.log('Fetching data with token:', token ? 'Token exists' : 'No token');
      
      // Fetch schedules
      const scheduleResponse = await axios.get(
        `${API_URL}/schedule/my-schedule?month=${currentMonth}&year=${currentYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Schedule response:', scheduleResponse);
      
      if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
        setSchedules(scheduleResponse.data);
      }
      
      // Fetch attendances
      const attendanceResponse = await axios.get(
        `${API_URL}/attendance/my-attendance?month=${currentMonth}&year=${currentYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Attendance response:', attendanceResponse);
      
      if (attendanceResponse.data && Array.isArray(attendanceResponse.data)) {
        setAttendances(attendanceResponse.data);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  return (
    <KitchenLayout>
      <div style={{ maxWidth: '100%', padding: '0 20px' }}>
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <CalendarOutlined /> Lịch làm việc và Chấm công
              </Typography.Title>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={fetchData}
                loading={loading}
              >
                Làm mới
              </Button>
            </div>
          }
          style={{ width: '100%', marginBottom: 20 }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <Alert message={error} type="error" />
          ) : (
            <div>
              <div style={{ marginBottom: 20 }}>
                <Typography.Title level={5}>Lịch làm việc</Typography.Title>
                {schedules && schedules.length > 0 ? (
                  <List
                    bordered
                    dataSource={schedules}
                    renderItem={item => (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <strong>Ngày: {formatDate(item.date)}</strong>
                          <div>Ca làm: {item.shift} ({formatTime(item.start_time)} - {formatTime(item.end_time)})</div>
                          <div>Ghi chú: {item.note || 'Không có'}</div>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Alert message="Không tìm thấy lịch làm việc nào" type="info" />
                )}
              </div>

              <Divider />
              
              <div>
                <Typography.Title level={5}>Chấm công</Typography.Title>
                {attendances && attendances.length > 0 ? (
                  <List
                    bordered
                    dataSource={attendances}
                    renderItem={item => (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <strong>Ngày: {formatDate(item.date)}</strong>
                          <div>
                            Giờ vào: {formatTime(item.check_in_time) || 'Chưa check-in'}
                            {item.is_late && <span style={{ color: 'red' }}> (Đi muộn)</span>}
                          </div>
                          <div>Giờ ra: {formatTime(item.check_out_time) || 'Chưa check-out'}</div>
                          <div>
                            Trạng thái: {' '}
                            {item.status === 'present' ? (
                              <span style={{ color: 'green' }}>Có mặt <CheckOutlined /></span>
                            ) : item.status === 'absent' ? (
                              <span style={{ color: 'red' }}>Vắng mặt</span>
                            ) : (
                              <span style={{ color: 'orange' }}>Đang xử lý</span>
                            )}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Alert message="Không tìm thấy dữ liệu chấm công nào" type="info" />
                )}
              </div>
            </div>
          )}
        </Card>
        
        {/* Debug Info */}
        <Card title="Debug Info">
          <pre>
            {schedules.length ? `Schedules: ${schedules.length}` : 'No schedules'} {'\n'}
            {attendances.length ? `Attendances: ${attendances.length}` : 'No attendances'} {'\n'}
          </pre>
          {schedules.length > 0 && (
            <div>
              <Typography.Title level={5}>Raw Schedule Data:</Typography.Title>
              <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(schedules, null, 2)}
              </pre>
            </div>
          )}
          {attendances.length > 0 && (
            <div>
              <Typography.Title level={5}>Raw Attendance Data:</Typography.Title>
              <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(attendances, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
