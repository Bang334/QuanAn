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
    const response = await axios.post(`${API_URL}/api/schedule/admin/create`, scheduleData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể tạo lịch làm việc' };
  }
};

// Admin: Cập nhật lịch làm việc
export const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const response = await axios.put(`${API_URL}/api/schedule/admin/${scheduleId}`, scheduleData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
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

// Admin: Tạo lịch làm việc hàng loạt
export const createBatchSchedules = async (batchData) => {
  try {
    const response = await axios.post(`${API_URL}/api/schedule/admin/batch`, batchData, {
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