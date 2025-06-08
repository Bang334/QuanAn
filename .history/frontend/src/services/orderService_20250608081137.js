import axios from 'axios';
import { API_URL } from '../config';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const orderService = {
  // Get all orders with optional filters
  getAllOrders: async (filters = {}) => {
    try {
      let url = `${API_URL}/api/orders`;
      
      // Add query parameters if provided
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.tableId) queryParams.append('tableId', filters.tableId);
      if (filters.date) queryParams.append('date', filters.date);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
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
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Get orders for a specific table
  getOrdersByTable: async (tableId, status) => {
    try {
      let url = `${API_URL}/api/orders/table/${tableId}`;
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
  
  // Accept an order (for waiter or admin)
  acceptOrder: async (orderId) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/accept`,
        {},
        { headers: getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error accepting order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
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
  updateOrderItemStatus: async (orderId, itemId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/items/${itemId}/status`,
        { status },
        { headers: getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating order item ${itemId} status:`, error);
      throw error;
    }
  },
  
  // Serve individual order item (for waiter)
  serveOrderItem: async (itemId) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/items/${itemId}/serve`,
        {},
        { headers: getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error serving order item ${itemId}:`, error);
      throw error;
    }
  },
  
  // Process payment for an order
  processPayment: async (orderId, paymentMethod) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/${orderId}/payment`,
        { paymentMethod },
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