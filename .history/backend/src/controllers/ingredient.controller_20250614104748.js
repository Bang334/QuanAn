const { Ingredient, InventoryTransaction, User, IngredientPriceHistory, Supplier } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { checkAllMenuItemsAvailability } = require('../scripts/check-menu-availability');

// Get all ingredients
exports.getAllIngredients = async (req, res) => {
  try {
    console.log("Getting all ingredients");
    const ingredients = await Ingredient.findAll({
      order: [['name', 'ASC']]
    });
    
    console.log("Found ingredients:", ingredients.length);
    
    // Đảm bảo trả về dữ liệu đầy đủ
    const ingredientsData = ingredients.map(ingredient => {
      const item = ingredient.toJSON();
      console.log("Processing ingredient:", item.id, item.name);
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        unit: item.unit,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        costPerUnit: item.costPerUnit,
        category: item.category,
        expiryDate: item.expiryDate,
        location: item.location,
        isActive: item.isActive,
        image: item.image,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });
    
    console.log("Returning ingredients data");
    res.status(200).json(ingredientsData);
  } catch (error) {
    console.error('Error getting ingredients:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nguyên liệu' });
  }
};

// Get ingredients with low stock
exports.getLowStockIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      where: {
        [Op.and]: [
          { isActive: true },
          sequelize.literal('currentStock <= minStockLevel')
        ]
      },
      order: [['currentStock', 'ASC']]
    });
    
    res.status(200).json(ingredients);
  } catch (error) {
    console.error('Error getting low stock ingredients:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nguyên liệu sắp hết' });
  }
};

// Get ingredient by ID
exports.getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }
    
    res.status(200).json(ingredient);
  } catch (error) {
    console.error('Error getting ingredient:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin nguyên liệu' });
  }
};

// Create new ingredient
exports.createIngredient = async (req, res) => {
  try {
    const { 
      name, description, unit, quantity, minQuantity, 
      price, category, expiryDate, location, image 
    } = req.body;
    
    // Validate required fields
    if (!name || !unit) {
      return res.status(400).json({ message: 'Tên và đơn vị tính là bắt buộc' });
    }
    
    // Create ingredient
    const ingredient = await Ingredient.create({
      name,
      description,
      unit,
      currentStock: quantity || 0,
      minStockLevel: minQuantity || 10,
      costPerUnit: price || 0,
      category,
      expiryDate,
      location,
      image,
      isActive: true
    });
    
    // Create inventory transaction for initial stock
    if (quantity && quantity > 0) {
      await InventoryTransaction.create({
        ingredientId: ingredient.id,
        quantity,
        type: 'adjustment',
        previousQuantity: 0,
        newQuantity: quantity,
        unitPrice: price || 0,
        notes: 'Khởi tạo số lượng ban đầu',
        userId: req.user.id,
        transactionDate: new Date()
      });
    }
    
    res.status(201).json(ingredient);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ message: 'Lỗi khi tạo nguyên liệu mới' });
  }
};

// Update ingredient
exports.updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, currentQuantity, alertThreshold, unitPrice, supplierId, isActive } = req.body;
    
    // Tìm nguyên liệu hiện tại
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    
    // Lưu giá cũ trước khi cập nhật
    const oldPrice = ingredient.costPerUnit;
    
    // Cập nhật thông tin nguyên liệu
    await ingredient.update({
      name,
      description,
      unit,
      currentStock: currentQuantity,
      minStockLevel: alertThreshold,
      costPerUnit: unitPrice,
      supplierId,
      isActive
    });
    
    // Nếu giá thay đổi, lưu vào lịch sử giá
    if (oldPrice !== unitPrice && (oldPrice !== null || unitPrice !== null)) {
      // Đảm bảo unitPrice không null
      const newPrice = unitPrice !== null && unitPrice !== undefined ? unitPrice : oldPrice || 0;
      const safeOldPrice = oldPrice || 0;
      
      // Chỉ tạo bản ghi lịch sử nếu giá thực sự thay đổi
      if (parseFloat(newPrice) !== parseFloat(safeOldPrice)) {
        await IngredientPriceHistory.create({
          ingredientId: id,
          oldPrice: safeOldPrice, // Đảm bảo oldPrice không null
          newPrice: newPrice,
          changeDate: new Date(),
          changeReason: req.body.priceChangeReason || 'Cập nhật thông tin nguyên liệu',
          changedBy: req.user.id
        });
        
        // Thông báo thay đổi giá qua socket.io
        req.app.get('io')?.emit('inventoryUpdate', {
          type: 'price_change',
          ingredientId: id,
          ingredientName: name,
          oldPrice: safeOldPrice,
          newPrice: newPrice
        });
      }
    }
    
    res.status(200).json({
      message: 'Ingredient updated successfully',
      ingredient
    });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ message: 'Error updating ingredient', error: error.message });
  }
};

// Adjust ingredient quantity
exports.adjustQuantity = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    
    // Kiểm tra nguyên liệu tồn tại
    const ingredient = await Ingredient.findByPk(id);
    if (!ingredient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    
    // Kiểm tra số lượng hợp lệ
    if (!quantity) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Quantity is required' });
    }
    
    // Tính toán số lượng mới
    const previousQuantity = parseFloat(ingredient.currentStock);
    const newQuantity = previousQuantity + parseFloat(quantity);
    
    // Không cho phép số lượng âm
    if (newQuantity < 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Resulting quantity cannot be negative' });
    }
    
    // Cập nhật số lượng nguyên liệu
    await ingredient.update({ currentStock: newQuantity }, { transaction });
    
    // Tạo giao dịch kho
    const transactionType = quantity > 0 ? 'adjustment_in' : 'adjustment_out';
    await InventoryTransaction.create({
      ingredientId: id,
      quantity: Math.abs(quantity),
      type: transactionType,
      previousQuantity,
      newQuantity,
      notes: reason || `Manual adjustment by ${req.user.name}`,
      userId: req.user.id,
      transactionDate: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    // Kiểm tra ngưỡng cảnh báo
    if (newQuantity < parseFloat(ingredient.minStockLevel)) {
      // Gửi thông báo qua socket.io nếu có
      req.app.get('io')?.emit('lowStockAlert', {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        currentQuantity: newQuantity,
        alertThreshold: ingredient.minStockLevel
      });
    }
    
    // Trigger menu item availability check after ingredient quantity changes
    try {
      // Run asynchronously to avoid blocking the response
      setTimeout(async () => {
        console.log(`Checking menu item availability after ingredient ${ingredient.name} quantity change...`);
        await checkAllMenuItemsAvailability();
      }, 0);
    } catch (checkError) {
      console.error('Error checking menu availability after quantity adjustment:', checkError);
      // Don't block the response if this fails
    }
    
    res.status(200).json({
      message: 'Ingredient quantity adjusted successfully',
      ingredient: {
        ...ingredient.toJSON(),
        currentStock: newQuantity
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adjusting ingredient quantity:', error);
    res.status(500).json({ message: 'Error adjusting ingredient quantity', error: error.message });
  }
};

// Get ingredient transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const whereClause = { ingredientId: id };
    
    if (startDate && endDate) {
      whereClause.transactionDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.transactionDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.transactionDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const transactions = await InventoryTransaction.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['transactionDate', 'DESC']]
    });
    
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error getting ingredient transaction history:', error);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử giao dịch nguyên liệu' });
  }
};

// Delete ingredient (soft delete)
exports.deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }
    
    // Soft delete by setting isActive to false
    await ingredient.update({ isActive: false });
    
    res.status(200).json({ message: 'Đã xóa nguyên liệu thành công' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ message: 'Lỗi khi xóa nguyên liệu' });
  }
};

// Thêm hàm mới để lấy lịch sử giá của nguyên liệu
exports.getPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const whereClause = { ingredientId: id };
    
    if (startDate) {
      whereClause.changeDate = { ...whereClause.changeDate, [Op.gte]: new Date(startDate) };
    }
    
    if (endDate) {
      whereClause.changeDate = { ...whereClause.changeDate, [Op.lte]: new Date(endDate) };
    }
    
    const priceHistory = await IngredientPriceHistory.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'priceChanger',
          attributes: ['id', 'username', 'fullName']
        }
      ],
      order: [['changeDate', 'DESC']]
    });
    
    res.status(200).json(priceHistory);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ message: 'Error fetching price history', error: error.message });
  }
}; 