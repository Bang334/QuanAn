const { Review, MenuItem, Order, Table } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Hàm lấy tất cả đánh giá cho một món ăn
exports.getReviewsByMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    const reviews = await Review.findAll({
      where: {
        menuItemId,
        isVisible: true
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy đánh giá' });
  }
};

// Hàm lấy thông tin tổng hợp đánh giá cho một món ăn
exports.getReviewSummary = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    const summary = await Review.findAll({
      where: {
        menuItemId,
        isVisible: true
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN rating = 5 THEN 1 ELSE 0 END')), 'fiveStars'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN rating = 4 THEN 1 ELSE 0 END')), 'fourStars'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN rating = 3 THEN 1 ELSE 0 END')), 'threeStars'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN rating = 2 THEN 1 ELSE 0 END')), 'twoStars'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN rating = 1 THEN 1 ELSE 0 END')), 'oneStars']
      ]
    });
    
    return res.status(200).json(summary[0]);
  } catch (error) {
    console.error('Error getting review summary:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin tổng hợp đánh giá' });
  }
};

// Hàm thêm đánh giá mới
exports.createReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { menuItemId, orderId, tableId, rating, comment, userName } = req.body;
    
    if (!menuItemId || !orderId || !rating || rating < 1 || rating > 5) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
    
    // Kiểm tra xem menuItem có tồn tại không
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }
    
    // Kiểm tra xem order có tồn tại không
    const order = await Order.findByPk(orderId);
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Tạo đánh giá mới
    const newReview = await Review.create({
      menuItemId,
      orderId,
      tableId: tableId || order.tableId,
      rating,
      comment,
      userName: userName || 'Khách hàng',
      reviewDate: new Date(),
      isVisible: true
    }, { transaction });
    
    // Cập nhật avgRating và ratingCount của MenuItem
    const reviewStats = await Review.findAll({
      where: {
        menuItemId,
        isVisible: true
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
      ],
      transaction
    });
    
    await menuItem.update({
      avgRating: parseFloat(reviewStats[0].dataValues.avgRating) || 0,
      ratingCount: parseInt(reviewStats[0].dataValues.ratingCount) || 0
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(201).json(newReview);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating review:', error);
    return res.status(500).json({ message: 'Lỗi khi tạo đánh giá' });
  }
};

// Hàm lấy các đánh giá đã thực hiện bởi một bàn
exports.getReviewsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const reviews = await Review.findAll({
      where: {
        tableId,
        isVisible: true
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: MenuItem,
        attributes: ['id', 'name', 'image', 'category']
      }]
    });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error getting table reviews:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy đánh giá của bàn' });
  }
};

// Hàm lấy các đánh giá đã thực hiện cho một đơn hàng
exports.getReviewsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const reviews = await Review.findAll({
      where: {
        orderId,
        isVisible: true
      },
      include: [{
        model: MenuItem,
        attributes: ['id', 'name', 'image', 'category']
      }]
    });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error getting order reviews:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy đánh giá của đơn hàng' });
  }
};

// Hàm lấy các món ăn được đánh giá cao nhất
exports.getTopRatedItems = async (req, res) => {
  try {
    const { limit = 5, minRating = 4, minReviews = 3 } = req.query;
    
    const topItems = await MenuItem.findAll({
      where: {
        avgRating: { [Op.gte]: parseFloat(minRating) },
        ratingCount: { [Op.gte]: parseInt(minReviews) },
        isAvailable: true
      },
      order: [
        ['avgRating', 'DESC'],
        ['ratingCount', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    return res.status(200).json(topItems);
  } catch (error) {
    console.error('Error getting top rated items:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy món ăn được đánh giá cao' });
  }
}; 