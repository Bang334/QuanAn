import axios from 'axios';
import { API_URL } from '../config';

// Lấy danh sách lịch làm việc của bản thân
export const getMySchedules = async (month, year) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/my-schedule`, {
      params: { month, year },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy dữ liệu lịch làm việc' };
  }
};

// Lấy lịch làm việc hôm nay
export const getTodaySchedule = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/my-schedule/today`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy lịch làm việc hôm nay' };
  }
};

// Xác nhận lịch làm việc
export const confirmSchedule = async (scheduleId) => {
  try {
    const response = await axios.put(`${API_URL}/api/schedule/confirm/${scheduleId}`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể xác nhận lịch làm việc' };
  }
};

// Từ chối lịch làm việc
export const rejectSchedule = async (scheduleId, reason) => {
  try {
    const response = await axios.put(`${API_URL}/api/schedule/reject/${scheduleId}`, 
      { reason },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể từ chối lịch làm việc' };
  }
};

// Đăng ký ca làm việc (cho nhân viên bếp và phục vụ)
export const registerSchedule = async (scheduleData) => {
  try {
    // Đảm bảo dữ liệu hợp lệ trước khi gửi đi
    const validatedData = { ...scheduleData };
    
    // Kiểm tra và định dạng trường date
    if (validatedData.date && typeof validatedData.date === 'object' && typeof validatedData.date.format === 'function') {
      validatedData.date = validatedData.date.format('YYYY-MM-DD');
    }
    
    const response = await axios.post(`${API_URL}/api/schedule/register`, validatedData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể đăng ký ca làm việc' };
  }
};

// Hủy đăng ký ca làm việc
export const cancelSchedule = async (scheduleId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/schedule/cancel/${scheduleId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể hủy đăng ký ca làm việc' };
  }
};

// Lấy danh sách ca làm việc có sẵn cho nhân viên
export const getAvailableShifts = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/available-shifts`, {
      params: { date },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy danh sách ca làm việc có sẵn' };
  }
};

// Lấy thông tin số lượng nhân viên đã được phân công cho từng ca
export const getShiftStats = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/shift-stats`, {
      params: { date },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy thông tin thống kê ca làm việc' };
  }
};

// Lấy tổng quan lịch làm việc theo tuần
export const getWeeklyScheduleSummary = async (startDate) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/weekly-summary`, {
      params: { startDate },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy tổng quan lịch làm việc theo tuần' };
  }
};

// Admin: Lấy danh sách lịch làm việc của tất cả nhân viên
export const getAllSchedules = async (date, userId, month, year, shift, status) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/admin`, {
      params: { date, userId, month, year, shift, status },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy dữ liệu lịch làm việc' };
  }
};

// Admin: Tạo lịch làm việc mới
export const createSchedule = async (scheduleData) => {
  try {
    // Đảm bảo dữ liệu hợp lệ trước khi gửi đi
    const validatedData = { ...scheduleData };
    
    // Kiểm tra và định dạng trường date
    if (validatedData.date && typeof validatedData.date === 'object' && typeof validatedData.date.format === 'function') {
      validatedData.date = validatedData.date.format('YYYY-MM-DD');
    }
    
    console.log('Sending schedule data to API:', validatedData);
    
    const response = await axios.post(`${API_URL}/api/schedule/admin/create`, validatedData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating schedule:', error.response?.data || error);
    throw error.response?.data || { message: 'Không thể tạo lịch làm việc' };
  }
};

// Admin: Cập nhật lịch làm việc
export const updateSchedule = async (id, scheduleData) => {
  try {
    // Đảm bảo dữ liệu hợp lệ trước khi gửi đi
    const validatedData = { ...scheduleData };
    
    // Kiểm tra và định dạng trường date
    if (validatedData.date && typeof validatedData.date === 'object' && typeof validatedData.date.format === 'function') {
      validatedData.date = validatedData.date.format('YYYY-MM-DD');
    }
    
    console.log('Updating schedule data:', validatedData);
    
    const response = await axios.put(`${API_URL}/api/schedule/admin/${id}`, validatedData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating schedule:', error.response?.data || error);
    throw error.response?.data || { message: 'Không thể cập nhật lịch làm việc' };
  }
};

// Admin: Xóa lịch làm việc
export const deleteSchedule = async (scheduleId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/schedule/admin/${scheduleId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể xóa lịch làm việc' };
  }
};

// Admin: Tạo nhiều lịch làm việc cùng lúc
export const createBatchSchedules = async (batchData) => {
  try {
    const response = await axios.post(`${API_URL}/api/schedule/admin/batch-create`, batchData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể tạo lịch làm việc hàng loạt' };
  }
};

// Admin: Tạo lịch làm việc theo mẫu
export const createScheduleTemplate = async (templateData) => {
  try {
    const response = await axios.post(`${API_URL}/api/schedule/admin/template`, templateData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể tạo lịch làm việc theo mẫu' };
  }
};

// Admin: Lấy danh sách lịch làm việc do nhân viên tự đăng ký
export const getStaffRegisteredSchedules = async (startDate, endDate, status) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/admin/staff-registrations`, {
      params: { startDate, endDate, status },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy danh sách lịch làm việc do nhân viên đăng ký' };
  }
}; 