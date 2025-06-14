import axios from 'axios';
import { API_URL } from '../config';

// Lấy danh sách chấm công của bản thân
export const getMyAttendances = async (month, year) => {
  try {
    const response = await axios.get(`${API_URL}/api/attendance/my-attendance`, {
      params: { month, year },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy dữ liệu chấm công' };
  }
};

// Chấm công vào ca
export const clockIn = async () => {
  try {
    const response = await axios.post(`${API_URL}/api/attendance/clock-in`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể chấm công vào ca' };
  }
};

// Chấm công ra ca
export const clockOut = async () => {
  try {
    const response = await axios.post(`${API_URL}/api/attendance/clock-out`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể chấm công ra ca' };
  }
};

// Admin: Lấy danh sách chấm công của tất cả nhân viên
export const getAllAttendances = async (date, userId, month, year, status) => {
  try {
    const response = await axios.get(`${API_URL}/api/attendance/admin`, {
      params: { date, userId, month, year, status },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy dữ liệu chấm công' };
  }
};

// Admin: Tạo hoặc cập nhật bản ghi chấm công
export const createOrUpdateAttendance = async (attendanceData) => {
  try {
    const response = await axios.post(`${API_URL}/api/attendance/admin/create-update`, attendanceData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể tạo/cập nhật bản ghi chấm công' };
  }
};

// Admin: Xóa bản ghi chấm công
export const deleteAttendance = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/attendance/admin/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể xóa bản ghi chấm công' };
  }
};

// Admin: Lấy báo cáo chấm công theo tháng
export const getMonthlyReport = async (month, year) => {
  try {
    const response = await axios.get(`${API_URL}/api/attendance/admin/report`, {
      params: { month, year },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy báo cáo chấm công' };
  }
}; 