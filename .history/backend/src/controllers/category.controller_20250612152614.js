const { Ingredient } = require('../models');
const { sequelize } = require('../config/database');

// Lấy tất cả các danh mục từ bảng ingredients
exports.getAllCategories = async (req, res) => {
  try {
    const categoriesData = await Ingredient.findAll({
      attributes: [
        [sequelize.literal('DISTINCT category'), 'category']
      ],
      where: {
        category: {
          [sequelize.Op.not]: null,
          [sequelize.Op.ne]: ''
        }
      },
      raw: true
    });

    // Chuyển đổi thành định dạng id và name
    const categories = categoriesData.map((item, index) => ({
      id: index + 1,
      name: item.category,
      description: `Danh mục ${item.category}`
    }));
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục' });
  }
}; 