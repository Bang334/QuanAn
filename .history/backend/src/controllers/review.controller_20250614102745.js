const { Review, MenuItem, Order, Table } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Hàm lấy tất cả đánh giá
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { 
        isVisible: true 
      },
      include: [
        {
          model: MenuItem,
          attributes: ['id', 'name', 'image', 'category', 'price']
        },
        {
          model: Order,
          attributes: ['id', 'tableId', 'totalAmount', 'status'],
        },
        {
          model: Table,
          attributes: ['id', 'name', 'capacity']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách đánh giá' });
  }
};

// Hàm đồng bộ lại số lượng đánh giá và điểm trung bình
exports.syncMenuItemRatings = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Lấy tất cả menu items có đánh giá
    const menuItemsWithReviews = await Review.findAll({
      attributes: [
        'menuItemId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ],
      where: {
        isVisible: true
      },
      group: ['menuItemId'],
      raw: true,
      transaction
    });
    
    // Cập nhật từng menu item
    for (const item of menuItemsWithReviews) {
      await MenuItem.update(
        {
          ratingCount: parseInt(item.reviewCount),
          avgRating: parseFloat(item.avgRating) || 0
        },
        {
          where: { id: item.menuItemId },
          transaction
        }
      );
    }
    
    // Reset các menu item không có đánh giá
    const menuItemIds = menuItemsWithReviews.map(item => item.menuItemId);
    await MenuItem.update(
      {
        ratingCount: 0,
        avgRating: 0
      },
      {
        where: {
          id: { [Op.notIn]: menuItemIds }
        },
        transaction
      }
    );
    
    await transaction.commit();
    return res.status(200).json({ 
      message: 'Đồng bộ đánh giá thành công',
      updatedItems: menuItemsWithReviews.length
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error syncing ratings:', error);
    return res.status(500).json({ message: 'Lỗi khi đồng bộ đánh giá' });
  }
};

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
  const transaction = await sequelize.transaction();
  
  try {
    const { rating, comment, menuItemId, tableId, orderId } = req.body;

    // Validate input
    if (!rating || !menuItemId) {
      return res.status(400).json({ message: 'Rating and menuItemId are required' });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if menuItem exists
    const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
    if (!menuItem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Kiểm tra xem người dùng đã mua món ăn này chưa
    if (tableId && orderId) {
      const order = await Order.findOne({
        where: {
          id: orderId,
          tableId: tableId,
          status: 'completed'
        },
        transaction
      });
      
      if (!order) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Bạn cần mua món ăn này trước khi đánh giá' });
      }
    }

    // Create review
    const newReview = await Review.create({
      rating,
      comment,
      menuItemId,
      tableId,
      orderId,
      reviewDate: new Date()
    }, { transaction });

    // Update menu item's average rating and rating count
    const reviewCount = await Review.count({
      where: { menuItemId, isVisible: true },
      transaction
    });
    
    const avgRatingResult = await Review.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ],
      where: { menuItemId, isVisible: true },
      raw: true,
      transaction
    });
    
    await menuItem.update({
      avgRating: avgRatingResult[0].avgRating || 0,
      ratingCount: reviewCount
    }, { transaction });

    await transaction.commit();
    res.status(201).json(newReview);
  } catch (error) {
    await transaction.rollback();
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

// Hàm lấy tất cả đánh giá cho một món ăn
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    const reviews = await Review.findAll({
      where: {
        menuItemId,
        isVisible: true
      },
      include: [
        {
          model: MenuItem,
          attributes: ['id', 'name', 'image', 'category']
        },
        {
          model: Order,
          attributes: ['id', 'status'],
        },
        {
          model: Table,
          attributes: ['id', 'name']
        }
      ],
      order: [['reviewDate', 'DESC']],
      limit: 50
    });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy đánh giá' });
  }
};

// Hàm xóa đánh giá
exports.deleteReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Find the review
    const review = await Review.findByPk(id, { transaction });
    
    if (!review) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const menuItemId = review.menuItemId;
    
    // Delete the review
    await review.destroy({ transaction });
    
    // Update menu item's average rating and rating count
    const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
    
    if (menuItem) {
      const reviewCount = await Review.count({
        where: { menuItemId, isVisible: true },
        transaction
      });
      
      if (reviewCount > 0) {
        const avgRatingResult = await Review.findAll({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
          ],
          where: { menuItemId, isVisible: true },
          raw: true,
          transaction
        });
        
        await menuItem.update({
          avgRating: avgRatingResult[0].avgRating || 0,
          ratingCount: reviewCount
        }, { transaction });
      } else {
        await menuItem.update({
          avgRating: 0,
          ratingCount: 0
        }, { transaction });
      }
    }
    
    await transaction.commit();
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
}; 