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
      type: 'usage',
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
      `SELECT DATE(transactionDate) as date, SUM(quantity) as totalUsage 
       FROM inventory_transactions 
       WHERE type = 'usage' 
       ${startDate ? `AND transactionDate >= '${new Date(startDate).toISOString().split('T')[0]}'` : ''}
       ${endDate ? `AND transactionDate <= '${new Date(endDate).toISOString().split('T')[0]}'` : ''}
       ${ingredientId ? `AND ingredientId = ${ingredientId}` : ''}
       GROUP BY DATE(transactionDate)
       ORDER BY DATE(transactionDate) ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Lấy top 10 nguyên liệu được sử dụng nhiều nhất
    const topIngredients = await sequelize.query(
      `SELECT it.ingredientId, SUM(it.quantity) as totalQuantity, i.name, i.unit
       FROM inventory_transactions it
       JOIN ingredients i ON it.ingredientId = i.id
       WHERE it.type = 'usage'
       ${startDate ? `AND it.transactionDate >= '${new Date(startDate).toISOString().split('T')[0]}'` : ''}
       ${endDate ? `AND it.transactionDate <= '${new Date(endDate).toISOString().split('T')[0]}'` : ''}
       GROUP BY it.ingredientId, i.name, i.unit
       ORDER BY SUM(it.quantity) DESC
       LIMIT 10`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    res.status(200).json({
      usageByDate,
      ingredients: topIngredients
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
      dateFilter += ` AND it.transactionDate >= '${new Date(startDate).toISOString().split('T')[0]}'`;
    }
    
    if (endDate) {
      dateFilter += ` AND it.transactionDate <= '${new Date(endDate).toISOString().split('T')[0]}'`;
    }
    
    let supplierFilter = '';
    if (supplierId) {
      supplierFilter = ` AND po.supplierId = ${supplierId}`;
    }
    
    // Lấy chi phí mua nguyên liệu theo tháng
    const monthlyData = await sequelize.query(
      `SELECT 
         DATE_FORMAT(it.transactionDate, '%Y-%m') as month,
         SUM(it.quantity * it.unitPrice) as totalCost
       FROM inventory_transactions it
       WHERE it.type = 'purchase'
         ${dateFilter}
       GROUP BY DATE_FORMAT(it.transactionDate, '%Y-%m')
       ORDER BY DATE_FORMAT(it.transactionDate, '%Y-%m') ASC`,
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
         ${supplierFilter}
       GROUP BY po.supplierId, s.name
       ORDER BY SUM(po.totalAmount) DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Lấy dữ liệu chi tiết cho từng tháng và từng loại nguyên liệu
    const detailedData = await sequelize.query(
      `SELECT 
         DATE_FORMAT(it.transactionDate, '%Y-%m') as month,
         it.ingredientId,
         i.name as ingredientName,
         i.unit,
         SUM(it.quantity) as totalQuantity,
         SUM(it.quantity * it.unitPrice) as totalCost
       FROM inventory_transactions it
       JOIN ingredients i ON it.ingredientId = i.id
       WHERE it.type = 'purchase'
         ${dateFilter}
       GROUP BY DATE_FORMAT(it.transactionDate, '%Y-%m'), it.ingredientId, i.name, i.unit
       ORDER BY DATE_FORMAT(it.transactionDate, '%Y-%m') ASC, SUM(it.quantity * it.unitPrice) DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Tính tổng chi phí
    const totalCost = monthlyData.reduce((sum, month) => sum + parseFloat(month.totalCost || 0), 0);
    
    res.status(200).json({
      totalCost,
      monthlyData,
      costBySupplier,
      detailedData
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