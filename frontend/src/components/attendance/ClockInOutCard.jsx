import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, message, Space, Spin, Alert } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { clockIn, clockOut, getMyAttendances } from '../../services/attendanceService';

const { Title, Text } = Typography;

const ClockInOutCard = () => {
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cập nhật thời gian hiện tại mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Lấy dữ liệu chấm công của hôm nay
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const attendances = await getMyAttendances(month, year);
        const todayDateString = today.toISOString().split('T')[0];
        
        const found = attendances.find(a => {
          const attendanceDate = new Date(a.date).toISOString().split('T')[0];
          return attendanceDate === todayDateString;
        });
        
        if (found) {
          setTodayAttendance(found);
        }
      } catch (error) {
        console.error('Error fetching today attendance:', error);
      }
    };

    fetchTodayAttendance();
  }, []);

  // Xử lý chấm công vào ca
  const handleClockIn = async () => {
    setLoading(true);
    try {
      const response = await clockIn();
      message.success('Chấm công vào ca thành công');
      setTodayAttendance(response.attendance);
    } catch (error) {
      message.error(error.message || 'Không thể chấm công vào ca');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chấm công ra ca
  const handleClockOut = async () => {
    setLoading(true);
    try {
      const response = await clockOut();
      message.success('Chấm công ra ca thành công');
      setTodayAttendance(response.attendance);
    } catch (error) {
      message.error(error.message || 'Không thể chấm công ra ca');
    } finally {
      setLoading(false);
    }
  };

  // Format thời gian
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Hiển thị trạng thái chấm công
  const renderAttendanceStatus = () => {
    if (!todayAttendance) {
      return (
        <Alert
          message="Bạn chưa chấm công hôm nay"
          description="Hãy nhấn nút 'Chấm công vào ca' khi bắt đầu làm việc."
          type="warning"
          showIcon
        />
      );
    }

    if (todayAttendance.status === 'absent') {
      return (
        <Alert
          message="Bạn được đánh dấu vắng mặt hôm nay"
          description={todayAttendance.note || 'Không có ghi chú.'}
          type="error"
          showIcon
        />
      );
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {todayAttendance.timeIn && (
          <Alert
            message="Đã chấm công vào ca"
            description={`Thời gian: ${todayAttendance.timeIn}`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}
        {todayAttendance.timeOut ? (
          <Alert
            message="Đã chấm công ra ca"
            description={`Thời gian: ${todayAttendance.timeOut}`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        ) : todayAttendance.timeIn ? (
          <Alert
            message="Chưa chấm công ra ca"
            description="Hãy nhấn nút 'Chấm công ra ca' khi kết thúc ca làm việc."
            type="info"
            showIcon
            icon={<CloseCircleOutlined />}
          />
        ) : null}
        {todayAttendance.hoursWorked && (
          <Alert
            message="Số giờ làm việc"
            description={`${todayAttendance.hoursWorked} giờ`}
            type="info"
            showIcon
          />
        )}
      </Space>
    );
  };

  return (
    <Card title="Chấm công hôm nay" bordered={false}>
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>
              <ClockCircleOutlined /> {formatTime(currentTime)}
            </Title>
            <Text type="secondary">{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </div>

          {renderAttendanceStatus()}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button 
              type="primary" 
              size="large" 
              onClick={handleClockIn}
              disabled={todayAttendance?.timeIn || todayAttendance?.status === 'absent'}
            >
              Chấm công vào ca
            </Button>
            <Button 
              type="primary" 
              danger 
              size="large" 
              onClick={handleClockOut}
              disabled={!todayAttendance?.timeIn || todayAttendance?.timeOut || todayAttendance?.status === 'absent'}
            >
              Chấm công ra ca
            </Button>
          </div>
        </Space>
      </Spin>
    </Card>
  );
};

export default ClockInOutCard; 