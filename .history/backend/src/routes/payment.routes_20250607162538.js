const express = require('express');
const router = express.Router();
const { Payment, Order, User } = require('../models');
const { authenticateToken, isAdmin, isWaiter } = require('../middlewares/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

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
    
    // This is a placeholder. In a real implementation, you would join with OrderItem and MenuItem
    // to get category data. For now, we'll return sample data.
    
    res.json([
      { category: 'Món chính', revenue: 1500000 },
      { category: 'Món phụ', revenue: 750000 },
      { category: 'Đồ uống', revenue: 500000 },
      { category: 'Tráng miệng', revenue: 250000 }
    ]);
  } catch (error) {
    console.error('Error getting category revenue statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top selling items
router.get('/stats/top-items', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    // This is a placeholder. In a real implementation, you would join with OrderItem and MenuItem
    // to get top selling items. For now, we'll return sample data.
    
    res.json([
      { name: 'Bún bò Huế', quantity: 150, revenue: 900000 },
      { name: 'Gỏi cuốn', quantity: 120, revenue: 360000 },
      { name: 'Chả giò tôm thịt', quantity: 100, revenue: 350000 },
      { name: 'Nước chanh', quantity: 90, revenue: 135000 },
      { name: 'Trà đá', quantity: 200, revenue: 0 }
    ]);
  } catch (error) {
    console.error('Error getting top selling items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 