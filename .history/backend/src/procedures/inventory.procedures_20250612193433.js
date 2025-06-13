const sequelize = require('../config/database');

/**
 * Lấy thống kê tổng quan về kho
 * @returns {Promise<Object>} - Thống kê tổng quan về kho
 */
const getInventorySummary = async () => {
  try {
    // Tổng số lượng nguyên liệu
    const totalIngredientsResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM ingredients',
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalIngredients = totalIngredientsResult[0].count;
    
    // Số lượng nguyên liệu sắp hết (dưới mức cảnh báo)
    const lowStockIngredientsResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE currentStock < minStockLevel',
      { type: sequelize.QueryTypes.SELECT }
    );
    const lowStockCount = lowStockIngredientsResult[0].count;
    
    // Danh sách chi tiết các nguyên liệu sắp hết
    const lowStockIngredients = await sequelize.query(
      `SELECT id, name, currentStock as currentQuantity, minStockLevel as alertThreshold, 
              unit, costPerUnit as unitPrice
       FROM ingredients
       WHERE currentStock < minStockLevel
       ORDER BY (minStockLevel - currentStock) DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Tổng giá trị kho
    const inventoryValueResult = await sequelize.query(
      'SELECT SUM(currentStock * costPerUnit) as value FROM ingredients',
      { type: sequelize.QueryTypes.SELECT }
    );
    const inventoryValue = inventoryValueResult[0].value || 0;
    
    // Số đơn đặt hàng đang chờ xử lý
    const pendingOrdersResult = await sequelize.query(
      "SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'",
      { type: sequelize.QueryTypes.SELECT }
    );
    const pendingOrders = pendingOrdersResult[0].count;
    
    // Tổng số giao dịch kho trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactionsResult = await sequelize.query(
      `SELECT COUNT(*) as count FROM inventory_transactions 
       WHERE createdAt >= '${thirtyDaysAgo.toISOString().split('T')[0]}'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const recentTransactions = recentTransactionsResult[0].count;
    
    return {
      totalIngredients,
      lowStockCount,
      lowStockIngredients,
      inventoryValue,
      pendingOrders,
      recentTransactions
    };
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
    
    let startDateFilter = '';
    if (startDate) {
      startDateFilter = `AND createdAt >= '${new Date(startDate).toISOString().split('T')[0]}'`;
    }
    
    let endDateFilter = '';
    if (endDate) {
      endDateFilter = `AND createdAt <= '${new Date(endDate).toISOString().split('T')[0]}'`;
    }
    
    let ingredientFilter = '';
    if (ingredientId) {
      ingredientFilter = `AND ingredientId = ${ingredientId}`;
    }
    
    // Lấy dữ liệu sử dụng nguyên liệu theo ngày
    const usageByDate = await sequelize.query(
      `SELECT DATE(createdAt) as date, SUM(quantity) as totalUsage 
       FROM inventory_transactions 
       WHERE type = 'out' 
       ${startDateFilter}
       ${endDateFilter}
       ${ingredientFilter}
       GROUP BY DATE(createdAt)
       ORDER BY DATE(createdAt) ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Lấy top 5 nguyên liệu được sử dụng nhiều nhất
    const topIngredients = await sequelize.query(
      `SELECT it.ingredientId, SUM(it.quantity) as totalUsage, i.name, i.unit
       FROM inventory_transactions it
       JOIN ingredients i ON it.ingredientId = i.id
       WHERE it.type = 'out'
       ${startDateFilter}
       ${endDateFilter}
       GROUP BY it.ingredientId, i.name, i.unit
       ORDER BY SUM(it.quantity) DESC
       LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    return {
      usageByDate,
      topIngredients
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
    
    let dateFilter = '';
    if (startDate) {
      dateFilter += ` AND po.createdAt >= '${new Date(startDate).toISOString().split('T')[0]}'`;
    }
    
    if (endDate) {
      dateFilter += ` AND po.createdAt <= '${new Date(endDate).toISOString().split('T')[0]}'`;
    }
    
    let supplierFilter = '';
    if (supplierId) {
      supplierFilter = ` AND po.supplierId = ${supplierId}`;
    }
    
    // Lấy chi phí mua nguyên liệu theo tháng
    const costByMonth = await sequelize.query(
      `SELECT 
         DATE_FORMAT(po.createdAt, '%Y-%m-01') as month,
         SUM(po.totalAmount) as totalCost
       FROM purchase_orders po
       WHERE po.status = 'delivered'
         ${dateFilter}
         ${supplierFilter}
       GROUP BY DATE_FORMAT(po.createdAt, '%Y-%m-01')
       ORDER BY DATE_FORMAT(po.createdAt, '%Y-%m-01') ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Lấy chi phí theo nhà cung cấp
    const costBySupplier = await sequelize.query(
      `SELECT 
         po.supplierId,
         SUM(po.totalAmount) as totalCost,
         s.name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplierId = s.id
       WHERE po.status = 'delivered'
         ${dateFilter}
       GROUP BY po.supplierId, s.name
       ORDER BY SUM(po.totalAmount) DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    return {
      costByMonth,
      costBySupplier
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
    
    let dateFilter = '';
    if (startDate) {
      dateFilter += ` AND po.createdAt >= '${new Date(startDate).toISOString().split('T')[0]}'`;
    }
    
    if (endDate) {
      dateFilter += ` AND po.createdAt <= '${new Date(endDate).toISOString().split('T')[0]}'`;
    }
    
    // Lấy thông tin hiệu suất nhà cung cấp
    const supplierPerformance = await sequelize.query(
      `SELECT 
         po.supplierId,
         COUNT(po.id) as orderCount,
         AVG(DATEDIFF(po.actualDeliveryDate, po.orderDate)) as avgDeliveryDays,
         SUM(po.totalAmount) as totalSpent,
         s.name,
         s.phone,
         s.email
       FROM purchase_orders po
       JOIN suppliers s ON po.supplierId = s.id
       WHERE po.status = 'delivered' 
         AND po.actualDeliveryDate IS NOT NULL
         ${dateFilter}
       GROUP BY po.supplierId, s.id, s.name, s.phone, s.email
       ORDER BY SUM(po.totalAmount) DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    return supplierPerformance;
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    throw error;
  }
};

module.exports = {
  getInventorySummary,
  getIngredientUsageStats,
  getPurchaseCostStats,
  getSupplierPerformance
}; 