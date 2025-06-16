const { Payment, Order, OrderItem, MenuItem } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Tạo một thanh toán mới
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, status = 'pending', notes } = req.body;
    
    // Kiểm tra đơn hàng có tồn tại không
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }
    
    // Kiểm tra đơn hàng có ở trạng thái payment_requested không
    if (order.status !== 'payment_requested') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thanh toán đơn hàng đang ở trạng thái yêu cầu thanh toán'
      });
    }
    
    // Kiểm tra số tiền thanh toán
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0'
      });
    }
    
    // Kiểm tra phương thức thanh toán hợp lệ
    const validPaymentMethods = ['cash', 'bank'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ'
      });
    }
    
    try {
      // Tạo thanh toán mới
      const payment = await Payment.create({
        orderId,
        amount,
        paymentMethod,
        status,
        notes,
        transactionId: generateTransactionId(),
        paymentDate: new Date()
      });
      
      // Cập nhật trạng thái đơn hàng thành completed khi thanh toán thành công
      // Trạng thái completed đồng nghĩa với đã thanh toán
      if (status === 'completed') {
        await order.update({ 
          status: 'completed',
          paymentMethod: paymentMethod
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Thanh toán đã được tạo thành công',
        data: payment
      });
    } catch (error) {
      // Xử lý lỗi từ MySQL trigger (nếu có)
      if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.sqlState === '45000') {
        return res.status(400).json({
          success: false,
          message: error.parent.sqlMessage || 'Không thể tạo thanh toán'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái thanh toán
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Kiểm tra thanh toán có tồn tại không
    const payment = await Payment.findByPk(id, {
      include: [{ model: Order }]
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Thanh toán không tồn tại'
      });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ'
      });
    }
    
    // Kiểm tra logic chuyển đổi trạng thái
    if (payment.status === 'completed' && status === 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển thanh toán từ Hoàn thành sang Thất bại'
      });
    }
    
    if (payment.status === 'refunded' && (status === 'completed' || status === 'failed')) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển thanh toán từ Hoàn tiền sang trạng thái khác'
      });
    }
    
    try {
      // Cập nhật thanh toán
      await payment.update({
        status,
        notes: notes || payment.notes
      });
      
      // Cập nhật trạng thái đơn hàng nếu thanh toán thành công
      if (status === 'completed' && payment.Order.status !== 'completed') {
        await payment.Order.update({ 
          status: 'completed',
          paymentMethod: payment.paymentMethod
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Trạng thái thanh toán đã được cập nhật thành công',
        data: await Payment.findByPk(id, {
          include: [{ model: Order }]
        })
      });
    } catch (error) {
      // Xử lý lỗi từ MySQL trigger (nếu có)
      if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.sqlState === '45000') {
        return res.status(400).json({
          success: false,
          message: error.parent.sqlMessage || 'Không thể cập nhật thanh toán'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
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
        [sequelize.literal(`SUM(CASE WHEN paymentMethod = 'bank' THEN amount ELSE 0 END)`), 'bankRevenue']
      ],
      where: whereConditions,
      group: [groupBy],
      order: [[groupBy, 'DESC']]
    });

    // Debug: log kết quả revenueStats và tổng doanh thu
    let totalRevenue = 0;
    if (Array.isArray(revenueStats)) {
      totalRevenue = revenueStats.reduce((sum, item) => sum + parseFloat(item.totalRevenue || 0), 0);
    }
    console.log('revenueStats:', revenueStats);
    console.log('totalRevenue:', totalRevenue);

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

/**
 * Tạo mã giao dịch ngẫu nhiên
 * @returns {string} - Mã giao dịch
 */
const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
};

// Đặt các hàm cũ vào biến để export
const getPaymentById = exports.getPaymentById;
const getAllPayments = exports.getAllPayments;
const deletePayment = exports.deletePayment;
const getRevenueStatistics = exports.getRevenueStatistics;
const getMostProfitableDishes = exports.getMostProfitableDishes;
const getPaymentsByOrderId = exports.getPaymentsByOrderId;

module.exports = {
  getPaymentById,
  getAllPayments,
  createPayment,
  updatePaymentStatus,
  deletePayment,
  getRevenueStatistics,
  getMostProfitableDishes,
  getPaymentsByOrderId
};