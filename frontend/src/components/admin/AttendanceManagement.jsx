import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Space, Button, DatePicker, Select, Input, Form, 
  Modal, Spin, Tag, Typography, message, Popconfirm, Tabs
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, 
  ExclamationCircleOutlined, FileExcelOutlined, BarChartOutlined
} from '@ant-design/icons';
import { 
  getAllAttendances, createOrUpdateAttendance, 
  deleteAttendance, getMonthlyReport 
} from '../../services/attendanceService';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const AttendanceManagement = ({ users }) => {
  console.log("AttendanceManagement - users prop:", users);
  
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs()
  ]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('list');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchAttendances();
    } else if (activeTab === 'report') {
      fetchMonthlyReport();
    }
  }, [dateRange, selectedUser, activeTab]);

  const fetchAttendances = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    setError(null);
    try {
      const month = dateRange[0].month() + 1;
      const year = dateRange[0].year();
      
      console.log("Gọi API getAllAttendances với tham số:", { month, year, selectedUser });
      
      const data = await getAllAttendances(
        null, 
        selectedUser, 
        month, 
        year, 
        null
      );
      
      console.log("Kết quả API getAllAttendances:", data);
      
      setAttendances(data);
    } catch (error) {
      console.error('Error fetching attendances:', error);
      console.log("Chi tiết lỗi:", error.response?.data || error.message);
      setError("Không thể lấy dữ liệu chấm công: " + (error.response?.data?.message || error.message));
      message.error('Không thể lấy dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    if (!dateRange || !dateRange[0]) return;

    setLoading(true);
    try {
      const month = dateRange[0].month() + 1;
      const year = dateRange[0].year();
      
      const data = await getMonthlyReport(month, year);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      message.error('Không thể lấy báo cáo chấm công');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendance = () => {
    form.resetFields();
    setEditingAttendance(null);
    setIsModalVisible(true);
  };

  const handleEditAttendance = (record) => {
    setEditingAttendance(record);
    form.setFieldsValue({
      userId: record.userId,
      date: dayjs(record.date),
      timeIn: record.timeIn ? dayjs(`2000-01-01 ${record.timeIn}`) : null,
      timeOut: record.timeOut ? dayjs(`2000-01-01 ${record.timeOut}`) : null,
      status: record.status,
      note: record.note
    });
    setIsModalVisible(true);
  };

  const handleDeleteAttendance = async (id) => {
    try {
      await deleteAttendance(id);
      message.success('Xóa bản ghi chấm công thành công');
      fetchAttendances();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      message.error('Không thể xóa bản ghi chấm công');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      const attendanceData = {
        userId: values.userId,
        date: values.date.format('YYYY-MM-DD'),
        timeIn: values.timeIn ? values.timeIn.format('HH:mm:ss') : null,
        timeOut: values.timeOut ? values.timeOut.format('HH:mm:ss') : null,
        status: values.status,
        note: values.note
      };

      if (editingAttendance) {
        attendanceData.id = editingAttendance.id;
      }

      await createOrUpdateAttendance(attendanceData);
      message.success(`${editingAttendance ? 'Cập nhật' : 'Thêm'} bản ghi chấm công thành công`);
      setIsModalVisible(false);
      fetchAttendances();
    } catch (error) {
      console.error('Error saving attendance:', error);
      message.error(`Không thể ${editingAttendance ? 'cập nhật' : 'thêm'} bản ghi chấm công`);
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
      title: 'Nhân viên',
      dataIndex: 'User',
      key: 'user',
      render: (user) => (
        <span>
          {user?.name || '—'}
          <br />
          <small>{user?.role === 'kitchen' ? 'Bếp' : user?.role === 'waiter' ? 'Phục vụ' : user?.role}</small>
        </span>
      ),
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
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditAttendance(record)} 
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bản ghi này?"
            onConfirm={() => handleDeleteAttendance(record.id)}
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

  const reportColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'userName',
      key: 'userName',
      render: (name, record) => (
        <span>
          {name}
          <br />
          <small>{record.role === 'kitchen' ? 'Bếp' : record.role === 'waiter' ? 'Phục vụ' : record.role}</small>
        </span>
      ),
    },
    {
      title: 'Tổng số ngày',
      dataIndex: 'totalDays',
      key: 'totalDays',
    },
    {
      title: 'Có mặt',
      dataIndex: 'presentDays',
      key: 'presentDays',
    },
    {
      title: 'Đi muộn',
      dataIndex: 'lateDays',
      key: 'lateDays',
    },
    {
      title: 'Vắng mặt',
      dataIndex: 'absentDays',
      key: 'absentDays',
    },
    {
      title: 'Nghỉ phép',
      dataIndex: 'leaveDays',
      key: 'leaveDays',
    },
    {
      title: 'Tổng số giờ',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
  ];

  return (
    <Card title="Quản lý chấm công" bordered={false}>
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          {error}
        </div>
      )}
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Danh sách chấm công" key="list">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <RangePicker
                  locale={locale}
                  value={dateRange}
                  onChange={setDateRange}
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
                onClick={handleAddAttendance}
              >
                Thêm chấm công
              </Button>
            </div>
            
            <Spin spinning={loading}>
              <Table 
                dataSource={attendances} 
                columns={columns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Spin>
          </Space>
        </TabPane>
        <TabPane tab="Báo cáo chấm công" key="report">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <DatePicker
                  picker="month"
                  locale={locale}
                  value={dateRange[0]}
                  onChange={(date) => setDateRange([date, date?.endOf('month')])}
                  allowClear={false}
                />
                <Button icon={<FileExcelOutlined />} type="primary">
                  Xuất báo cáo
                </Button>
              </Space>
              <Button icon={<BarChartOutlined />} type="default">
                Xem biểu đồ
              </Button>
            </div>
            
            <Spin spinning={loading}>
              <Table 
                dataSource={reportData} 
                columns={reportColumns} 
                rowKey="userId"
                pagination={false}
              />
            </Spin>
          </Space>
        </TabPane>
      </Tabs>

      <Modal
        title={editingAttendance ? "Sửa bản ghi chấm công" : "Thêm bản ghi chấm công"}
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
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="present">Có mặt</Option>
              <Option value="absent">Vắng mặt</Option>
              <Option value="late">Đi muộn</Option>
              <Option value="leave">Nghỉ phép</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timeIn"
            label="Giờ vào"
          >
            <DatePicker picker="time" format="HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="timeOut"
            label="Giờ ra"
          >
            <DatePicker picker="time" format="HH:mm:ss" style={{ width: '100%' }} />
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
                {editingAttendance ? 'Cập nhật' : 'Thêm'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AttendanceManagement;