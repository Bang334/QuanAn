import axios from 'axios';
import { API_URL } from '../config';

const API = axios.create({
  baseURL: `${API_URL}/api/inventory`,
  withCredentials: true
});

// Interceptor để thêm token vào header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ingredient API
export const getAllIngredients = async () => {
  try {
    const response = await API.get('/ingredients');
    console.log("API response for getAllIngredients:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    throw error.response?.data || error.message;
  }
};

export const getIngredientById = async (id) => {
  try {
    const response = await API.get(`/ingredients/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getLowStockIngredients = async () => {
  try {
    const response = await API.get('/ingredients/low-stock');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getIngredientTransactions = async (id) => {
  try {
    const response = await API.get(`/ingredients/${id}/transactions`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getIngredientPriceHistory = async (id, params) => {
  try {
    const response = await API.get(`/ingredients/${id}/price-history`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createIngredient = async (ingredientData) => {
  try {
    const response = await API.post('/ingredients', ingredientData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateIngredient = async (id, ingredientData) => {
  try {
    const response = await API.put(`/ingredients/${id}`, ingredientData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const adjustIngredientQuantity = async (id, adjustmentData) => {
  try {
    const response = await API.patch(`/ingredients/${id}/adjust`, adjustmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteIngredient = async (id) => {
  try {
    const response = await API.delete(`/ingredients/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Supplier API
export const getAllSuppliers = async () => {
  try {
    const response = await API.get('/suppliers');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getActiveSuppliers = async () => {
  try {
    const response = await API.get('/suppliers/active');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const searchSuppliers = async (query) => {
  try {
    const response = await API.get('/suppliers/search', { params: { query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getSupplierById = async (id) => {
  try {
    const response = await API.get(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getSupplierPurchaseHistory = async (id) => {
  try {
    const response = await API.get(`/suppliers/${id}/purchase-history`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const response = await API.post('/suppliers', supplierData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await API.put(`/suppliers/${id}`, supplierData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await API.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Purchase Order API
export const getAllPurchaseOrders = async () => {
  try {
    const response = await API.get('/purchase-orders');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getKitchenPurchaseOrders = async () => {
  try {
    const response = await API.get('/purchase-orders/kitchen');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPurchaseOrderById = async (id) => {
  try {
    const response = await API.get(`/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPurchaseOrderItems = async (purchaseOrderId) => {
  try {
    const response = await API.get('/purchase-order-items', {
      params: { purchaseOrderId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createPurchaseOrder = async (orderData) => {
  try {
    const response = await API.post('/purchase-orders', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePurchaseOrder = async (id, orderData) => {
  try {
    const response = await API.put(`/purchase-orders/${id}`, orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePurchaseOrderStatus = async (id, statusData) => {
  try {
    const response = await API.patch(`/purchase-orders/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deletePurchaseOrder = async (id) => {
  try {
    const response = await API.delete(`/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Recipe API
export const getAllRecipes = async () => {
  try {
    const response = await API.get('/recipes');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRecipeByMenuItem = async (menuItemId) => {
  try {
    const response = await API.get(`/recipes/menu-item/${menuItemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createOrUpdateRecipe = async (menuItemId, recipeData) => {
  try {
    const response = await API.post(`/recipes/menu-item/${menuItemId}`, recipeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteRecipe = async (menuItemId) => {
  try {
    const response = await API.delete(`/recipes/menu-item/${menuItemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const calculateIngredientsForOrder = async (orderItems) => {
  try {
    const response = await API.post('/recipes/calculate', { orderItems });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const processIngredientUsage = async (usageData) => {
  try {
    const response = await API.post('/recipes/process-usage', usageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getIngredientUsageByMenuItem = async (menuItemId, params) => {
  try {
    const response = await API.get(`/recipes/usage/menu-item/${menuItemId}`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Inventory Report API
export const getInventorySummary = async () => {
  try {
    // Mock data for development
    const mockData = {
      totalIngredients: 20,
      activeIngredients: 18,
      lowStockCount: 2,
      totalInventoryValue: 18419500,
      pendingPurchaseOrders: 3,
      pendingOrdersValue: 5200000
    };
    
    // Uncomment when API is implemented
    // const response = await API.get('/reports/summary');
    // return response.data;
    
    return mockData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getIngredientUsageStats = async (params) => {
  try {
    // Mock data for development
    const mockData = {
      ingredients: [
        { id: 1, name: 'Thịt bò', totalQuantity: 25.5, unit: 'kg', costPerUnit: 280000 },
        { id: 2, name: 'Thịt gà', totalQuantity: 18.2, unit: 'kg', costPerUnit: 120000 },
        { id: 3, name: 'Tôm', totalQuantity: 12.7, unit: 'kg', costPerUnit: 350000 },
        { id: 4, name: 'Gạo', totalQuantity: 45.0, unit: 'kg', costPerUnit: 25000 },
        { id: 5, name: 'Bột mì', totalQuantity: 15.3, unit: 'kg', costPerUnit: 20000 },
        { id: 6, name: 'Rau cải', totalQuantity: 8.8, unit: 'kg', costPerUnit: 35000 },
        { id: 7, name: 'Hành tây', totalQuantity: 7.5, unit: 'kg', costPerUnit: 30000 },
        { id: 8, name: 'Ớt', totalQuantity: 2.3, unit: 'kg', costPerUnit: 60000 },
        { id: 9, name: 'Dầu ăn', totalQuantity: 10.0, unit: 'l', costPerUnit: 45000 },
        { id: 10, name: 'Nước mắm', totalQuantity: 5.5, unit: 'l', costPerUnit: 70000 },
      ],
      totalUsage: 150.8,
      totalCost: 15250000,
      dateRange: {
        start: params.startDate,
        end: params.endDate
      }
    };
    
    // Uncomment when API is implemented
    // const response = await API.get('/reports/usage-stats', { params });
    // return response.data;
    
    return mockData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPurchaseCostStats = async (params) => {
  try {
    // Mock data for development
    const mockData = {
      monthlyCosts: [
        { month: '01/2025', cost: 12500000 },
        { month: '02/2025', cost: 14200000 },
        { month: '03/2025', cost: 13800000 },
        { month: '04/2025', cost: 15100000 },
        { month: '05/2025', cost: 14900000 },
        { month: '06/2025', cost: 16200000 },
      ],
      totalCost: 86700000,
      averageCost: 14450000,
      dateRange: {
        start: params.startDate,
        end: params.endDate
      }
    };
    
    // Uncomment when API is implemented
    // const response = await API.get('/reports/purchase-costs', { params });
    // return response.data;
    
    return mockData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getIngredientStockHistory = async (id, params) => {
  try {
    const response = await API.get(`/reports/ingredients/${id}/stock-history`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getSupplierPerformance = async (params) => {
  try {
    // Mock data for development
    const mockData = {
      suppliers: [
        { id: 1, name: 'Công ty thực phẩm sạch', orderCount: 12, onTimeDelivery: 11, rating: 4.8 },
        { id: 2, name: 'Trang trại rau hữu cơ Đà Lạt', orderCount: 8, onTimeDelivery: 7, rating: 4.5 },
        { id: 3, name: 'Công ty gia vị Việt', orderCount: 6, onTimeDelivery: 6, rating: 5.0 },
        { id: 4, name: 'Xưởng gạo Tấn Phát', orderCount: 4, onTimeDelivery: 3, rating: 4.2 },
        { id: 5, name: 'Công ty đồ uống Phúc Long', orderCount: 5, onTimeDelivery: 4, rating: 4.0 },
      ],
      dateRange: {
        start: params.startDate,
        end: params.endDate
      }
    };
    
    // Uncomment when API is implemented
    // const response = await API.get('/reports/supplier-performance', { params });
    // return response.data;
    
    return mockData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getForecastReport = async () => {
  try {
    // Mock data for development
    const mockData = {
      forecast: [
        { ingredient: 'Thịt bò', currentStock: 15.2, estimatedUsage: 10.5, daysRemaining: 10, reorderPoint: 5.0 },
        { ingredient: 'Thịt gà', currentStock: 8.5, estimatedUsage: 6.2, daysRemaining: 9, reorderPoint: 4.0 },
        { ingredient: 'Tôm', currentStock: 5.3, estimatedUsage: 4.8, daysRemaining: 7, reorderPoint: 3.0 },
        { ingredient: 'Gạo', currentStock: 25.0, estimatedUsage: 5.0, daysRemaining: 35, reorderPoint: 10.0 },
        { ingredient: 'Bột mì', currentStock: 12.0, estimatedUsage: 3.0, daysRemaining: 28, reorderPoint: 5.0 },
        { ingredient: 'Rau cải', currentStock: 3.5, estimatedUsage: 2.5, daysRemaining: 9, reorderPoint: 2.0 },
        { ingredient: 'Hành tây', currentStock: 4.2, estimatedUsage: 2.0, daysRemaining: 14, reorderPoint: 2.0 },
        { ingredient: 'Ớt', currentStock: 0.8, estimatedUsage: 0.5, daysRemaining: 11, reorderPoint: 0.5 },
        { ingredient: 'Dầu ăn', currentStock: 5.0, estimatedUsage: 1.5, daysRemaining: 23, reorderPoint: 2.0 },
        { ingredient: 'Nước mắm', currentStock: 3.0, estimatedUsage: 1.0, daysRemaining: 21, reorderPoint: 1.0 },
      ],
      lowStockIngredients: [
        { ingredient: 'Ớt', currentStock: 0.8, estimatedUsage: 0.5, daysRemaining: 11, reorderPoint: 0.5 },
        { ingredient: 'Rau cải', currentStock: 3.5, estimatedUsage: 2.5, daysRemaining: 9, reorderPoint: 2.0 },
      ]
    };
    
    // Uncomment when API is implemented
    // const response = await API.get('/reports/forecast');
    // return response.data;
    
    return mockData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Kitchen Permission API
export const getActiveKitchenPermissions = async () => {
  try {
    const response = await API.get('/kitchen-permissions/active');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserKitchenPermissions = async (userId) => {
  try {
    const response = await API.get(`/kitchen-permissions/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const checkAutoApprovePermission = async (userId) => {
  try {
    const response = await API.get(`/kitchen-permissions/check/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getKitchenPermissionById = async (id) => {
  try {
    const response = await API.get(`/kitchen-permissions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllKitchenPermissions = async () => {
  try {
    const response = await API.get('/kitchen-permissions');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createKitchenPermission = async (permissionData) => {
  try {
    const response = await API.post('/kitchen-permissions', permissionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateKitchenPermission = async (id, permissionData) => {
  try {
    const response = await API.put(`/kitchen-permissions/${id}`, permissionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const revokeKitchenPermission = async (id) => {
  try {
    const response = await API.patch(`/kitchen-permissions/${id}/revoke`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Lấy danh mục từ database
export const getAllCategories = async () => {
  try {
    // Lấy tất cả nguyên liệu để trích xuất danh mục duy nhất
    const response = await API.get('/ingredients');
    const ingredients = response.data;
    
    // Tạo map để lưu trữ danh mục duy nhất
    const categoryMap = new Map();
    
    // Lặp qua mỗi nguyên liệu để lấy danh mục
    ingredients.forEach(ingredient => {
      if (ingredient.category && !categoryMap.has(ingredient.category)) {
        categoryMap.set(ingredient.category, {
          id: categoryMap.size + 1,
          name: ingredient.category,
          description: `Danh mục ${ingredient.category}`
        });
      }
    });
    
    // Chuyển đổi map thành array
    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error.response?.data || error.message;
  }
};
