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
    </KitchenLayout>
  );
};

export default KitchenAttendancePage;
