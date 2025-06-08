import axios from 'axios';
import { API_URL } from '../config';

const API = `${API_URL}/api/menu`;

// Lấy tất cả các món ăn
export const getAllMenuItems = async () => {
  try {
    const response = await axios.get(API);
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

// Lấy món ăn theo ID
export const getMenuItemById = async (id) => {
  try {
    const response = await axios.get(`${API}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu item with id ${id}:`, error);
    throw error;
  }
};

// Lấy món ăn theo danh mục
export const getMenuItemsByCategory = async (category) => {
  try {
    const response = await axios.get(`${API}/category/${category}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu items by category ${category}:`, error);
    throw error;
  }
};

// Lấy các món ăn phổ biến
export const getPopularItems = async (limit = 5) => {
  try {
    const response = await axios.get(`${API}/popular`, { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular menu items:', error);
    throw error;
  }
};

// Tìm kiếm món ăn theo tên
export const searchMenuItems = async (searchTerm) => {
  try {
    const allItems = await getAllMenuItems();
    if (!searchTerm) return allItems;
    
    const searchTermLower = searchTerm.toLowerCase();
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchTermLower) || 
      (item.description && item.description.toLowerCase().includes(searchTermLower))
    );
  } catch (error) {
    console.error(`Error searching menu items with term "${searchTerm}":`, error);
    throw error;
  }
}; 