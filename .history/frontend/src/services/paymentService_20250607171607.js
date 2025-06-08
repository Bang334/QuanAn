import axios from 'axios';
import { API_URL } from '../config';

// API service for payment operations
const paymentService = {
  // Create a new payment
  createPayment: async (paymentData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/api/payments`, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get all payments with pagination and filtering
  getAllPayments: async (page = 1, limit = 10, filters = {}) => {
    const token = localStorage.getItem('token');
    try {
      const { startDate, endDate, paymentMethod, status } = filters;
      let url = `${API_URL}/api/payments?page=${page}&limit=${limit}`;
      
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (paymentMethod) url += `&paymentMethod=${paymentMethod}`;
      if (status) url += `&status=${status}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Update payment
  updatePayment: async (id, paymentData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${API_URL}/api/payments/${id}`, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get revenue statistics
  getRevenueStats: async (period = 'daily', startDate = null, endDate = null) => {
    const token = localStorage.getItem('token');
    try {
      let url = `${API_URL}/api/payments/stats/revenue?period=${period}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting revenue statistics:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get category revenue statistics
  getCategoryRevenue: async (startDate = null, endDate = null) => {
    const token = localStorage.getItem('token');
    try {
      let url = `${API_URL}/api/payments/stats/category`;
      if (startDate) url += `?startDate=${startDate}`;
      if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting category revenue statistics:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get top selling items
  getTopSellingItems: async (limit = 10, startDate = null, endDate = null) => {
    const token = localStorage.getItem('token');
    try {
      let url = `${API_URL}/api/payments/stats/top-items?limit=${limit}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting top selling items:', error);
      throw error.response ? error.response.data : error;
    }
  },
  
  // Get payment method statistics
  getPaymentMethodStats: async (startDate = null, endDate = null) => {
    const token = localStorage.getItem('token');
    try {
      let url = `${API_URL}/api/payments/stats/payment-methods`;
      if (startDate) url += `?startDate=${startDate}`;
      if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payment method statistics:', error);
      throw error.response ? error.response.data : error;
    }
  },
  
  // Get comprehensive analytics dashboard data
  getAnalyticsDashboard: async (period = 'daily', startDate = null, endDate = null) => {
    const token = localStorage.getItem('token');
    try {
      let url = `${API_URL}/api/payments/analytics/dashboard?period=${period}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting analytics dashboard data:', error);
      throw error.response ? error.response.data : error;
    }
  }
};

export default paymentService; 