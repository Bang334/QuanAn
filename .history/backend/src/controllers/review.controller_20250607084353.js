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
    
    // Validate menu item exists
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Get review stats
    const reviewCount = await Review.count({
      where: {
        menuItemId,
        isVisible: true
      }
    });

    // If no reviews, return empty summary
    if (reviewCount === 0) {
      return res.status(200).json({
        avgRating: 0,
        reviewCount: 0,
        ratingDistribution: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        }
      });
    }

    // Get average rating
    const avgRatingResult = await Review.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ],
      where: {
        menuItemId,
        isVisible: true
      },
      raw: true
    });

    // Get rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const count = await Review.count({
        where: {
          menuItemId,
          rating: i,
          isVisible: true
        }
      });
      ratingDistribution[i] = count;
    }

    res.status(200).json({
      avgRating: avgRatingResult[0].avgRating || 0,
      reviewCount,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error getting review summary:', error);
    res.status(500).json({ message: 'Failed to get review summary', error: error.message });
  }
};

// Hàm thêm đánh giá mới
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, menuItemId } = req.body;

    // Validate input
    if (!rating || !menuItemId) {
      return res.status(400).json({ message: 'Rating and menuItemId are required' });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if menuItem exists
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Create review
    const newReview = await Review.create({
      rating,
      comment,
      menuItemId,
      reviewDate: new Date()
    });

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to create review', error: error.message });
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

// Get reviews for a menu item
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    // Validate menu item exists
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Get reviews
    const reviews = await Review.findAll({
      where: { 
        menuItemId,
        isVisible: true
      },
      order: [['reviewDate', 'DESC']]
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
}; 