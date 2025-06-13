/**
 * Tập hợp các hàm để gọi stored procedures từ Node.js
 */

const sequelize = require('../../config/database');

/**
 * Thực thi stored procedure MySQL
 * @param {string} procedureName - Tên của stored procedure
 * @param {Array} params - Mảng các tham số cho procedure
 * @returns {Promise<Array>} - Kết quả trả về từ procedure
 */
const executeStoredProcedure = async (procedureName, params = []) => {
  try {
    // Xây dựng câu lệnh gọi procedure với số lượng tham số động
    const paramPlaceholders = params.map(() => '?').join(', ');
    const query = `CALL ${procedureName}(${paramPlaceholders})`;
    
    // Thực thi procedure
    const [results] = await sequelize.query(query, {
      replacements: params,
      type: sequelize.QueryTypes.RAW
    });
    
    // Trả về kết quả (thường là mảng đầu tiên trong kết quả)
    return results[0] || [];
  } catch (error) {
    console.error(`Error executing stored procedure ${procedureName}:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê tổng quan về kho
 * @returns {Promise<Object>} - Thống kê tổng quan về kho
 */
const getInventorySummary = async () => {
  try {
    const results = await executeStoredProcedure('sp_GetInventorySummary');
    
    // Kết quả trả về từ procedure là nhiều result sets
    // Cần xử lý để chuyển thành đối tượng JavaScript
    const summary = {
      totalIngredients: results[0]?.totalIngredients || 0,
      lowStockCount: results[1]?.lowStockCount || 0,
      lowStockIngredients: results[2] || [],
      inventoryValue: results[3]?.inventoryValue || 0,
      pendingOrders: results[4]?.pendingOrders || 0,
      recentTransactions: results[5]?.recentTransactions || 0
    };
    
    return summary;
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    throw error;
  }
};

/**
 * Lấy thống kê sử dụng nguyên liệu theo thời gian
 * @param {Object} params - Các tham số lọc
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @param {number} [params.ingredientId] - ID của nguyên liệu
 * @returns {Promise<Object>} - Thống kê sử dụng nguyên liệu
 */
const getIngredientUsageStats = async (params = {}) => {
  try {
    const { startDate, endDate, ingredientId } = params;
    const results = await executeStoredProcedure('sp_GetIngredientUsageStats', [
      startDate || null,
      endDate || null,
      ingredientId || null
    ]);
    
    return {
      usageByDate: results[0] || [],
      topIngredients: results[1] || []
    };
  } catch (error) {
    console.error('Error getting ingredient usage stats:', error);
    throw error;
  }
};

/**
 * Lấy thống kê chi phí mua nguyên liệu
 * @param {Object} params - Các tham số lọc
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @param {number} [params.supplierId] - ID của nhà cung cấp
 * @returns {Promise<Object>} - Thống kê chi phí mua nguyên liệu
 */
const getPurchaseCostStats = async (params = {}) => {
  try {
    const { startDate, endDate, supplierId } = params;
    const results = await executeStoredProcedure('sp_GetPurchaseCostStats', [
      startDate || null,
      endDate || null,
      supplierId || null
    ]);
    
    return {
      costByMonth: results[0] || [],
      costBySupplier: results[1] || []
    };
  } catch (error) {
    console.error('Error getting purchase cost stats:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo hiệu quả nhà cung cấp
 * @param {Object} params - Các tham số lọc
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @returns {Promise<Array>} - Báo cáo hiệu quả nhà cung cấp
 */
const getSupplierPerformance = async (params = {}) => {
  try {
    const { startDate, endDate } = params;
    const results = await executeStoredProcedure('sp_GetSupplierPerformance', [
      startDate || null,
      endDate || null
    ]);
    
    return results[0] || [];
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    throw error;
  }
};

/**
 * Lấy thống kê doanh thu
 * @param {Object} params - Các tham số lọc
 * @param {string} [params.period='daily'] - Kỳ thống kê (daily, monthly, yearly)
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @returns {Promise<Array>} - Thống kê doanh thu
 */
const getRevenueStats = async (params = {}) => {
  try {
    const { period = 'daily', startDate, endDate } = params;
    const results = await executeStoredProcedure('sp_GetRevenueStats', [
      period,
      startDate || null,
      endDate || null
    ]);
    
    return results[0] || [];
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    throw error;
  }
};

/**
 * Lấy thống kê doanh thu theo danh mục
 * @param {Object} params - Các tham số lọc
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @returns {Promise<Array>} - Thống kê doanh thu theo danh mục
 */
const getCategoryRevenue = async (params = {}) => {
  try {
    const { startDate, endDate } = params;
    const results = await executeStoredProcedure('sp_GetCategoryRevenue', [
      startDate || null,
      endDate || null
    ]);
    
    return results[0] || [];
  } catch (error) {
    console.error('Error getting category revenue:', error);
    throw error;
  }
};

/**
 * Lấy top món bán chạy
 * @param {Object} params - Các tham số lọc
 * @param {number} [params.limit=10] - Số lượng món ăn trả về
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @returns {Promise<Array>} - Top món bán chạy
 */
const getTopSellingItems = async (params = {}) => {
  try {
    const { limit = 10, startDate, endDate } = params;
    const results = await executeStoredProcedure('sp_GetTopSellingItems', [
      limit,
      startDate || null,
      endDate || null
    ]);
    
    return results[0] || [];
  } catch (error) {
    console.error('Error getting top selling items:', error);
    throw error;
  }
};

/**
 * Xử lý sử dụng nguyên liệu khi hoàn thành món ăn
 * @param {Object} params - Thông tin sử dụng nguyên liệu
 * @param {number} params.orderId - ID của đơn hàng
 * @param {number} params.orderItemId - ID của món ăn trong đơn hàng
 * @param {number} params.menuItemId - ID của món ăn
 * @param {number} params.quantity - Số lượng món ăn
 * @param {number} params.userId - ID của người dùng thực hiện
 * @returns {Promise<Object>} - Kết quả xử lý
 */
const processIngredientUsage = async (params) => {
  try {
    const { orderId, orderItemId, menuItemId, quantity, userId } = params;
    const results = await executeStoredProcedure('sp_ProcessIngredientUsage', [
      orderId,
      orderItemId,
      menuItemId,
      quantity,
      userId
    ]);
    
    return results[0] || { status: 'Error' };
  } catch (error) {
    console.error('Error processing ingredient usage:', error);
    throw error;
  }
};

module.exports = {
  executeStoredProcedure,
  getInventorySummary,
  getIngredientUsageStats,
  getPurchaseCostStats,
  getSupplierPerformance,
  getRevenueStats,
  getCategoryRevenue,
  getTopSellingItems,
  processIngredientUsage
}; 