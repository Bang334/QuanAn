import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, Spin, Modal, Button, Typography, message } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getMySchedules, confirmSchedule } from '../../services/scheduleService';
import dayjs from 'dayjs';
import locale from 'antd/es/calendar/locale/vi_VN';

const { Title, Text } = Typography;

const MyScheduleCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const data = await getMySchedules(month, year);
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      message.error('Không thể lấy dữ liệu lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi xác nhận lịch làm việc
  const handleConfirmSchedule = async (scheduleId) => {
    setConfirmLoading(true);
    try {
      await confirmSchedule(scheduleId);
      message.success('Xác nhận lịch làm việc thành công');
      
      // Cập nhật trạng thái lịch làm việc trong state
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, status: 'confirmed' } 
            : schedule
        )
      );
      
      // Cập nhật danh sách lịch làm việc đã chọn
      setSelectedSchedules(prevSelected => 
        prevSelected.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, status: 'confirmed' } 
            : schedule
        )
      );
    } catch (error) {
      console.error('Error confirming schedule:', error);
      message.error('Không thể xác nhận lịch làm việc');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Hiển thị các ca làm việc trên lịch
  const dateCellRender = (value) => {
    const date = value.format('YYYY-MM-DD');
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = dayjs(schedule.date).format('YYYY-MM-DD');
      return scheduleDate === date;
    });

    if (daySchedules.length === 0) {
      return null;
    }

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {daySchedules.map(schedule => {
          let color = '';
          switch (schedule.shift) {
            case 'morning':
              color = 'blue';
              break;
            case 'afternoon':
              color = 'green';
              break;
            case 'evening':
              color = 'purple';
              break;
            case 'night':
              color = 'magenta';
              break;
            case 'full_day':
              color = 'red';
              break;
            default:
              color = 'default';
          }

          return (
            <li key={schedule.id} style={{ marginBottom: '3px' }}>
              <Badge
                status={schedule.status === 'confirmed' ? 'success' : 'processing'}
                text={
                  <span>
                    {schedule.shift === 'morning' && 'Ca sáng'}
                    {schedule.shift === 'afternoon' && 'Ca chiều'}
                    {schedule.shift === 'evening' && 'Ca tối'}
                    {schedule.shift === 'night' && 'Ca đêm'}
                    {schedule.shift === 'full_day' && 'Cả ngày'}
                  </span>
                }
                color={color}
              />
            </li>
          );
        })}
      </ul>
    );
  };

  // Xử lý khi chọn một ngày trên lịch
  const handleDateSelect = (date) => {
    const selectedDate = date.format('YYYY-MM-DD');
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = dayjs(schedule.date).format('YYYY-MM-DD');
      return scheduleDate === selectedDate;
    });

    setSelectedDate(date);
    setSelectedSchedules(daySchedules);
    setIsModalVisible(true);
  };

  // Hiển thị chi tiết ca làm việc trong modal
  const renderScheduleDetails = () => {
    if (selectedSchedules.length === 0) {
      return <Text>Không có lịch làm việc cho ngày này</Text>;
    }

    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {selectedSchedules.map(schedule => (
          <li key={schedule.id} style={{ marginBottom: '16px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>
                {schedule.shift === 'morning' && 'Ca sáng'}
                {schedule.shift === 'afternoon' && 'Ca chiều'}
                {schedule.shift === 'evening' && 'Ca tối'}
                {schedule.shift === 'night' && 'Ca đêm'}
                {schedule.shift === 'full_day' && 'Cả ngày'}
              </Text>
              {' '}
              <Badge 
                status={schedule.status === 'confirmed' ? 'success' : 'processing'} 
                text={
                  schedule.status === 'confirmed' ? 'Đã xác nhận' : 
                  schedule.status === 'completed' ? 'Đã hoàn thành' :
                  schedule.status === 'cancelled' ? 'Đã hủy' : 'Chưa xác nhận'
                } 
              />
            </div>
            <div><ClockCircleOutlined /> Thời gian: {schedule.startTime} - {schedule.endTime}</div>
            {schedule.note && <div style={{ marginTop: '8px' }}>Ghi chú: {schedule.note}</div>}
            
            {schedule.status === 'scheduled' && (
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                style={{ marginTop: '8px' }}
                onClick={() => handleConfirmSchedule(schedule.id)}
                loading={confirmLoading}
              >
                Xác nhận
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card title="Lịch làm việc của tôi" bordered={false}>
      <Spin spinning={loading}>
        <Calendar 
          locale={locale}
          dateCellRender={dateCellRender}
          onSelect={handleDateSelect}
        />
        
        <Modal
          title={selectedDate ? `Lịch làm việc ngày ${selectedDate.format('DD/MM/YYYY')}` : 'Lịch làm việc'}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>
          ]}
        >
          {renderScheduleDetails()}
        </Modal>
      </Spin>
    </Card>
  );
};

export default MyScheduleCalendar;