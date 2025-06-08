const express = require('express');
const router = express.Router();
const { Payment, Order, User } = require('../models');
const { authenticateToken, isAdmin, isWaiter } = require('../middlewares/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Create a new payment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, transactionId, notes } = req.body;
    
    // Kiểm tra xem đơn hàng có tồn tại không
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    
    // Kiểm tra xem đã có thanh toán cho đơn hàng này chưa
    const existingPayment = await Payment.findOne({ where: { orderId } });
    if (existingPayment) {
      return res.status(400).json({ message: 'Đơn hàng này đã được thanh toán trước đó' });
    }
    
    // Tạo thanh toán mới
    const payment = await Payment.create({
      orderId,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      status: 'completed',
      transactionId,
      notes
    });
    
    // Cập nhật trạng thái đơn hàng thành đã hoàn thành
    await order.update({ status: 'completed' });
    
    return res.status(201).json({
      message: 'Thanh toán thành công',
      payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ message: 'Lỗi khi tạo thanh toán', error: error.message });
  }
});

// Get all payments with pagination and filtering
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { startDate, endDate, paymentMethod, status } = req.query;
    
    const whereClause = {};
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.gte] = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.lte] = end;
    }
    
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Order }
      ],
      order: [['paymentDate', 'DESC']],
      limit,
      offset
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      payments: rows,
      totalItems: count,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue statistics
router.get('/stats/revenue', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    let groupBy, dateFormat;
    
    switch (period) {
      case 'weekly':
        groupBy = 'WEEK';
        dateFormat = 'YYYY-WW';
        break;
      case 'monthly':
        groupBy = 'MONTH';
        dateFormat = 'YYYY-MM';
        break;
      case 'yearly':
        groupBy = 'YEAR';
        dateFormat = 'YYYY';
        break;
      default:
        groupBy = 'DAY';
        dateFormat = 'YYYY-MM-DD';
    }
    
    const whereClause = {
      status: 'completed'
    };
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.gte] = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.lte] = end;
    }
    
    const revenueData = await Payment.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat), 'date'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
      ],
      where: whereClause,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat), 'ASC']]
    });
    
    res.json(revenueData);
  } catch (error) {
    console.error('Error getting revenue statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get category revenue statistics
router.get('/stats/category', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date range filter
    let dateFilter = '';
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      dateFilter = `AND p.paymentDate BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`;
    } else if (startDate) {
      const start = new Date(startDate);
      dateFilter = `AND p.paymentDate >= '${start.toISOString()}'`;
    } else if (endDate) {
      const end = new Date(endDate);
      dateFilter = `AND p.paymentDate <= '${end.toISOString()}'`;
    }
    
    // Get category revenue statistics through raw SQL query
    const categoryStats = await sequelize.query(`
      SELECT 
        mi.category,
        COUNT(DISTINCT oi.orderId) AS numberOfOrders,
        SUM(oi.quantity) AS totalItems,
        SUM(oi.quantity * oi.price) AS totalRevenue,
        AVG(oi.price) AS averagePrice,
        MAX(p.paymentDate) AS lastOrderDate
      FROM 
        order_items oi
      JOIN 
        menu_items mi ON oi.menuItemId = mi.id
      JOIN 
        orders o ON oi.orderId = o.id
      LEFT JOIN 
        payments p ON o.id = p.orderId
      WHERE 
        o.status = 'completed'
        ${dateFilter}
      GROUP BY 
        mi.category
      ORDER BY 
        totalRevenue DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    return res.json(categoryStats);
  } catch (error) {
    console.error('Error getting category revenue statistics:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê doanh thu theo danh mục', error: error.message });
  }
});

// Get top selling items
router.get('/stats/top-items', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    // Build date range filter
    const whereConditions = {};
    let dateFilter = '';
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      dateFilter = `AND p.paymentDate BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`;
    } else if (startDate) {
      const start = new Date(startDate);
      dateFilter = `AND p.paymentDate >= '${start.toISOString()}'`;
    } else if (endDate) {
      const end = new Date(endDate);
      dateFilter = `AND p.paymentDate <= '${end.toISOString()}'`;
    }
    
    // Get top selling items through raw SQL query
    const topItems = await sequelize.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        SUM(oi.quantity) AS totalQuantitySold,
        SUM(oi.quantity * oi.price) AS totalRevenue,
        AVG(r.rating) AS averageRating,
        COUNT(r.id) AS numberOfReviews
      FROM 
        menu_items mi
      LEFT JOIN 
        order_items oi ON mi.id = oi.menuItemId
      LEFT JOIN 
        orders o ON oi.orderId = o.id AND o.status = 'completed'
      LEFT JOIN 
        payments p ON o.id = p.orderId
      LEFT JOIN 
        reviews r ON mi.id = r.menuItemId
      WHERE 
        o.id IS NOT NULL
        ${dateFilter}
      GROUP BY 
        mi.id, mi.name, mi.category
      ORDER BY 
        totalQuantitySold DESC
      LIMIT ${parseInt(limit)}
    `, { type: sequelize.QueryTypes.SELECT });
    
    return res.json(topItems);
  } catch (error) {
    console.error('Error getting top selling items:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách món ăn bán chạy nhất', error: error.message });
  }
});

// Get payment method statistics
router.get('/stats/payment-methods', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {
      status: 'completed'
    };
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.gte] = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.lte] = end;
    }
    
    const paymentMethodStats = await Payment.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: whereClause,
      group: ['paymentMethod'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });
    
    res.json(paymentMethodStats);
  } catch (error) {
    console.error('Error getting payment method statistics:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê phương thức thanh toán', error: error.message });
  }
});

// Get comprehensive analytics data
router.get('/analytics/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    const whereClause = {
      status: 'completed'
    };
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.gte] = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.paymentDate = whereClause.paymentDate || {};
      whereClause.paymentDate[Op.lte] = end;
    }
    
    // Format for date grouping
    let dateFormat;
    switch (period) {
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }
    
    // Get revenue by period
    const revenueByPeriod = await Payment.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      where: whereClause,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat), 'ASC']]
    });
    
    // Get total revenue
    const totalRevenue = await Payment.sum('amount', { where: whereClause });
    
    // Get total order count
    const totalOrders = await Payment.count({ where: whereClause });
    
    // Get revenue by payment method
    const revenueByPaymentMethod = await Payment.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['paymentMethod']
    });
    
    // Calculate previous period for comparison
    let previousPeriodWhereClause = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end.getTime() - start.getTime();
      
      const prevStart = new Date(start.getTime() - diff);
      const prevEnd = new Date(start.getTime() - 1);
      
      previousPeriodWhereClause = {
        status: 'completed',
        paymentDate: {
          [Op.between]: [prevStart, prevEnd]
        }
      };
    }
    
    // Get previous period revenue for comparison
    const previousPeriodRevenue = previousPeriodWhereClause.paymentDate ? 
      await Payment.sum('amount', { where: previousPeriodWhereClause }) : 0;
    
    // Calculate growth percentage
    const comparedToLastPeriod = previousPeriodRevenue > 0 ? 
      ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;
    
    res.json({
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        comparedToLastPeriod
      },
      revenueByPeriod,
      revenueByPaymentMethod
    });
  } catch (error) {
    console.error('Error getting analytics dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id, {
      include: [
        { model: Order }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refundAmount, notes } = req.body;
    
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    await payment.update({
      status,
      refundAmount: refundAmount || 0,
      notes
    });
    
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 