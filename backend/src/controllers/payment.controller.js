const { Payment, Order, OrderItem, MenuItem } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Create a new payment
exports.createPayment = async (req, res) => {
  const { orderId, amount, paymentMethod, transactionId, notes } = req.body;
  
  try {
    // Check if order exists and is not already paid
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    
    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ where: { orderId } });
    if (existingPayment) {
      return res.status(400).json({ message: 'Đơn hàng này đã được thanh toán trước đó' });
    }
    
    // Create payment
    const payment = await Payment.create({
      orderId,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      status: 'completed',
      transactionId,
      notes
    });
    
    // Update order status to completed
    await order.update({ status: 'completed' });
    
    return res.status(201).json({
      message: 'Thanh toán thành công',
      payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ message: 'Lỗi khi tạo thanh toán', error: error.message });
  }
};

// Get all payments with pagination and filtering
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, paymentMethod, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (startDate && endDate) {
      whereConditions.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.paymentDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.paymentDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (paymentMethod) {
      whereConditions.paymentMethod = paymentMethod;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    // Get payments with pagination
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Order,
          attributes: ['id', 'tableId', 'orderDate', 'status']
        }
      ],
      order: [['paymentDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      payments
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách thanh toán', error: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          include: [
            {
              model: OrderItem,
              include: [MenuItem]
            }
          ]
        }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
    }
    
    return res.status(200).json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin thanh toán', error: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refundAmount, notes } = req.body;
    
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
    }
    
    // Update payment
    await payment.update({
      status,
      refundAmount: refundAmount || payment.refundAmount,
      notes: notes || payment.notes
    });
    
    // If payment is refunded, update order status
    if (status === 'refunded') {
      const order = await Order.findByPk(payment.orderId);
      if (order) {
        await order.update({ status: 'cancelled' });
      }
    }
    
    return res.status(200).json({
      message: 'Cập nhật thanh toán thành công',
      payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return res.status(500).json({ message: 'Lỗi khi cập nhật thanh toán', error: error.message });
  }
};

// Get revenue statistics
exports.getRevenueStats = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    let dateFormat, groupBy;
    if (period === 'daily') {
      dateFormat = '%Y-%m-%d';
      groupBy = 'day';
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
      groupBy = 'month';
    } else if (period === 'yearly') {
      dateFormat = '%Y';
      groupBy = 'year';
    } else {
      return res.status(400).json({ message: 'Định dạng thời gian không hợp lệ. Sử dụng daily, monthly hoặc yearly' });
    }
    
    // Build date range filter
    const whereConditions = { status: 'completed' };
    if (startDate && endDate) {
      whereConditions.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.paymentDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.paymentDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Get revenue statistics
    const revenueStats = await Payment.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('paymentDate'), dateFormat), groupBy],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'numberOfPayments'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averagePayment'],
        [sequelize.literal(`SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END)`), 'cashRevenue'],
        [sequelize.literal(`SUM(CASE WHEN paymentMethod = 'card' THEN amount ELSE 0 END)`), 'cardRevenue'],
        [sequelize.literal(`SUM(CASE WHEN paymentMethod IN ('momo', 'zalopay', 'vnpay') THEN amount ELSE 0 END)`), 'eWalletRevenue']
      ],
      where: whereConditions,
      group: [groupBy],
      order: [[groupBy, 'DESC']]
    });
    
    return res.status(200).json(revenueStats);
  } catch (error) {
    console.error('Error getting revenue statistics:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thống kê doanh thu', error: error.message });
  }
};

// Get category revenue statistics
exports.getCategoryRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date range filter
    const whereConditions = {};
    if (startDate && endDate) {
      whereConditions.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.paymentDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.paymentDate = {
        [Op.lte]: new Date(endDate)
      };
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
        ${whereConditions.paymentDate ? 
          `AND p.paymentDate BETWEEN '${whereConditions.paymentDate[Op.gte].toISOString()}' AND '${whereConditions.paymentDate[Op.lte].toISOString()}'` 
          : ''}
      GROUP BY 
        mi.category
      ORDER BY 
        totalRevenue DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    return res.status(200).json(categoryStats);
  } catch (error) {
    console.error('Error getting category revenue statistics:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thống kê doanh thu theo danh mục', error: error.message });
  }
};

// Get top selling items
exports.getTopSellingItems = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    // Build date range filter
    const whereConditions = {};
    if (startDate && endDate) {
      whereConditions.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.paymentDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.paymentDate = {
        [Op.lte]: new Date(endDate)
      };
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
        ${whereConditions.paymentDate ? 
          `AND p.paymentDate BETWEEN '${whereConditions.paymentDate[Op.gte].toISOString()}' AND '${whereConditions.paymentDate[Op.lte].toISOString()}'` 
          : ''}
      GROUP BY 
        mi.id, mi.name, mi.category
      ORDER BY 
        totalQuantitySold DESC
      LIMIT ${parseInt(limit)}
    `, { type: sequelize.QueryTypes.SELECT });
    
    return res.status(200).json(topItems);
  } catch (error) {
    console.error('Error getting top selling items:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách món ăn bán chạy nhất', error: error.message });
  }
};