import axios from 'axios';
import { API_URL } from '../config';

const API = `${API_URL}/api/reviews`;

// Lấy đánh giá cho một món ăn cụ thể
export const getReviewsByMenuItem = async (menuItemId) => {
  try {
    const response = await axios.get(`${API}/menu-item/${menuItemId}`);
    return response.data || []; // Đảm bảo luôn trả về mảng, ngay cả khi không có đánh giá
  } catch (error) {
    console.error('Error fetching reviews:', error);
    // Trả về mảng rỗng thay vì ném lỗi để UI có thể hiển thị "Không có đánh giá"
    return [];
  }
};

// Lấy thông tin tổng hợp đánh giá
export const getReviewSummary = async (menuItemId) => {
  try {
    const response = await axios.get(`${API}/summary/${menuItemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review summary:', error);
    throw error;
  }
};

// Tạo đánh giá mới
export const createReview = async (reviewData) => {
  try {
    const response = await axios.post(API, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Lấy đánh giá của một bàn
export const getReviewsByTable = async (tableId) => {
  try {
    const response = await axios.get(`${API}/table/${tableId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching table reviews:', error);
    throw error;
  }
};

// Lấy đánh giá của một đơn hàng
export const getReviewsByOrder = async (orderId) => {
  try {
    const response = await axios.get(`${API}/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order reviews:', error);
    throw error;
  }
};

// Lấy món ăn được đánh giá cao nhất
export const getTopRatedItems = async (limit = 5, minRating = 4, minReviews = 3) => {
  try {
    const response = await axios.get(`${API}/top-rated`, {
      params: { limit, minRating, minReviews }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top rated items:', error);
    throw error;
  }
};

// Xóa một đánh giá
export const deleteReview = async (reviewId) => {
  try {
    const response = await axios.delete(`${API}/${reviewId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// Lấy tất cả đánh giá (dành cho admin)
export const getAllReviews = async () => {
  try {
    const response = await axios.get(API, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    throw error;
  }
}; 