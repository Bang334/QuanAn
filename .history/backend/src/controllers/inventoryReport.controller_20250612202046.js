const { Op } = require('sequelize');
const { 
  Ingredient, 
  InventoryTransaction, 
  PurchaseOrder, 
  PurchaseOrderItem,
  Supplier,
  User,
  sequelize
} = require('../models');

// Lấy thống kê tổng quan về kho
exports.getInventorySummary = async (req, res) => {
  try {
    // Tổng số lượng nguyên liệu
    const totalIngredientsResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM ingredients',
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalIngredients = totalIngredientsResult[0].count;
    
    // Số lượng nguyên liệu đang sử dụng (isActive = 1)
    const activeIngredientsResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE isActive = 1',
      { type: sequelize.QueryTypes.SELECT }
    );
    const activeIngredients = activeIngredientsResult[0].count;
    
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
    const totalInventoryValue = parseFloat(inventoryValueResult[0].value || 0);
    
    // Số đơn đặt hàng đang chờ duyệt
    const pendingOrdersResult = await sequelize.query(
      "SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'",
      { type: sequelize.QueryTypes.SELECT }
    );
    const pendingPurchaseOrders = pendingOrdersResult[0].count;
    
    // Tổng giá trị đơn đặt hàng đang chờ duyệt
    const pendingOrdersValueResult = await sequelize.query(
      "SELECT SUM(totalAmount) as value FROM purchase_orders WHERE status = 'pending'",
      { type: sequelize.QueryTypes.SELECT }
    );
    const pendingOrdersValue = parseFloat(pendingOrdersValueResult[0].value || 0);
    
    // Tổng số giao dịch kho trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactionsResult = await sequelize.query(
      `SELECT COUNT(*) as count FROM inventory_transactions 
       WHERE createdAt >= '${thirtyDaysAgo.toISOString().split('T')[0]}'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const recentTransactions = recentTransactionsResult[0].count;
    
    res.status(200).json({
      totalIngredients,
      activeIngredients,
      lowStockCount,
      lowStockIngredients,
      totalInventoryValue,
      pendingPurchaseOrders,
      pendingOrdersValue,
      recentTransactions
    });
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    res.status(500).json({ message: 'Error getting inventory summary', error: error.message });
  }
};

// Lấy thống kê sử dụng nguyên liệu theo thời gian
exports.getIngredientUsageStats = async (req, res) => {
  try {
    const { startDate, endDate, ingredientId } = req.query;
    const whereClause = {
      type: 'out',
      createdAt: {}
    };
    
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate);
    }
    
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }
    
    if (ingredientId) {
      whereClause.ingredientId = ingredientId;
    }
    
    // Lấy dữ liệu sử dụng nguyên liệu theo ngày
    const usageByDate = await sequelize.query(
      `SELECT DATE(createdAt) as date, SUM(quantity) as totalUsage 
       FROM inventory_transactions 
       WHERE type = 'out' 
       ${startDate ? `AND createdAt >= '${new Date(startDate).toISOString().split('T')[0]}'` : ''}
       ${endDate ? `AND createdAt <= '${new Date(endDate).toISOString().split('T')[0]}'` : ''}
       ${ingredientId ? `AND ingredientId = ${ingredientId}` : ''}
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
       ${startDate ? `AND it.createdAt >= '${new Date(startDate).toISOString().split('T')[0]}'` : ''}
       ${endDate ? `AND it.createdAt <= '${new Date(endDate).toISOString().split('T')[0]}'` : ''}
       GROUP BY it.ingredientId, i.name, i.unit
       ORDER BY SUM(it.quantity) DESC
       LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    res.status(200).json({
      usageByDate,
      topIngredients
    });
  } catch (error) {
    console.error('Error getting ingredient usage stats:', error);
    res.status(500).json({ message: 'Error getting ingredient usage stats', error: error.message });
  }
};

// Lấy thống kê chi phí mua nguyên liệu
exports.getPurchaseCostStats = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    
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
    
    res.status(200).json({
      costByMonth,
      costBySupplier
    });
  } catch (error) {
    console.error('Error getting purchase cost stats:', error);
    res.status(500).json({ message: 'Error getting purchase cost stats', error: error.message });
  }
};

// Lấy thống kê về biến động tồn kho của một nguyên liệu cụ thể
exports.getIngredientStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.query; // daily, weekly, monthly
    
    let dateFormat;
    switch (period) {
      case 'weekly':
        dateFormat = '%Y-%U'; // Năm-Tuần
        break;
      case 'monthly':
        dateFormat = '%Y-%m'; // Năm-Tháng
        break;
      case 'daily':
      default:
        dateFormat = '%Y-%m-%d'; // Năm-Tháng-Ngày
        break;
    }
    
    // Lấy lịch sử giao dịch theo thời gian
    const stockHistory = await sequelize.query(
      `SELECT 
         DATE_FORMAT(createdAt, '${dateFormat}') as date,
         SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as inflow,
         SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as outflow,
         SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END) as netChange
       FROM inventory_transactions
       WHERE ingredientId = :ingredientId
       GROUP BY DATE_FORMAT(createdAt, '${dateFormat}')
       ORDER BY DATE_FORMAT(createdAt, '${dateFormat}') ASC`,
      { 
        replacements: { ingredientId: id },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    // Lấy thông tin nguyên liệu
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    
    res.status(200).json({
      ingredient,
      stockHistory
    });
  } catch (error) {
    console.error('Error getting ingredient stock history:', error);
    res.status(500).json({ message: 'Error getting ingredient stock history', error: error.message });
  }
};

// Lấy báo cáo hiệu quả nhà cung cấp
exports.getSupplierPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
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
    
    res.status(200).json(supplierPerformance);
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    res.status(500).json({ message: 'Error getting supplier performance', error: error.message });
  }
};

// Lấy báo cáo dự báo nhu cầu nguyên liệu
exports.getForecastReport = async (req, res) => {
  try {
    // Lấy dữ liệu sử dụng nguyên liệu trong 90 ngày qua
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const usageData = await sequelize.query(
      `SELECT 
         it.ingredientId,
         SUM(it.quantity) as totalUsage,
         AVG(it.quantity) as avgDailyUsage,
         i.name,
         i.currentStock as currentQuantity,
         i.minStockLevel as minQuantity,
         i.unit,
         i.costPerUnit as price
       FROM inventory_transactions it
       JOIN ingredients i ON it.ingredientId = i.id
       WHERE it.type = 'out'
         AND it.createdAt >= '${ninetyDaysAgo.toISOString().split('T')[0]}'
       GROUP BY it.ingredientId, i.id, i.name, i.currentStock, i.minStockLevel, i.unit, i.costPerUnit`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Tính toán dự báo
    const forecast = usageData.map(item => {
      const dailyUsage = item.avgDailyUsage || 0;
      const daysRemaining = dailyUsage > 0 ? Math.floor(item.currentQuantity / dailyUsage) : null;
      const estimatedOrderDate = dailyUsage > 0 ? new Date(Date.now() + (daysRemaining - 7) * 24 * 60 * 60 * 1000) : null;
      const recommendedOrderQuantity = dailyUsage > 0 ? Math.max(item.minQuantity * 2 - item.currentQuantity, 0) : 0;
      
      return {
        ingredientId: item.ingredientId,
        name: item.name,
        currentQuantity: item.currentQuantity,
        unit: item.unit,
        avgDailyUsage: dailyUsage,
        daysRemaining: daysRemaining,
        estimatedOrderDate: estimatedOrderDate,
        recommendedOrderQuantity: recommendedOrderQuantity,
        estimatedCost: recommendedOrderQuantity * item.price
      };
    });
    
    res.status(200).json(forecast);
  } catch (error) {
    console.error('Error getting forecast report:', error);
    res.status(500).json({ message: 'Error getting forecast report', error: error.message });
  }
}; 