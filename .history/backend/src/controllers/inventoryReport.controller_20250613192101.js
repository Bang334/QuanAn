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
              unit, costPerUnit as unitPrice, image
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
      `SELECT it.ingredientId, SUM(it.quantity) as totalQuantity, i.name, i.unit, i.image
       FROM inventory_transactions it
       JOIN ingredients i ON it.ingredientId = i.id
       WHERE it.type = 'usage'
       ${startDate ? `AND it.transactionDate >= '${new Date(startDate).toISOString().split('T')[0]}'` : ''}
       ${endDate ? `AND it.transactionDate <= '${new Date(endDate).toISOString().split('T')[0]}'` : ''}
       GROUP BY it.ingredientId, i.name, i.unit, i.image
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
         DATE_FORMAT(transactionDate, '${dateFormat}') as date,
         SUM(CASE WHEN type IN ('purchase', 'adjustment_in') THEN quantity ELSE 0 END) as inflow,
         SUM(CASE WHEN type IN ('usage', 'adjustment_out', 'waste') THEN quantity ELSE 0 END) as outflow,
         SUM(CASE WHEN type IN ('purchase', 'adjustment_in') THEN quantity 
              WHEN type IN ('usage', 'adjustment_out', 'waste') THEN -quantity 
              ELSE 0 END) as netChange
       FROM inventory_transactions
       WHERE ingredientId = :ingredientId
       GROUP BY DATE_FORMAT(transactionDate, '${dateFormat}')
       ORDER BY DATE_FORMAT(transactionDate, '${dateFormat}') ASC`,
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
    const suppliers = await sequelize.query(
      `SELECT 
         s.id,
         s.name,
         s.phone,
         s.email,
         s.rating,
         COUNT(po.id) as orderCount,
         SUM(po.totalAmount) as totalSpent,
         COALESCE(AVG(CASE WHEN po.expectedDeliveryDate >= po.actualDeliveryDate THEN 1 ELSE 0 END), 0) as onTimeDeliveryRate,
         COALESCE(s.rating/5, 0) as qualityRate
       FROM suppliers s
       LEFT JOIN purchase_orders po ON s.id = po.supplierId AND po.status = 'delivered'
       ${startDate || endDate ? 'WHERE 1=1' + dateFilter : ''}
       GROUP BY s.id, s.name, s.phone, s.email, s.rating
       ORDER BY s.rating DESC, COUNT(po.id) DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    res.status(200).json({
      suppliers
    });
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    res.status(500).json({ message: 'Error getting supplier performance', error: error.message });
  }
};

// Lấy báo cáo dự báo nhu cầu nguyên liệu
exports.getForecastReport = async (req, res) => {
  try {
    // Lấy dữ liệu sử dụng nguyên liệu trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usageData = await sequelize.query(
      `SELECT 
         it.ingredientId,
         SUM(it.quantity) as totalUsage,
         AVG(it.quantity) as avgDailyUsage,
         i.name,
         i.currentStock as currentStock,
         i.minStockLevel as minStockLevel,
         i.unit,
         i.costPerUnit as price,
         i.image
       FROM inventory_transactions it
       JOIN ingredients i ON it.ingredientId = i.id
       WHERE it.type = 'usage'
         AND it.transactionDate >= '${thirtyDaysAgo.toISOString().split('T')[0]}'
       GROUP BY it.ingredientId, i.id, i.name, i.currentStock, i.minStockLevel, i.unit, i.costPerUnit, i.image`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Tính toán dự báo
    const ingredients = usageData.map(item => {
      const dailyUsage = parseFloat(item.avgDailyUsage) || 0.01; // Tránh chia cho 0
      const daysRemaining = Math.floor(parseFloat(item.currentStock) / dailyUsage);
      const forecastQuantity = dailyUsage * 30; // Dự báo cho 30 ngày tới
      const needToOrder = forecastQuantity > parseFloat(item.currentStock);
      
      return {
        id: item.ingredientId,
        name: item.name,
        currentStock: parseFloat(item.currentStock),
        minStockLevel: parseFloat(item.minStockLevel),
        unit: item.unit,
        avgDailyUsage: dailyUsage,
        daysRemaining: daysRemaining,
        forecastQuantity: forecastQuantity,
        needToOrder: needToOrder,
        suggestedOrderQuantity: needToOrder ? Math.max(forecastQuantity - parseFloat(item.currentStock), 0) : 0,
        estimatedCost: needToOrder ? Math.max(forecastQuantity - parseFloat(item.currentStock), 0) * parseFloat(item.price) : 0,
        image: item.image
      };
    });
    
    // Lấy tất cả nguyên liệu chưa có trong dự báo
    const allIngredientsWithoutUsage = await sequelize.query(
      `SELECT 
         i.id as ingredientId,
         i.name,
         i.currentStock,
         i.minStockLevel,
         i.unit,
         i.costPerUnit as price
       FROM ingredients i
       WHERE i.id NOT IN (${usageData.map(item => item.ingredientId).join(',') || 0})
         AND i.isActive = 1`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Thêm các nguyên liệu chưa có lịch sử sử dụng
    allIngredientsWithoutUsage.forEach(item => {
      ingredients.push({
        id: item.ingredientId,
        name: item.name,
        currentStock: parseFloat(item.currentStock),
        minStockLevel: parseFloat(item.minStockLevel),
        unit: item.unit,
        avgDailyUsage: 0,
        daysRemaining: null, // Không thể tính khi chưa có lịch sử sử dụng
        forecastQuantity: 0,
        needToOrder: parseFloat(item.currentStock) < parseFloat(item.minStockLevel),
        suggestedOrderQuantity: parseFloat(item.currentStock) < parseFloat(item.minStockLevel) ? parseFloat(item.minStockLevel) - parseFloat(item.currentStock) : 0,
        estimatedCost: parseFloat(item.currentStock) < parseFloat(item.minStockLevel) ? (parseFloat(item.minStockLevel) - parseFloat(item.currentStock)) * parseFloat(item.price) : 0,
        image: ''
      });
    });
    
    // Sắp xếp theo nhu cầu đặt hàng
    ingredients.sort((a, b) => {
      if (a.needToOrder && !b.needToOrder) return -1;
      if (!a.needToOrder && b.needToOrder) return 1;
      return b.suggestedOrderQuantity - a.suggestedOrderQuantity;
    });
    
    res.status(200).json({
      ingredients,
      totalCost: ingredients.reduce((sum, item) => sum + item.estimatedCost, 0),
      needToOrderCount: ingredients.filter(item => item.needToOrder).length
    });
  } catch (error) {
    console.error('Error getting forecast report:', error);
    res.status(500).json({ message: 'Error getting forecast report', error: error.message });
  }
}; 