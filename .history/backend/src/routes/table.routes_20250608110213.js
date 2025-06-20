const express = require('express');
const router = express.Router();
const { Table } = require('../models');
const { authenticateToken, isAdmin, isWaiter } = require('../middlewares/auth');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/qrcodes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Get all tables
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tables = await Table.findAll({
      order: [['name', 'ASC']]
    });
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single table
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByPk(id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new table - Admin only
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, capacity } = req.body;
    
    const table = await Table.create({
      name,
      capacity: capacity || 4,
      status: 'available'
    });
    
    // Generate QR code for the table
    const tableUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu?tableId=${table.id}`;
    const qrCodeFileName = `table-${table.id}-${Date.now()}.png`;
    const qrCodePath = path.join(uploadDir, qrCodeFileName);
    
    await QRCode.toFile(qrCodePath, tableUrl);
    
    // Update table with QR code path
    await table.update({
      qrCode: `/uploads/qrcodes/${qrCodeFileName}`
    });
    
    res.status(201).json(table);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a table - Admin/Waiter
router.put('/:id', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, status } = req.body;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Only admin can update name and capacity
    if ((name || capacity) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update table name and capacity' });
    }
    
    // Prevent admin from editing tables that are in use
    if (req.user.role === 'admin' && table.status === 'occupied' && (name || capacity)) {
      return res.status(403).json({ message: 'Cannot edit a table that is currently in use' });
    }
    
    // Waiters can still change table status (e.g., marking as available when customers leave)
    const updateData = {};
    if (name) updateData.name = name;
    if (capacity) updateData.capacity = capacity;
    if (status) updateData.status = status;
    
    await table.update(updateData);
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update table status - Admin/Waiter
router.put('/:id/status', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Kiểm tra nếu đang chuyển từ occupied sang available
    if (table.status === 'occupied' && status === 'available') {
      // Kiểm tra tất cả đơn hàng của bàn này
      const { Order } = require('../models');
      const activeOrders = await Order.findAll({
        where: {
          tableId: id,
          status: {
            [require('sequelize').Op.notIn]: ['completed', 'cancelled']
          }
        }
      });
      
      if (activeOrders.length > 0) {
        return res.status(400).json({ 
          message: 'Không thể chuyển trạng thái bàn. Tất cả đơn hàng phải được hoàn thành trước.',
          activeOrders: activeOrders.length
        });
      }
    }
    
    await table.update({ status });
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a table - Admin only
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Prevent deleting tables that are in use
    if (table.status === 'occupied') {
      return res.status(403).json({ message: 'Cannot delete a table that is currently in use' });
    }
    
    await table.destroy();
    
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Regenerate QR code for a table - Admin only
router.post('/:id/qrcode', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Generate new QR code
    const tableUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu?tableId=${table.id}`;
    const qrCodeFileName = `table-${table.id}-${Date.now()}.png`;
    const qrCodePath = path.join(uploadDir, qrCodeFileName);
    
    await QRCode.toFile(qrCodePath, tableUrl);
    
    // Update table with new QR code path
    await table.update({
      qrCode: `/uploads/qrcodes/${qrCodeFileName}`
    });
    
    res.json(table);
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update table status - Admin/Waiter
router.put('/:id/status', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Kiểm tra nếu đang chuyển từ occupied sang available
    if (table.status === 'occupied' && status === 'available') {
      // Kiểm tra tất cả đơn hàng của bàn này
      const { Order } = require('../models');
      const activeOrders = await Order.findAll({
        where: {
          tableId: id,
          status: {
            [require('sequelize').Op.notIn]: ['completed', 'cancelled']
          }
        }
      });
      
      if (activeOrders.length > 0) {
        return res.status(400).json({ 
          message: 'Không thể chuyển trạng thái bàn. Tất cả đơn hàng phải được hoàn thành trước.',
          activeOrders: activeOrders.length
        });
      }
    }
    
    await table.update({ status });
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 