const { Op } = require('sequelize');
const Order = require('../models/Order');

// API: GET /api/orders/total-revenue-by-month?month=6&year=2024
exports.getTotalRevenueByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: 'month và year là bắt buộc' });
    }
    const monthInt = parseInt(month);
    const yearInt = parseInt(year);
    // Tạo ngày đầu và cuối tháng
    const startDate = new Date(yearInt, monthInt - 1, 1, 0, 0, 0);
    const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);
    // Tính tổng doanh thu các đơn đã hoàn thành trong tháng
    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        status: 'completed',
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    res.json({
      month: monthInt,
      year: yearInt,
      totalRevenue: totalRevenue || 0
    });
  } catch (error) {
    console.error('Error getting total revenue by month:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 