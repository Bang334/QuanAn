const { 
  MenuItem, 
  Ingredient, 
  RecipeIngredient, 
  IngredientUsage,
  InventoryTransaction,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// Lấy tất cả công thức
exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await MenuItem.findAll({
      include: [
        {
          model: RecipeIngredient,
          include: [
            {
              model: Ingredient,
              attributes: ['id', 'name', 'unit', 'currentStock', 'minStockLevel', 'costPerUnit']
            }
          ]
        }
      ]
    });
    
    res.status(200).json(recipes);
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({ message: 'Error getting recipes', error: error.message });
  }
};

// Lấy công thức theo ID món ăn
exports.getRecipeByMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    const recipe = await MenuItem.findByPk(menuItemId, {
      include: [
        {
          model: RecipeIngredient,
          include: [
            {
              model: Ingredient,
              attributes: ['id', 'name', 'unit', 'currentStock', 'minStockLevel', 'costPerUnit']
            }
          ]
        }
      ]
    });
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.status(200).json(recipe);
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ message: 'Error getting recipe', error: error.message });
  }
};

// Tạo hoặc cập nhật công thức cho món ăn
exports.createOrUpdateRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { menuItemId } = req.params;
    const { ingredients } = req.body;
    
    // Kiểm tra món ăn tồn tại
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Xóa công thức cũ nếu có
    await RecipeIngredient.destroy({
      where: { menuItemId },
      transaction
    });
    
    // Tạo công thức mới
    const recipeIngredients = [];
    for (const item of ingredients) {
      // Kiểm tra nguyên liệu tồn tại
      const ingredient = await Ingredient.findByPk(item.ingredientId);
      if (!ingredient) {
        await transaction.rollback();
        return res.status(404).json({ message: `Ingredient with ID ${item.ingredientId} not found` });
      }
      
      // Tạo công thức cho nguyên liệu
      const recipeIngredient = await RecipeIngredient.create({
        menuItemId,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: ingredient.unit,
        notes: item.notes || null
      }, { transaction });
      
      recipeIngredients.push(recipeIngredient);
    }
    
    await transaction.commit();
    
    // Lấy công thức đã cập nhật
    const updatedRecipe = await MenuItem.findByPk(menuItemId, {
      include: [
        {
          model: RecipeIngredient,
          include: [
            {
              model: Ingredient,
              attributes: ['id', 'name', 'unit', 'currentStock', 'minStockLevel', 'costPerUnit']
            }
          ]
        }
      ]
    });
    
    res.status(200).json({
      message: 'Recipe updated successfully',
      recipe: updatedRecipe
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating recipe:', error);
    res.status(500).json({ message: 'Error updating recipe', error: error.message });
  }
};

// Xóa công thức
exports.deleteRecipe = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    // Kiểm tra món ăn tồn tại
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Xóa công thức
    const deletedCount = await RecipeIngredient.destroy({
      where: { menuItemId }
    });
    
    res.status(200).json({
      message: 'Recipe deleted successfully',
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Error deleting recipe', error: error.message });
  }
};

// Tính toán nguyên liệu cần thiết cho một đơn hàng
exports.calculateIngredientsForOrder = async (req, res) => {
  try {
    const { orderItems } = req.body;
    
    if (!orderItems || !Array.isArray(orderItems)) {
      return res.status(400).json({ message: 'Order items are required and must be an array' });
    }
    
    const ingredientNeeds = [];
    const missingIngredients = [];
    
    for (const item of orderItems) {
      const { menuItemId, quantity } = item;
      
      // Lấy công thức cho món ăn
      const recipeIngredients = await RecipeIngredient.findAll({
        where: { menuItemId },
        include: [
          {
            model: Ingredient,
            attributes: ['id', 'name', 'unit', 'currentStock', 'minStockLevel']
          }
        ]
      });
      
      if (recipeIngredients.length === 0) {
        return res.status(404).json({ message: `No recipe found for menu item ID ${menuItemId}` });
      }
      
      // Tính toán số lượng nguyên liệu cần thiết
      for (const recipe of recipeIngredients) {
        const requiredQuantity = recipe.quantity * quantity;
        const availableQuantity = recipe.Ingredient.currentStock;
        
        // Kiểm tra tồn kho
        if (availableQuantity < requiredQuantity) {
          missingIngredients.push({
            ingredientId: recipe.ingredientId,
            name: recipe.Ingredient.name,
            required: requiredQuantity,
            available: availableQuantity,
            missing: requiredQuantity - availableQuantity,
            unit: recipe.Ingredient.unit
          });
        }
        
        // Thêm vào danh sách cần sử dụng
        const existingIngredient = ingredientNeeds.find(i => i.ingredientId === recipe.ingredientId);
        if (existingIngredient) {
          existingIngredient.quantity += requiredQuantity;
        } else {
          ingredientNeeds.push({
            ingredientId: recipe.ingredientId,
            name: recipe.Ingredient.name,
            quantity: requiredQuantity,
            unit: recipe.Ingredient.unit
          });
        }
      }
    }
    
    res.status(200).json({
      ingredientNeeds,
      missingIngredients,
      canFulfill: missingIngredients.length === 0
    });
  } catch (error) {
    console.error('Error calculating ingredients for order:', error);
    res.status(500).json({ message: 'Error calculating ingredients', error: error.message });
  }
};

// Xử lý sử dụng nguyên liệu khi hoàn thành đơn hàng
exports.processIngredientUsage = async (req, res) => {
  try {
    const { orderId, orderItems } = req.body;
    
    if (!orderId || !orderItems || !Array.isArray(orderItems)) {
      return res.status(400).json({ message: 'Order ID and order items are required' });
    }
    
    // Sử dụng stored procedure để xử lý sử dụng nguyên liệu
    const dbProcedures = require('../scripts/database/execute_procedures');
    
    const results = [];
    
    for (const item of orderItems) {
      const { orderItemId, menuItemId, quantity } = item;
      
      // Gọi stored procedure cho từng món ăn
      const result = await dbProcedures.processIngredientUsage({
        orderId,
        orderItemId,
        menuItemId,
        quantity,
        userId: req.user.id
      });
      
      results.push(result);
    }
    
    res.status(200).json({
      message: 'Ingredient usage processed successfully',
      results
    });
  } catch (error) {
    console.error('Error processing ingredient usage:', error);
    res.status(500).json({ message: 'Error processing ingredient usage', error: error.message });
  }
};

// Lấy thống kê sử dụng nguyên liệu theo món ăn
exports.getIngredientUsageByMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { startDate, endDate } = req.query;
    
    const whereClause = { menuItemId };
    
    if (startDate) {
      whereClause.usageDate = { ...whereClause.usageDate, [Op.gte]: new Date(startDate) };
    }
    
    if (endDate) {
      whereClause.usageDate = { ...whereClause.usageDate, [Op.lte]: new Date(endDate) };
    }
    
    const usageStats = await IngredientUsage.findAll({
      attributes: [
        'ingredientId',
        [sequelize.fn('sum', sequelize.col('quantity')), 'totalUsage']
      ],
      where: whereClause,
      include: [
        {
          model: Ingredient,
          attributes: ['name', 'unit', 'costPerUnit']
        }
      ],
      group: ['ingredientId', 'Ingredient.id', 'Ingredient.name', 'Ingredient.unit', 'Ingredient.costPerUnit'],
      order: [[sequelize.fn('sum', sequelize.col('quantity')), 'DESC']]
    });
    
    // Lấy thông tin món ăn
    const menuItem = await MenuItem.findByPk(menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Tính tổng chi phí
    let totalCost = 0;
    const usageWithCost = usageStats.map(usage => {
      const cost = parseFloat(usage.get('totalUsage')) * parseFloat(usage.Ingredient.costPerUnit);
      totalCost += cost;
      return {
        ...usage.toJSON(),
        cost
      };
    });
    
    res.status(200).json({
      menuItem,
      usageStats: usageWithCost,
      totalCost
    });
  } catch (error) {
    console.error('Error getting ingredient usage by menu item:', error);
    res.status(500).json({ message: 'Error getting ingredient usage by menu item', error: error.message });
  }
};

// Kiểm tra và cập nhật trạng thái sẵn có của món ăn dựa trên nguyên liệu
exports.checkAndUpdateMenuItemAvailability = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    const result = await checkMenuItemIngredientAvailability(menuItemId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking menu item availability:', error);
    res.status(500).json({ message: 'Error checking menu item availability', error: error.message });
  }
};

// Kiểm tra và cập nhật trạng thái của tất cả các món ăn
exports.checkAllMenuItemsAvailability = async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll();
    const results = [];
    
    for (const menuItem of menuItems) {
      const result = await checkMenuItemIngredientAvailability(menuItem.id);
      results.push(result);
    }
    
    res.status(200).json({
      message: 'All menu items availability checked and updated',
      results
    });
  } catch (error) {
    console.error('Error checking all menu items availability:', error);
    res.status(500).json({ message: 'Error checking all menu items availability', error: error.message });
  }
};

// Hàm kiểm tra nguyên liệu cho một món ăn và cập nhật trạng thái
async function checkMenuItemIngredientAvailability(menuItemId) {
  // Lấy thông tin món ăn
  const menuItem = await MenuItem.findByPk(menuItemId);
  
  if (!menuItem) {
    return { 
      success: false, 
      message: 'Menu item not found',
      menuItemId
    };
  }
  
  // Lấy công thức cho món ăn
  const recipeIngredients = await RecipeIngredient.findAll({
    where: { menuItemId },
    include: [
      {
        model: Ingredient,
        attributes: ['id', 'name', 'unit', 'currentStock', 'minStockLevel']
      }
    ]
  });
  
  // Nếu không có công thức, giữ nguyên trạng thái
  if (recipeIngredients.length === 0) {
    return { 
      success: true, 
      message: 'No recipe found for this menu item, availability status unchanged',
      menuItemId,
      menuItemName: menuItem.name,
      isAvailable: menuItem.isAvailable,
      hasRecipe: false
    };
  }
  
  // Kiểm tra từng nguyên liệu trong công thức
  const missingIngredients = [];
  
  for (const recipe of recipeIngredients) {
    const requiredQuantity = recipe.quantity;
    const availableQuantity = recipe.Ingredient.currentStock;
    
    // Nếu nguyên liệu không đủ, thêm vào danh sách thiếu
    if (availableQuantity < requiredQuantity) {
      missingIngredients.push({
        ingredientId: recipe.ingredientId,
        name: recipe.Ingredient.name,
        required: requiredQuantity,
        available: availableQuantity,
        missing: requiredQuantity - availableQuantity,
        unit: recipe.Ingredient.unit
      });
    }
  }
  
  // Cập nhật trạng thái món ăn
  const hasAllIngredients = missingIngredients.length === 0;
  const previousStatus = menuItem.isAvailable;
  
  // Chỉ cập nhật nếu trạng thái thay đổi
  if (previousStatus !== hasAllIngredients) {
    await menuItem.update({ isAvailable: hasAllIngredients });
  }
  
  return {
    success: true,
    menuItemId,
    menuItemName: menuItem.name,
    previousStatus,
    currentStatus: hasAllIngredients,
    statusChanged: previousStatus !== hasAllIngredients,
    hasAllIngredients,
    missingIngredients,
    message: hasAllIngredients 
      ? 'Menu item has all required ingredients and is available' 
      : 'Menu item is missing ingredients and has been marked as unavailable'
  };
}

// Export the function for use in scripts
module.exports.checkMenuItemIngredientAvailability = checkMenuItemIngredientAvailability;
