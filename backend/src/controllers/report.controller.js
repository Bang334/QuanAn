// Lấy báo cáo doanh thu
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    // Kiểm tra tham số đầu vào
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Kiểm tra period hợp lệ
    if (!['daily', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use daily, monthly or yearly' });
    }
    
    // Sử dụng stored procedure để lấy thống kê doanh thu
    const dbProcedures = require('../scripts/database/execute_procedures');
    
    // Lấy thống kê doanh thu theo kỳ
    const revenueStats = await dbProcedures.getRevenueStats({
      period,
      startDate,
      endDate
    });
    
    // Lấy thống kê doanh thu theo danh mục
    const categoryRevenue = await dbProcedures.getCategoryRevenue({
      startDate,
      endDate
    });
    
    // Lấy top 10 món bán chạy
    const topSellingItems = await dbProcedures.getTopSellingItems({
      limit: 10,
      startDate,
      endDate
    });
    
    res.status(200).json({
      revenueStats,
      categoryRevenue,
      topSellingItems
    });
  } catch (error) {
    console.error('Error getting revenue report:', error);
    res.status(500).json({ message: 'Error getting revenue report', error: error.message });
  }
}; 