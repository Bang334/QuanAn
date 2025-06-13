// Lấy thống kê tổng quan cho dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Sử dụng stored procedure để lấy thống kê tổng quan về kho
    const dbProcedures = require('../scripts/database/execute_procedures');
    const inventorySummary = await dbProcedures.getInventorySummary();
    
    // Lấy thống kê sử dụng nguyên liệu trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usageStats = await dbProcedures.getIngredientUsageStats({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    
    // Lấy thống kê chi phí mua nguyên liệu trong 6 tháng qua
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const purchaseCostStats = await dbProcedures.getPurchaseCostStats({
      startDate: sixMonthsAgo.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    
    res.status(200).json({
      inventorySummary,
      usageStats,
      purchaseCostStats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error getting dashboard stats', error: error.message });
  }
}; 