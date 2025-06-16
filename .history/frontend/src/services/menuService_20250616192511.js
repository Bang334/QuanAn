import API from '../utils/API';

// Lấy tất cả các món ăn
export const getAllMenuItems = async () => {
  try {
    const response = await API.get('/menu');
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

// Đồng bộ đánh giá của các món ăn
export const syncMenuItemRatings = async () => {
  try {
    const response = await API.post('/reviews/sync-ratings');
    return response.data;
  } catch (error) {
    console.error('Error syncing menu item ratings:', error);
    throw error;
  }
};

// Lấy món ăn theo ID
export const getMenuItemById = async (id) => {
  try {
    // console.log(`Fetching menu item ${id} from API`);
    const response = await API.get(`/menu/${id}`);
    // console.log('Menu item data received:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu item with id ${id}:`, error);
    throw error;
  }
};

// Lấy món ăn theo danh mục
export const getMenuItemsByCategory = async (category) => {
  try {
    const response = await API.get(`/menu/category/${category}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu items by category ${category}:`, error);
    throw error;
  }
};

// Lấy các món ăn phổ biến
export const getPopularItems = async (limit = 5) => {
  try {
    const response = await API.get(`/menu/popular`, { params: { limit } });
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