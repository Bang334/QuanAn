import React, { useState, useEffect } from 'react';
import { 
  Card, Calendar, Badge, Space, Button, DatePicker, Select, Input, Form, 
  Modal, Spin, Tag, Typography, message, Popconfirm, Tabs, Table, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CalendarOutlined, TeamOutlined, CopyOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  getAllSchedules, createSchedule, updateSchedule, 
  deleteSchedule, createBatchSchedules, createScheduleTemplate
} from '../../services/scheduleService';
import axios from 'axios';
import { API_URL } from '../../config';
import dayjs from 'dayjs';
import locale from 'antd/es/calendar/locale/vi_VN';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const ScheduleManagement = ({ users }) => {
  console.log("ScheduleManagement - users prop:", users);
  
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [error, setError] = useState(null);

  // Fetch schedules when component mounts
  useEffect(() => {
    console.log("ScheduleManagement component mounted");
    fetchSchedules();
  }, []);
  
  // Fetch schedules when filters change
  useEffect(() => {
    console.log("Filter changed, fetching schedules");
    fetchSchedules();
  }, [selectedDate, selectedUser]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const month = selectedDate.month() + 1;
      const year = selectedDate.year();
      
      console.log("Gọi API getAllSchedules với tham số:", { month, year, selectedUser });
      
      // Gọi API để lấy dữ liệu lịch làm việc
      const response = await axios.get(`${API_URL}/api/schedule/admin`, {
        params: { 
          userId: selectedUser, 
          month, 
          year 
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = response.data;
      console.log("Kết quả API getAllSchedules trực tiếp:", data);
      
      // Kiểm tra dữ liệu trả về
      if (data && Array.isArray(data)) {
        setSchedules(data);
        console.log("Đã cập nhật state schedules với", data.length, "lịch làm việc");
        
        // Hiển thị thông báo nếu không có dữ liệu
        if (data.length === 0) {
          message.info('Không có lịch làm việc trong tháng này');
        }
      } else {
        console.error("Dữ liệu API không phải là mảng:", data);
        setError("Dữ liệu API không hợp lệ");
        message.error('Dữ liệu API không hợp lệ');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      console.log("Chi tiết lỗi:", error.response?.data || error.message);
      setError("Không thể lấy dữ liệu lịch làm việc: " + (error.response?.data?.message || error.message));
      message.error('Không thể lấy dữ liệu lịch làm việc');
      setSchedules([]); // Reset schedules on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = (date = null) => {
    form.resetFields();
    if (date) {
      form.setFieldsValue({
        date: dayjs(date)
      });
    }
    setEditingSchedule(null);
    setIsModalVisible(true);
  };

  const handleEditSchedule = (record) => {
    setEditingSchedule(record);
    form.setFieldsValue({
      userId: record.userId,
      date: dayjs(record.date),
      shift: record.shift,
      startTime: record.startTime ? dayjs(`2000-01-01 ${record.startTime}`) : null,
      endTime: record.endTime ? dayjs(`2000-01-01 ${record.endTime}`) : null,
      status: record.status,
      note: record.note
    });
    setIsModalVisible(true);
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await deleteSchedule(id);
      message.success('Xóa lịch làm việc thành công');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      message.error('Không thể xóa lịch làm việc');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      const scheduleData = {
        userId: values.userId,
        date: values.date.format('YYYY-MM-DD'),
        shift: values.shift,
        startTime: values.startTime ? values.startTime.format('HH:mm:ss') : null,
        endTime: values.endTime ? values.endTime.format('HH:mm:ss') : null,
        status: values.status,
        note: values.note
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData);
        message.success('Cập nhật lịch làm việc thành công');
      } else {
        await createSchedule(scheduleData);
        message.success('Thêm lịch làm việc thành công');
      }
      
      setIsModalVisible(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      message.error(`Không thể ${editingSchedule ? 'cập nhật' : 'thêm'} lịch làm việc`);
    }
  };

  const handleTemplateSubmit = async (values) => {
    try {
      const templateData = {
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        kitchen: values.kitchen,
        waiter: values.waiter,
        shifts: values.shifts
      };

      await createScheduleTemplate(templateData);
      message.success('Tạo lịch làm việc theo mẫu thành công');
      setIsTemplateModalVisible(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule template:', error);
      message.error('Không thể tạo lịch làm việc theo mẫu');
    }
  };

  const handleBatchSubmit = async (values) => {
    try {
      const batchData = {
        userIds: values.userIds,
        dates: values.dates.map(date => date.format('YYYY-MM-DD')),
        shift: values.shift,
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        status: values.status,
        note: values.note
      };

      await createBatchSchedules(batchData);
      message.success('Tạo lịch làm việc hàng loạt thành công');
      setIsBatchModalVisible(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error creating batch schedules:', error);
      message.error('Không thể tạo lịch làm việc hàng loạt');
    }
  };

  // Định dạng trạng thái lịch làm việc
  const getStatusTag = (status) => {
    switch (status) {
      case 'scheduled':
        return <Tag icon={<ClockCircleOutlined />} color="processing">Đã lên lịch</Tag>;
      case 'confirmed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã xác nhận</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="green">Đã hoàn thành</Tag>;
      case 'cancelled':
        return <Tag icon={<ExclamationCircleOutlined />} color="error">Đã hủy</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  // Hiển thị các ca làm việc trên lịch
  const dateCellRender = (value) => {
    if (!schedules || schedules.length === 0) {
      return null;
    }
    
    const date = value.format('YYYY-MM-DD');
    
    // Tìm các lịch làm việc cho ngày này
    const daySchedules = schedules.filter(schedule => {
      if (!schedule || !schedule.date) return false;
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

          const userName = users.find(u => u.id === schedule.userId)?.name || '';
          const userRole = users.find(u => u.id === schedule.userId)?.role || '';
          const roleText = userRole === 'kitchen' ? 'Bếp' : userRole === 'waiter' ? 'Phục vụ' : userRole;

          return (
            <li key={schedule.id} style={{ marginBottom: '3px' }}>
              <Badge
                status={
                  schedule.status === 'confirmed' ? 'success' : 
                  schedule.status === 'completed' ? 'success' : 
                  schedule.status === 'cancelled' ? 'error' : 'processing'
                }
                text={
                  <span>
                    {userName} ({roleText}) - {' '}
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
    setSelectedDate(date);
    if (activeTab === 'calendar') {
      handleAddSchedule(date);
    }
  };

  // Danh sách cột cho bảng lịch làm việc
  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => {
        const user = users.find(u => u.id === userId);
        return (
          <span>
            {user?.name || '—'}
            <br />
            <small>{user?.role === 'kitchen' ? 'Bếp' : user?.role === 'waiter' ? 'Phục vụ' : user?.role}</small>
          </span>
        );
      },
      filters: users.map(user => ({ text: `${user.name} (${user.role === 'kitchen' ? 'Bếp' : user.role === 'waiter' ? 'Phục vụ' : user.role})`, value: user.id })),
      onFilter: (value, record) => record.userId === value,
    },
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
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift) => {
        switch (shift) {
          case 'morning':
            return <Tag color="blue">Ca sáng</Tag>;
          case 'afternoon':
            return <Tag color="green">Ca chiều</Tag>;
          case 'evening':
            return <Tag color="purple">Ca tối</Tag>;
          case 'night':
            return <Tag color="magenta">Ca đêm</Tag>;
          case 'full_day':
            return <Tag color="red">Cả ngày</Tag>;
          default:
            return <Tag>Không xác định</Tag>;
        }
      },
      filters: [
        { text: 'Ca sáng', value: 'morning' },
        { text: 'Ca chiều', value: 'afternoon' },
        { text: 'Ca tối', value: 'evening' },
        { text: 'Ca đêm', value: 'night' },
        { text: 'Cả ngày', value: 'full_day' },
      ],
      onFilter: (value, record) => record.shift === value,
    },
    {
      title: 'Thời gian',
      dataIndex: 'startTime',
      key: 'time',
      render: (startTime, record) => `${startTime || '—'} - ${record.endTime || '—'}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Đã lên lịch', value: 'scheduled' },
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Đã hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditSchedule(record)} 
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa lịch làm việc này?"
            onConfirm={() => handleDeleteSchedule(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small" 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý lịch làm việc" bordered={false}>
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          {error}
        </div>
      )}
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Lịch làm việc" key="calendar">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Select
                  placeholder="Chọn nhân viên"
                  style={{ width: 200 }}
                  allowClear
                  onChange={setSelectedUser}
                  value={selectedUser}
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} ({user.role === 'kitchen' ? 'Bếp' : user.role === 'waiter' ? 'Phục vụ' : user.role})
                    </Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleAddSchedule()}
                >
                  Thêm lịch làm việc
                </Button>
              </Space>
              <Space>
                <Button 
                  icon={<TeamOutlined />} 
                  onClick={() => setIsBatchModalVisible(true)}
                >
                  Tạo lịch hàng loạt
                </Button>
                <Button 
                  icon={<CopyOutlined />} 
                  onClick={() => setIsTemplateModalVisible(true)}
                >
                  Tạo lịch theo mẫu
                </Button>
              </Space>
            </div>
            
            <Spin spinning={loading}>
              <div style={{ marginBottom: '10px' }}>
                <Text type="secondary">Tổng số lịch làm việc: {schedules.length}</Text>
              </div>
              <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', padding: '8px' }}>
                <Calendar 
                  locale={locale}
                  dateCellRender={dateCellRender}
                  onSelect={handleDateSelect}
                  value={selectedDate}
                  onPanelChange={(date) => {
                    setSelectedDate(date);
                    setTimeout(() => {
                      fetchSchedules();
                    }, 100);
                  }}
                  style={{ background: 'white' }}
                />
              </div>
            </Spin>
          </Space>
        </TabPane>
        <TabPane tab="Danh sách lịch làm việc" key="list">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <DatePicker
                  picker="month"
                  locale={locale}
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    fetchSchedules();
                  }}
                  allowClear={false}
                />
                <Select
                  placeholder="Chọn nhân viên"
                  style={{ width: 200 }}
                  allowClear
                  onChange={setSelectedUser}
                  value={selectedUser}
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} ({user.role === 'kitchen' ? 'Bếp' : user.role === 'waiter' ? 'Phục vụ' : user.role})
                    </Option>
                  ))}
                </Select>
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddSchedule()}
              >
                Thêm lịch làm việc
              </Button>
            </div>
            
            <Spin spinning={loading}>
              <div style={{ marginBottom: '10px' }}>
                <Text type="secondary">Tổng số lịch làm việc: {schedules.length}</Text>
              </div>
              <Table 
                dataSource={schedules} 
                columns={columns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Không có dữ liệu lịch làm việc' }}
                bordered
                style={{ background: 'white' }}
                size="middle"
              />
            </Spin>
          </Space>
        </TabPane>
      </Tabs>

      {/* Modal thêm/sửa lịch làm việc */}
      <Modal
        title={editingSchedule ? "Sửa lịch làm việc" : "Thêm lịch làm việc"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="userId"
            label="Nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'kitchen' ? 'Bếp' : user.role === 'waiter' ? 'Phục vụ' : user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker locale={locale} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="shift"
            label="Ca làm việc"
            rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]}
          >
            <Select placeholder="Chọn ca làm việc">
              <Option value="morning">Ca sáng</Option>
              <Option value="afternoon">Ca chiều</Option>
              <Option value="evening">Ca tối</Option>
              <Option value="night">Ca đêm</Option>
              <Option value="full_day">Cả ngày</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <DatePicker picker="time" format="HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="Giờ kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
              >
                <DatePicker picker="time" format="HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            initialValue="scheduled"
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Đã hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSchedule ? 'Cập nhật' : 'Thêm'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo lịch làm việc theo mẫu */}
      <Modal
        title="Tạo lịch làm việc theo mẫu"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleTemplateSubmit}
        >
          <Form.Item
            name="dateRange"
            label="Khoảng thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
          >
            <RangePicker locale={locale} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="kitchen"
            label="Số nhân viên bếp mỗi ca"
            rules={[{ required: true, message: 'Vui lòng nhập số nhân viên bếp' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="waiter"
            label="Số nhân viên phục vụ mỗi ca"
            rules={[{ required: true, message: 'Vui lòng nhập số nhân viên phục vụ' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="shifts"
            label="Các ca làm việc"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một ca làm việc' }]}
          >
            <Select mode="multiple" placeholder="Chọn các ca làm việc">
              <Option value="morning">Ca sáng (7:00 - 11:00)</Option>
              <Option value="afternoon">Ca chiều (11:00 - 15:00)</Option>
              <Option value="evening">Ca tối (15:00 - 19:00)</Option>
              <Option value="night">Ca đêm (19:00 - 23:00)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsTemplateModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Tạo lịch
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo lịch làm việc hàng loạt */}
      <Modal
        title="Tạo lịch làm việc hàng loạt"
        open={isBatchModalVisible}
        onCancel={() => setIsBatchModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          <Form.Item
            name="userIds"
            label="Nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhân viên' }]}
          >
            <Select mode="multiple" placeholder="Chọn nhân viên">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'kitchen' ? 'Bếp' : user.role === 'waiter' ? 'Phục vụ' : user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dates"
            label="Ngày làm việc"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một ngày' }]}
          >
            <DatePicker.RangePicker locale={locale} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="shift"
            label="Ca làm việc"
            rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]}
          >
            <Select placeholder="Chọn ca làm việc">
              <Option value="morning">Ca sáng</Option>
              <Option value="afternoon">Ca chiều</Option>
              <Option value="evening">Ca tối</Option>
              <Option value="night">Ca đêm</Option>
              <Option value="full_day">Cả ngày</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <DatePicker picker="time" format="HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="Giờ kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
              >
                <DatePicker picker="time" format="HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="scheduled"
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="confirmed">Đã xác nhận</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsBatchModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Tạo lịch
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ScheduleManagement;