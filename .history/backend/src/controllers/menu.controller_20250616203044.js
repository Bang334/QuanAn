const { MenuItem, Review } = require('../models');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// Lấy tất cả các món ăn
exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']],
      attributes: {
        include: ['avgRating', 'ratingCount', 'isPopular']
      }
    });
    
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy món ăn theo ID
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByPk(req.params.id, {
      attributes: {
        include: ['avgRating', 'ratingCount', 'isPopular', 'ingredients', 'nutritionInfo', 'preparationTime']
      }
    });
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Lấy 5 đánh giá gần nhất
    const recentReviews = await Review.findAll({
      where: {
        menuItemId: req.params.id,
        isVisible: true
      },
      order: [['reviewDate', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      ...menuItem.toJSON(),
      recentReviews
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Tạo món ăn mới
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable = true, ingredients, nutritionInfo, preparationTime, isPopular, image } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }
    
    const newMenuItem = await MenuItem.create({
      name,
      description,
      price,
      image,
      category,
      isAvailable,
      ingredients,
      nutritionInfo,
      preparationTime,
      isPopular: isPopular || false,
      avgRating: 0,
      ratingCount: 0
    });
    
    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cập nhật món ăn
exports.updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, ingredients, nutritionInfo, preparationTime, isPopular, image } = req.body;
    
    const menuItem = await MenuItem.findByPk(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    await menuItem.update({
      name: name || menuItem.name,
      description: description !== undefined ? description : menuItem.description,
      price: price || menuItem.price,
      image: image !== undefined ? image : menuItem.image,
      category: category || menuItem.category,
      isAvailable: isAvailable !== undefined ? isAvailable : menuItem.isAvailable,
      ingredients: ingredients !== undefined ? ingredients : menuItem.ingredients,
      nutritionInfo: nutritionInfo !== undefined ? nutritionInfo : menuItem.nutritionInfo,
      preparationTime: preparationTime !== undefined ? preparationTime : menuItem.preparationTime,
      isPopular: isPopular !== undefined ? isPopular : menuItem.isPopular
    });
    
    res.status(200).json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa món ăn
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByPk(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    await menuItem.destroy();
    
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy món ăn theo danh mục
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const menuItems = await MenuItem.findAll({
      where: {
        category
      },
      order: [['name', 'ASC']],
      attributes: {
        include: ['avgRating', 'ratingCount', 'isPopular']
      }
    });
    
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy các món ăn phổ biến
exports.getPopularItems = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const menuItems = await MenuItem.findAll({
      where: {
        isPopular: true,
        isAvailable: true
      },
      order: [
        ['avgRating', 'DESC'],
        ['ratingCount', 'DESC']
      ],
      limit: parseInt(limit),
      attributes: {
        include: ['avgRating', 'ratingCount', 'isPopular']
      }
    });
    
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching popular menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 