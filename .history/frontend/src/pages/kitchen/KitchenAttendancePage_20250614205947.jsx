import React, { useState, useEffect } from 'react';
import { Button, message, Spin } from 'antd';
import axios from 'axios';
import { API_URL } from '../../config';
import KitchenLayout from '../../layouts/KitchenLayout';

const KitchenAttendancePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Lấy thông tin current month và year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      console.log(`Fetching data for month: ${month}, year: ${year}`);

      // Lấy lịch làm việc
      const schedulesUrl = `${API_URL}/api/schedule/my-schedule?month=${month}&year=${year}`;
      console.log('Schedule URL:', schedulesUrl);
      
      const schedulesResponse = await axios.get(schedulesUrl);
      console.log('Schedule response:', schedulesResponse);
      
      if (Array.isArray(schedulesResponse.data)) {
        setSchedules(schedulesResponse.data);
        console.log(`Received ${schedulesResponse.data.length} schedules`);
      } else {
        console.warn('Schedule data is not an array:', schedulesResponse.data);
        setSchedules([]);
      }

      // Lấy chấm công
      const attendancesUrl = `${API_URL}/api/attendance/my-attendance?month=${month}&year=${year}`;
      console.log('Attendance URL:', attendancesUrl);
      
      const attendancesResponse = await axios.get(attendancesUrl);
      console.log('Attendance response:', attendancesResponse);
      
      if (Array.isArray(attendancesResponse.data)) {
        setAttendances(attendancesResponse.data);
        console.log(`Received ${attendancesResponse.data.length} attendances`);
      } else {
        console.warn('Attendance data is not an array:', attendancesResponse.data);
        setAttendances([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Lỗi khi tải dữ liệu: ${error.message}`);
      message.error('Không thể tải dữ liệu từ API');
    } finally {
      setLoading(false);
    }
  };

  // Chỉ hiển thị dữ liệu thô
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

        {error && (
          <div style={{ 
            color: 'red', 
            padding: '10px', 
            marginBottom: '20px',
            border: '1px solid red', 
            backgroundColor: '#ffeeee' 
          }}>
            {error}
          </div>
        )}

        <Spin spinning={loading}>
          <div style={{ marginBottom: '30px' }}>
            <h2>Lịch Làm Việc ({schedules.length} mục)</h2>
            {schedules.length > 0 ? (
              <div>
                {schedules.map((item, index) => (
                  <div key={item.id || index} style={{ 
                    marginBottom: '10px', 
                    padding: '10px', 
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <div><strong>ID:</strong> {item.id}</div>
                    <div><strong>Ngày:</strong> {item.date}</div>
                    <div><strong>Ca:</strong> {item.shift}</div>
                    <div><strong>Thời gian:</strong> {item.startTime} - {item.endTime}</div>
                    <div><strong>Trạng thái:</strong> {item.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                Không có dữ liệu lịch làm việc
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>Chấm Công ({attendances.length} mục)</h2>
            {attendances.length > 0 ? (
              <div>
                {attendances.map((item, index) => (
                  <div key={item.id || index} style={{ 
                    marginBottom: '10px', 
                    padding: '10px', 
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <div><strong>ID:</strong> {item.id}</div>
                    <div><strong>Ngày:</strong> {item.date}</div>
                    <div><strong>Giờ vào:</strong> {item.timeIn || 'N/A'}</div>
                    <div><strong>Giờ ra:</strong> {item.timeOut || 'N/A'}</div>
                    <div><strong>Trạng thái:</strong> {item.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                Không có dữ liệu chấm công
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <h2>Debug Information</h2>
            <div style={{ marginBottom: '20px' }}>
              <h3>Schedule Data ({schedules.length}):</h3>
              <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', border: '1px solid #ddd' }}>
                {JSON.stringify(schedules, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3>Attendance Data ({attendances.length}):</h3>
              <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', border: '1px solid #ddd' }}>
                {JSON.stringify(attendances, null, 2)}
              </pre>
            </div>
          </div>
        </Spin>
      </div>
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
