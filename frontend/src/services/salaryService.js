import axios from 'axios';
import { API_URL } from '../config';

const API = `${API_URL}/api/salary`;

// Lấy lương của nhân viên đang đăng nhập
export const getMyAllSalaries = async () => {
  try {
    const response = await axios.get(`${API}/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my salaries:', error);
    throw error;
  }
};

// Lấy tất cả mức lương (SalaryRate) cho các role
export const getAllSalaryRates = async () => {
  const response = await axios.get(`${API_URL}/api/salary-rate`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  return response.data;
};
// Lấy chi tiết lương theo ngày làm việc của nhân viên trong tháng
export const getSalaryDailyDetails = async (salaryId) => {
  try {
    const response = await axios.get(`${API}/me/${salaryId}/daily-details`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching salary daily details:', error);
    throw error;
  }
};

// Lấy chi tiết lương theo tháng và năm
export const getMySalaryDetail = async (month, year) => {
  try {
    const response = await axios.get(`${API}/my-salary/${month}/${year}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching salary detail for ${month}/${year}:`, error);
    throw error;
  }
};

// Admin: Lấy danh sách lương của tất cả nhân viên
export const getAllSalaries = async (filters = {}) => {
  try {
    const response = await axios.get(`${API}/admin`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all salaries:', error);
    throw error;
  }
};

// Admin: Tạo hoặc cập nhật lương cho nhân viên
export const createOrUpdateSalary = async (salaryData) => {
  try {
    const response = await axios.post(`${API}/admin/create-update`, salaryData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating/updating salary:', error);
    throw error;
  }
};

// Admin: Đánh dấu lương đã thanh toán
export const markSalaryAsPaid = async (salaryId) => {
  try {
    const response = await axios.put(`${API}/admin/${salaryId}/pay`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error marking salary ${salaryId} as paid:`, error);
    throw error;
  }
};

// Admin: Xóa bản ghi lương
export const deleteSalary = async (salaryId) => {
  try {
    const response = await axios.delete(`${API}/admin/${salaryId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting salary ${salaryId}:`, error);
    throw error;
  }
};

// Admin: Tạo bản ghi lương hàng loạt
export const batchCreateSalaries = async (batchData) => {
  try {
    const response = await axios.post(`${API}/admin/batch-create`, batchData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error batch creating salaries:', error);
    throw error;
  }
};

// Hàm hỗ trợ lấy tháng hiện tại và năm hiện tại
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // getMonth() trả về 0-11
    year: now.getFullYear()
  };
};

// Hàm hỗ trợ tính tổng lương
export const calculateTotalSalary = (salary) => {
  if (!salary) return 0;
  
  const hourlyPay = parseFloat(salary.totalHourlyPay) || 0;
  const bonus = parseFloat(salary.bonus) || 0;
  const deduction = parseFloat(salary.deduction) || 0;
  
  return hourlyPay + bonus - deduction;
}; 