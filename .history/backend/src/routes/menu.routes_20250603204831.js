const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/menu');
  },
  filename: (req, file, cb) => {
    cb(null, `menu-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all menu items - Public route
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu items by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const menuItems = await MenuItem.findAll({
      where: { category },
      order: [['name', 'ASC']]
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single menu item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItem.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new menu item - Admin only
router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, isAvailable } = req.body;
    
    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      isAvailable: isAvailable === 'true',
      image: req.file ? `/uploads/menu/${req.file.filename}` : null
    });
    
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a menu item - Admin only
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, isAvailable } = req.body;
    
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    const updateData = {
      name,
      description,
      price,
      category,
      isAvailable: isAvailable === 'true'
    };
    
    if (req.file) {
      updateData.image = `/uploads/menu/${req.file.filename}`;
    }
    
    await menuItem.update(updateData);
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a menu item - Admin only
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    await menuItem.destroy();
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 