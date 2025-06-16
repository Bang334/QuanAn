const express = require('express');
const router = express.Router();
const { Order, OrderItem, MenuItem, Table, User, Payment } = require('../models');
const { authenticateToken, isAdmin, isKitchen, isWaiter } = require('../middlewares/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const orderController = require('../controllers/order.controller');

// Helper function to update order status based on item statuses
const updateOrderStatusBasedOnItems = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem }]
    });
    
    if (!order) return null;
    
    // Don't update completed or cancelled orders
    if (order.status === 'completed' || order.status === 'cancelled') {
      return order;
    }
    
    // Check item statuses
    // All items ready: When all items are either 'ready', 'served', or 'cancelled'
    const allItemsReady = order.OrderItems.every(item => 
      item.status === 'ready' || item.status === 'served' || item.status === 'cancelled'
    );
    
    // All items served: When all items are either 'served' or 'cancelled'
    const allItemsServed = order.OrderItems.every(item => 
      item.status === 'served' || item.status === 'cancelled'
    );
    
    // Update order status in priority order:
    // 1. If all items are served, mark order as 'served'
    // 2. If all items are ready (but not all served), mark order as 'ready'
    // Note: We don't change status if it's already at the correct level
    if (allItemsServed && order.status !== 'served') {
      console.log(`Order ${orderId}: All items served, updating status to 'served'`);
      await order.update({ status: 'served' });
    } else if (allItemsReady && !allItemsServed && order.status !== 'ready') {
      console.log(`Order ${orderId}: All items ready, updating status to 'ready'`);
      await order.update({ status: 'ready' });
    }
    
    return order;
  } catch (error) {
    console.error('Error updating order status based on items:', error);
    return null;
  }
};

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
        status: 'completed'
      }
    });
    const totalRevenue = totalRevenueResult || 0;
    
    // Get today's revenue
    const todayRevenueResult = await Order.sum('totalAmount', {
      where: {
        status: 'completed',
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
    const { status, date, tableId, limit, hours_ago, days_ago, current_customer } = req.query;
    
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
    } else if (days_ago) {
      // Filter by days ago if provided
      const daysAgo = parseInt(days_ago);
      const now = new Date();
      const pastTime = new Date(now);
      pastTime.setDate(now.getDate() - daysAgo);
      
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
    
    let orders = await Order.findAll(queryOptions);
    
    // Nếu yêu cầu lọc theo khách hàng hiện tại (createdAt > updatedAt của bàn)
    if (current_customer === 'true' && tableId) {
      // Lấy thông tin bàn
      const table = await Table.findByPk(tableId);
      if (table) {
        const tableUpdatedAt = new Date(table.updatedAt);
        
        // Lọc đơn hàng có createdAt > updatedAt của bàn
        orders = orders.filter(order => {
          const orderCreatedAt = new Date(order.createdAt);
          return orderCreatedAt > tableUpdatedAt;
        });
      }
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get kitchen view (all pending and preparing items)
router.get('/kitchen/view', authenticateToken, isKitchen, async (req, res) => {
  try {
    const { hours_ago, days_ago } = req.query;
    const whereClause = {};
    
    if (hours_ago) {
      // Filter by hours ago
      const hoursAgo = parseInt(hours_ago);
      const now = new Date();
      const pastTime = new Date(now);
      pastTime.setHours(now.getHours() - hoursAgo);
      
      whereClause.createdAt = {
        [Op.gte]: pastTime
      };
    } else if (days_ago) {
      // Filter by days ago
      const daysAgo = parseInt(days_ago);
      const now = new Date();
      const pastTime = new Date(now);
      pastTime.setDate(now.getDate() - daysAgo);
      
      whereClause.createdAt = {
        [Op.gte]: pastTime
      };
    } else {
      // Mặc định lấy dữ liệu trong 24 giờ qua
      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setHours(now.getHours() - 24);
      
      whereClause.createdAt = {
        [Op.gte]: oneDayAgo
      };
    }
    
    // Lấy tất cả đơn hàng trong khoảng thời gian
    const orders = await Order.findAll({
      where: whereClause,
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
    
    // Chỉ lọc theo trạng thái nếu tham số status được cung cấp
    if (status) {
      whereClause.status = status;
    }
    // Không còn lọc mặc định để loại bỏ đơn hàng đã hoàn thành hoặc đã hủy
    
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
    
    // Update order status based on all items statuses
    const updatedOrder = await updateOrderStatusBasedOnItems(orderItem.orderId);
    
    res.json({
      orderItem,
      orderStatus: updatedOrder ? updatedOrder.status : null
    });
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
    
    // Update order status based on all items statuses
    const updatedOrder = await updateOrderStatusBasedOnItems(orderItem.orderId);
    
    res.json({
      orderItem,
      orderStatus: updatedOrder ? updatedOrder.status : null
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
      notes
    });
    
    // Create order items - Sử dụng transaction để đảm bảo tính nhất quán
    const transaction = await sequelize.transaction();
    
    try {
      for (const item of items) {
        const menuItem = await MenuItem.findByPk(item.menuItemId);
        
        // Sử dụng raw query để tránh trigger
        await sequelize.query(
          'INSERT INTO order_items (orderId, menuItemId, quantity, price, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          {
            replacements: [
              order.id,
              item.menuItemId,
              item.quantity,
              menuItem.price,
              'pending',
              item.notes || ''
            ],
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
    // Update table status without updating updatedAt
    if (table.status !== 'occupied') {
      // Sử dụng raw query để không cập nhật updatedAt
      await sequelize.query(
        'UPDATE Tables SET status = :status WHERE id = :id',
        {
          replacements: { status: 'occupied', id: tableId },
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }
    
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
    res.status(500).json({ 
      message: 'Không thể tạo đơn hàng. Vui lòng thử lại sau.',
      error: error.message
    });
  }
});

// Create a direct order with a single item - Public (from customer)
router.post('/direct', async (req, res) => {
  try {
    const { tableId, item, note } = req.body;
    
    if (!tableId || !item || !item.id) {
      return res.status(400).json({ message: 'Table ID and item details are required' });
    }
    
    // Check if table exists
    const table = await Table.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Get menu item details
    const menuItem = await MenuItem.findByPk(item.id);
    if (!menuItem) {
      return res.status(404).json({ message: `Menu item with ID ${item.id} not found` });
    }
    
    // Calculate total amount
    const totalAmount = menuItem.price * item.quantity;
    
    // Create order
    const order = await Order.create({
      tableId,
      status: 'pending',
      totalAmount,
      notes: note || ''
    });
    
    // Create order item
    await OrderItem.create({
      orderId: order.id,
      menuItemId: item.id,
      quantity: item.quantity,
      price: menuItem.price,
      status: 'pending',
      notes: note || ''
    });
    
    // Update table status without updating updatedAt
    if (table.status !== 'occupied') {
      // Sử dụng raw query để không cập nhật updatedAt
      await sequelize.query(
        'UPDATE Tables SET status = :status WHERE id = :id',
        {
          replacements: { status: 'occupied', id: tableId },
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }
    
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
    console.error('Error creating direct order:', error);
    res.status(500).json({ 
      message: 'Không thể tạo đơn hàng trực tiếp. Vui lòng thử lại sau.',
      error: error.message
    });
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
      // Không tự động cập nhật trạng thái bàn thành available nữa
      // const table = await Table.findByPk(order.tableId);
      // if (table) {
      //   await table.update({ status: 'available' });
      // }
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
    const { paymentMethod } = req.body;
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.update({ 
      status: 'completed',
      paymentMethod
    });
    
    // Không tự động cập nhật trạng thái bàn thành available nữa
    // const table = await Table.findByPk(order.tableId);
    // if (table) {
    //   await table.update({ status: 'available' });
    // }
    
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
    
    res.json(order);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept an order - Waiter only
router.put('/:id/accept', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only pending orders can be accepted
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot accept order that is in ${order.status} status. Only pending orders can be accepted.` 
      });
    }
    
    // Update order status to preparing (since 'accepted' is not in the enum)
    await order.update({ status: 'preparing' });
    
    // Không cập nhật trạng thái của các món ăn, để nhân viên bếp cập nhật sau
    // OrderItem vẫn giữ trạng thái 'pending'
    
    // Get updated order with items
    const updatedOrder = await Order.findByPk(id, {
      include: [
        { 
          model: OrderItem,
          include: [{ model: MenuItem }]
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Order accepted successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error accepting order:', error);
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
    // Không cần cập nhật totalAmount ở đây vì đã được cập nhật khi áp dụng mã giảm giá
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

// Process payment for an order - Waiter/Admin
router.post('/:id/payment', authenticateToken, isWaiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status and payment info
    await order.update({ 
      status: 'completed',
      paymentMethod
    });
    
    // Không tự động cập nhật trạng thái bàn thành available nữa
    // const table = await Table.findByPk(order.tableId);
    // if (table) {
    //   await table.update({ status: 'available' });
    // }
    
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
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      order
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API tổng hợp giá trị đơn hàng theo tháng
router.get('/total-revenue-by-month', authenticateToken, isAdmin, orderController.getTotalRevenueByMonth);

module.exports = router; 