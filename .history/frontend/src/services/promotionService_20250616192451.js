import axios from 'axios';
import { API_URL } from '../config';

// API service for promotion operations
const promotionService = {
  // Create a new promotion (admin only)
  createPromotion: async (promotionData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/api/promotions`, promotionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get all promotions with filtering (admin view)
  getAllPromotions: async (filters = {}) => {
    const token = localStorage.getItem('token');
    
    try {
      const { isActive, search } = filters;
      let url = `${API_URL}/api/promotions/admin`;
      
      if (isActive !== undefined) url += `?isActive=${isActive}`;
      if (search) url += `${isActive !== undefined ? '&' : '?'}search=${search}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting promotions:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      throw error.response ? error.response.data : error;
    }
  },

  // Get active promotions (public view for customers)
  getActivePromotions: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/promotions/active`);
      return response.data;
    } catch (error) {
      console.error('Error getting active promotions:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get promotion by ID
  getPromotionById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/promotions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting promotion:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Update promotion (admin only)
  updatePromotion: async (id, promotionData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${API_URL}/api/promotions/${id}`, promotionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Delete promotion (admin only)
  deletePromotion: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.delete(`${API_URL}/api/promotions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Apply promotion to order
  applyPromotionToOrder: async (orderId, promotionId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/api/promotions/apply`, 
        { orderId, promotionId }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error applying promotion:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Get promotions by order
  getPromotionsByOrder: async (orderId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/promotions/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting order promotions:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // Remove promotion from order
  removePromotionFromOrder: async (orderId, promotionId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.delete(`${API_URL}/api/promotions/order/${orderId}/promotion/${promotionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing promotion from order:', error);
      throw error.response ? error.response.data : error;
    }
  }
};

export default promotionService; 