import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Space, Tag, Typography, Spin, Empty } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getMyAttendances } from '../../services/attendanceService';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const MyAttendanceTable = () => {
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs()
  ]);

  useEffect(() => {
    fetchAttendances();
  }, [dateRange]);

  const fetchAttendances = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    try {
      const month = dateRange[0].month() + 1;
      const year = dateRange[0].year();
      
      const data = await getMyAttendances(month, year);
      
      // Lọc dữ liệu theo khoảng ngày
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      const filteredData = data.filter(item => {
        const itemDate = dayjs(item.date);
        return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
      });
      
      setAttendances(filteredData);
    } catch (error) {
      console.error('Error fetching attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  // Định dạng trạng thái chấm công
  const getStatusTag = (status) => {
    switch (status) {
      case 'present':
        return <Tag icon={<CheckCircleOutlined />} color="success">Có mặt</Tag>;
      case 'absent':
        return <Tag icon={<CloseCircleOutlined />} color="error">Vắng mặt</Tag>;
      case 'late':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Đi muộn</Tag>;
      case 'leave':
        return <Tag icon={<ExclamationCircleOutlined />} color="processing">Nghỉ phép</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (text) => {
        const date = dayjs(text);
        return (
          <span>
            {date.format('DD/MM/YYYY')}
            <br />
            <small>{date.format('dddd')}</small>
          </span>
        );
      },
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Giờ vào',
      dataIndex: 'timeIn',
      key: 'timeIn',
      render: (text) => text || '—',
    },
    {
      title: 'Giờ ra',
      dataIndex: 'timeOut',
      key: 'timeOut',
      render: (text) => text || '—',
    },
    {
      title: 'Số giờ làm việc',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      render: (text) => text ? `${text} giờ` : '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Có mặt', value: 'present' },
        { text: 'Vắng mặt', value: 'absent' },
        { text: 'Đi muộn', value: 'late' },
        { text: 'Nghỉ phép', value: 'leave' },
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

  // Thống kê tổng quan
  const getSummary = () => {
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'present').length;
    const lateDays = attendances.filter(a => a.status === 'late').length;
    const absentDays = attendances.filter(a => a.status === 'absent').length;
    const leaveDays = attendances.filter(a => a.status === 'leave').length;
    
    const totalHours = attendances.reduce((sum, a) => {
      return sum + (a.hoursWorked ? parseFloat(a.hoursWorked) : 0);
    }, 0);
    
    return (
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Space size="large">
          <span><strong>Tổng số ngày:</strong> {totalDays}</span>
          <span><strong>Có mặt:</strong> {presentDays}</span>
          <span><strong>Đi muộn:</strong> {lateDays}</span>
          <span><strong>Vắng mặt:</strong> {absentDays}</span>
          <span><strong>Nghỉ phép:</strong> {leaveDays}</span>
          <span><strong>Tổng số giờ làm việc:</strong> {totalHours.toFixed(2)} giờ</span>
        </Space>
      </div>
    );
  };

  return (
    <Card title="Lịch sử chấm công" bordered={false}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5}>Chọn khoảng thời gian</Title>
          <RangePicker
            locale={locale}
            value={dateRange}
            onChange={setDateRange}
            allowClear={false}
          />
        </div>
        
        {getSummary()}
        
        <Spin spinning={loading}>
          {attendances.length > 0 ? (
            <Table 
              dataSource={attendances} 
              columns={columns} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="Không có dữ liệu chấm công trong khoảng thời gian này" />
          )}
        </Spin>
      </Space>
    </Card>
  );
};

export default MyAttendanceTable; 