const { Promotion, OrderPromotion, Order } = require('../models');
const { Op } = require('sequelize');

// Create a new promotion
exports.createPromotion = async (req, res) => {
  const {
    name, description, discountType, discountValue,
    startDate, endDate, isActive, minimumOrderAmount,
    maximumDiscountAmount, applicableCategories,
    usageLimit, promotionCode
  } = req.body;
  
  try {
    // Validate required fields
    if (!name || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ message: 'Các trường tên, loại giảm giá, giá trị giảm giá, ngày bắt đầu và ngày kết thúc là bắt buộc' });
    }
    
    // Validate discount type
    if (!['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ. Sử dụng percent hoặc fixed' });
    }
    
    // Validate discount value
    if (discountType === 'percent' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Giá trị phần trăm giảm giá phải nằm trong khoảng 0-100' });
    }
    
    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({ message: 'Giá trị giảm giá cố định phải lớn hơn 0' });
    }
    
    // Create the promotion
    const promotion = await Promotion.create({
      name,
      description,
      discountType,
      discountValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
      minimumOrderAmount: minimumOrderAmount || 0,
      maximumDiscountAmount: maximumDiscountAmount || null,
      applicableCategories,
      usageLimit,
      usageCount: 0,
      promotionCode
    });
    
    return res.status(201).json({
      message: 'Tạo khuyến mãi thành công',
      promotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return res.status(500).json({ message: 'Lỗi khi tạo khuyến mãi', error: error.message });
  }
};

// Get all promotions with filtering
exports.getAllPromotions = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    console.log('Promotion filters received:', { isActive, search });
    
    const whereConditions = {};
    
    // Filter by active status
    if (isActive !== undefined && isActive !== '') {
      whereConditions.isActive = isActive === 'true';
      console.log('Filtering by isActive:', whereConditions.isActive);
    }
    
    // Search by name or code
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { promotionCode: { [Op.like]: `%${search}%` } }
      ];
      console.log('Searching for:', search);
    }
    
    console.log('Final where conditions:', whereConditions);
    
    // Get promotions
    const promotions = await Promotion.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${promotions.length} promotions`);
    
    return res.status(200).json(promotions);
  } catch (error) {
    console.error('Error getting promotions:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi', error: error.message });
  }
};

// Get active promotions
exports.getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    
    // Get active promotions
    const promotions = await Promotion.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(promotions);
  } catch (error) {
    console.error('Error getting active promotions:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi đang hoạt động', error: error.message });
  }
};

// Get promotion by ID
exports.getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const promotion = await Promotion.findByPk(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }
    
    return res.status(200).json(promotion);
  } catch (error) {
    console.error('Error getting promotion:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin khuyến mãi', error: error.message });
  }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, discountType, discountValue,
      startDate, endDate, isActive, minimumOrderAmount,
      maximumDiscountAmount, applicableCategories,
      usageLimit, promotionCode
    } = req.body;
    
    const promotion = await Promotion.findByPk(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }
    
    // Update promotion
    await promotion.update({
      name: name || promotion.name,
      description: description !== undefined ? description : promotion.description,
      discountType: discountType || promotion.discountType,
      discountValue: discountValue || promotion.discountValue,
      startDate: startDate ? new Date(startDate) : promotion.startDate,
      endDate: endDate ? new Date(endDate) : promotion.endDate,
      isActive: isActive !== undefined ? isActive : promotion.isActive,
      minimumOrderAmount: minimumOrderAmount !== undefined ? minimumOrderAmount : promotion.minimumOrderAmount,
      maximumDiscountAmount: maximumDiscountAmount !== undefined ? maximumDiscountAmount : promotion.maximumDiscountAmount,
      applicableCategories: applicableCategories !== undefined ? applicableCategories : promotion.applicableCategories,
      usageLimit: usageLimit !== undefined ? usageLimit : promotion.usageLimit,
      promotionCode: promotionCode !== undefined ? promotionCode : promotion.promotionCode
    });
    
    return res.status(200).json({
      message: 'Cập nhật khuyến mãi thành công',
      promotion
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return res.status(500).json({ message: 'Lỗi khi cập nhật khuyến mãi', error: error.message });
  }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const promotion = await Promotion.findByPk(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }
    
    // Check if promotion is used in any order
    const usedInOrders = await OrderPromotion.findOne({
      where: { promotionId: id }
    });
    
    if (usedInOrders) {
      // Instead of deleting, just deactivate
      await promotion.update({ isActive: false });
      return res.status(200).json({
        message: 'Khuyến mãi đã được sử dụng trong đơn hàng, nên đã bị vô hiệu hóa thay vì xóa',
        promotion
      });
    }
    
    // Delete promotion if not used
    await promotion.destroy();
    
    return res.status(200).json({
      message: 'Xóa khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi', error: error.message });
  }
};

// Apply promotion to order
exports.applyPromotionToOrder = async (req, res) => {
  try {
    const { orderId, promotionId } = req.body;
    
    // Check if order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Check if promotion exists and is active
    const promotion = await Promotion.findByPk(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }
    
    const now = new Date();
    if (!promotion.isActive || promotion.startDate > now || promotion.endDate < now) {
      return res.status(400).json({ message: 'Khuyến mãi không hoạt động hoặc đã hết hạn' });
    }
    
    // Check if promotion is already applied to this order
    const existingPromotion = await OrderPromotion.findOne({
      where: { orderId, promotionId }
    });
    
    if (existingPromotion) {
      return res.status(400).json({ message: 'Khuyến mãi này đã được áp dụng cho đơn hàng' });
    }
    
    // Check usage limit
    if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({ message: 'Khuyến mãi đã đạt giới hạn sử dụng' });
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (promotion.discountType === 'percent') {
      discountAmount = (order.totalAmount * promotion.discountValue) / 100;
      
      // Apply maximum discount if set
      if (promotion.maximumDiscountAmount !== null && discountAmount > promotion.maximumDiscountAmount) {
        discountAmount = promotion.maximumDiscountAmount;
      }
    } else {
      discountAmount = promotion.discountValue;
    }
    
    // Apply promotion
    const orderPromotion = await OrderPromotion.create({
      orderId,
      promotionId,
      discountAmount
    });
    
    // Update promotion usage count
    await promotion.update({
      usageCount: promotion.usageCount + 1
    });
    
    // Update order total (if needed)
    const newTotal = Math.max(0, order.totalAmount - discountAmount);
    await order.update({ totalAmount: newTotal });
    
    return res.status(201).json({
      message: 'Áp dụng khuyến mãi thành công',
      orderPromotion,
      discountAmount,
      newTotal
    });
  } catch (error) {
    console.error('Error applying promotion:', error);
    return res.status(500).json({ message: 'Lỗi khi áp dụng khuyến mãi', error: error.message });
  }
};

// Get promotions by order
exports.getPromotionsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check if order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Get promotions applied to this order
    const orderPromotions = await OrderPromotion.findAll({
      where: { orderId },
      include: [Promotion]
    });
    
    return res.status(200).json(orderPromotions);
  } catch (error) {
    console.error('Error getting order promotions:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi của đơn hàng', error: error.message });
  }
};

// Remove promotion from order
exports.removePromotionFromOrder = async (req, res) => {
  try {
    const { orderId, promotionId } = req.params;
    
    // Check if order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Check if promotion is applied to this order
    const orderPromotion = await OrderPromotion.findOne({
      where: { orderId, promotionId }
    });
    
    if (!orderPromotion) {
      return res.status(404).json({ message: 'Khuyến mãi không được áp dụng cho đơn hàng này' });
    }
    
    // Get promotion to decrement usage count
    const promotion = await Promotion.findByPk(promotionId);
    
    // Update order total (if needed)
    const newTotal = order.totalAmount + orderPromotion.discountAmount;
    await order.update({ totalAmount: newTotal });
    
    // Remove promotion
    await orderPromotion.destroy();
    
    // Update promotion usage count
    if (promotion) {
      await promotion.update({
        usageCount: Math.max(0, promotion.usageCount - 1)
      });
    }
    
    return res.status(200).json({
      message: 'Đã xóa khuyến mãi khỏi đơn hàng',
      newTotal
    });
  } catch (error) {
    console.error('Error removing promotion from order:', error);
    return res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi khỏi đơn hàng', error: error.message });
  }
};

// Validate promotion code
exports.validatePromotionCode = async (req, res) => {
  try {
    const { code, orderId } = req.body;
    
    if (!code || !orderId) {
      return res.status(400).json({ message: 'Mã khuyến mãi và ID đơn hàng là bắt buộc' });
    }
    
    // Check if order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Find promotion by code
    const now = new Date();
    const promotion = await Promotion.findOne({
      where: {
        promotionCode: code,
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      }
    });
    
    if (!promotion) {
      return res.status(404).json({ message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' });
    }
    
    // Check if minimum order amount is met
    if (promotion.minimumOrderAmount > 0 && order.totalAmount < promotion.minimumOrderAmount) {
      return res.status(400).json({ 
        message: `Đơn hàng cần tối thiểu ${promotion.minimumOrderAmount.toLocaleString('vi-VN')}₫ để áp dụng mã này`,
        minimumOrderAmount: promotion.minimumOrderAmount
      });
    }
    
    // Check if promotion is already applied to this order
    const existingPromotion = await OrderPromotion.findOne({
      where: { orderId, promotionId: promotion.id }
    });
    
    if (existingPromotion) {
      return res.status(400).json({ message: 'Mã khuyến mãi này đã được áp dụng cho đơn hàng' });
    }
    
    // Check usage limit
    if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({ message: 'Mã khuyến mãi đã đạt giới hạn sử dụng' });
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (promotion.discountType === 'percent') {
      discountAmount = (order.totalAmount * promotion.discountValue) / 100;
      
      // Apply maximum discount if set
      if (promotion.maximumDiscountAmount !== null && discountAmount > promotion.maximumDiscountAmount) {
        discountAmount = promotion.maximumDiscountAmount;
      }
    } else {
      discountAmount = promotion.discountValue;
    }
    
    // Calculate new total
    const newTotal = Math.max(0, order.totalAmount - discountAmount);
    
    return res.status(200).json({
      message: 'Mã khuyến mãi hợp lệ',
      promotion: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue
      },
      discountAmount,
      originalTotal: order.totalAmount,
      newTotal
    });
  } catch (error) {
    console.error('Error validating promotion code:', error);
    return res.status(500).json({ message: 'Lỗi khi kiểm tra mã khuyến mãi', error: error.message });
  }
};