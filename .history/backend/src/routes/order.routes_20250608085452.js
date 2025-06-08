const express = require('express');
const router = express.Router();
const { Order, OrderItem, MenuItem, Table, User, Payment } = require('../models');
const { authenticateToken, isAdmin, isKitchen, isWaiter } = require('../middlewares/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get statistics for dashboard - Admin only
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total orders
    const totalOrders = await Order.count();
    
    // Get today's orders
    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [today, tomorrow]
        }
      }
    });
    
    // Get total revenue
    const totalRevenueResult = await Order.sum('totalAmount', {
      where: {
        paymentStatus: 'paid'
      }
    });
    const totalRevenue = totalRevenueResult || 0;
    
    // Get today's revenue
    const todayRevenueResult = await Order.sum('totalAmount', {
      where: {
        paymentStatus: 'paid',
        createdAt: {
          [Op.between]: [today, tomorrow]
        }
      }
    });
    const todayRevenue = todayRevenueResult || 0;
    
    // Get active users
    const activeUsers = await User.count({
      where: {
        role: {
          [Op.in]: ['waiter', 'kitchen']
        }
      }
    });
    
    // Get tables info
    const availableTables = await Table.count({
      where: {
        status: 'available'
      }
    });
    
    const totalTables = await Table.count();
    
    res.json({
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      activeUsers,
      availableTables,
      totalTables
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders - Staff only
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, date, tableId, limit, hours_ago } = req.query;
    
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (tableId) {
      whereClause.tableId = tableId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    } else if (hours_ago) {
      // Filter by hours ago if provided
      const hoursAgo = parseInt(hours_ago);
      const now = new Date();
      const pastTime = new Date(now);
      pastTime.setHours(now.getHours() - hoursAgo);
      
      whereClause.createdAt = {
        [Op.gte]: pastTime
      };
    }
    
    const queryOptions = {
      where: whereClause,
      include: [
        { model: Table },
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        }
      ],
      order: [['createdAt', 'DESC']]
    };
    
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }
    
    const orders = await Order.findAll(queryOptions);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get kitchen view (all pending and preparing items)
router.get('/kitchen/view', authenticateToken, isKitchen, async (req, res) => {
  try {
    // Lấy tất cả đơn hàng thay vì chỉ lấy các món đang chờ
    const orders = await Order.findAll({
      include: [
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        },
        { model: Table }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching kitchen view:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders by table
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.query;
    
    const whereClause = { tableId };
    
    if (status) {
      whereClause.status = status;
    } else {
      // If no status provided, get active orders (not completed or cancelled)
      whereClause.status = {
        [Op.notIn]: ['completed', 'cancelled']
      };
    }
    
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order item status - Kitchen staff
router.put('/items/:itemId/status', authenticateToken, isKitchen, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    
    const orderItem = await OrderItem.findByPk(itemId);
    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    await orderItem.update({ status });
    
    res.json(orderItem);
  } catch (error) {
    console.error('Error updating order item status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order item status - Waiter staff (for serving individual dishes)
router.put('/items/:itemId/serve', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const orderItem = await OrderItem.findByPk(itemId);
    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    // Only ready items can be served
    if (orderItem.status !== 'ready') {
      return res.status(400).json({ message: 'Only ready items can be served' });
    }
    
    await orderItem.update({ status: 'served' });
    
    // Check if all items in the order are served
    const order = await Order.findByPk(orderItem.orderId, {
      include: [{ model: OrderItem }]
    });
    
    const allServed = order.OrderItems.every(item => 
      item.status === 'served' || item.status === 'cancelled'
    );
    
    // If all items are served, update order status to served
    if (allServed) {
      await order.update({ status: 'served' });
    }
    
    res.json({
      orderItem,
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Error serving order item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        { model: Table },
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new order - Public (from customer)
router.post('/', async (req, res) => {
  try {
    const { tableId, items, notes } = req.body;
    
    if (!tableId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Table ID and at least one item are required' });
    }
    
    // Check if table exists
    const table = await Table.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item with ID ${item.menuItemId} not found` });
      }
      
      totalAmount += menuItem.price * item.quantity;
    }
    
    // Create order
    const order = await Order.create({
      tableId,
      status: 'pending',
      totalAmount,
      paymentStatus: 'unpaid',
      notes
    });
    
    // Create order items
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      
      await OrderItem.create({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        status: 'pending',
        notes: item.notes
      });
    }
    
    // Update table status
    await table.update({ status: 'occupied' });
    
    // Get complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: Table },
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        }
      ]
    });
    
    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status - Staff only
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.update({ status });
    
    // If order is completed, update table status
    if (status === 'completed') {
      const table = await Table.findByPk(order.tableId);
      if (table) {
        await table.update({ status: 'available' });
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status - Waiter/Admin
router.put('/:id/payment', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.update({ 
      paymentStatus,
      paymentMethod,
      status: paymentStatus === 'paid' ? 'completed' : order.status
    });
    
    // If payment is completed, update table status and create payment record
    if (paymentStatus === 'paid') {
      // Update table status
      const table = await Table.findByPk(order.tableId);
      if (table) {
        await table.update({ status: 'available' });
      }
      
      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ where: { orderId: id } });
      if (!existingPayment) {
        // Create payment record
        await Payment.create({
          orderId: id,
          amount: order.totalAmount,
          paymentMethod,
          paymentDate: new Date(),
          status: 'completed',
          notes: `Thanh toán bởi ${req.user.username || 'nhân viên'}`
        });
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle payment request from customer
router.put('/:id/payment-request', async (req, res) => {
  try {
    const { id } = req.params;
    const { tableId } = req.body;
    
    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify table ID matches the order
    if (order.tableId != tableId) {
      return res.status(403).json({ message: 'Invalid table ID for this order' });
    }
    
    // Update order status to payment_requested
    await order.update({ status: 'payment_requested' });
    
    // Send notification to staff (this would be implemented with WebSockets in a real app)
    // Here we're just preparing the response
    
    res.json({
      success: true,
      message: 'Payment request sent successfully',
      order
    });
  } catch (error) {
    console.error('Error requesting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 