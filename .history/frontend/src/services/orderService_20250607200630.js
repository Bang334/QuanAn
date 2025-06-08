import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const orderService = {
  // Get all orders with optional filters
  getAllOrders: async (filters = {}) => {
    try {
      const { status, date, tableId, limit } = filters;
      let url = `${API_URL}/orders`;
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (date) params.append('date', date);
      if (tableId) params.append('tableId', tableId);
      if (limit) params.append('limit', limit);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  // Get a specific order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Get orders for a specific table
  getOrdersByTable: async (tableId, status) => {
    try {
      let url = `${API_URL}/orders/table/${tableId}`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching orders for table ${tableId}:`, error);
      throw error;
    }
  },
  
  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },
  
  // Update order item status (for kitchen staff)
  updateOrderItemStatus: async (itemId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/orders/items/${itemId}/status`,
        { status },
        { headers: getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating order item ${itemId} status:`, error);
      throw error;
    }
  },
  
  // Process payment for an order
  processPayment: async (orderId, paymentMethod) => {
    try {
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/payment`,
        { 
          paymentStatus: 'paid',
          paymentMethod 
        },
        { headers: getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error processing payment for order ${orderId}:`, error);
      throw error;
    }
  }
};

export default orderService; 