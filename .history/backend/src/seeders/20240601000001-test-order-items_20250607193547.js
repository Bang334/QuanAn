'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get menu items from different categories
    const menuItems = await queryInterface.sequelize.query(
      `SELECT id, category, price FROM menu_items;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (menuItems.length === 0) {
      console.log('No menu items found. Cannot create order items.');
      return;
    }
    
    // Group menu items by category
    const categorizedItems = {};
    menuItems.forEach(item => {
      if (!categorizedItems[item.category]) {
        categorizedItems[item.category] = [];
      }
      categorizedItems[item.category].push(item);
    });
    
    // Create a new order for testing
    const orderId = await queryInterface.bulkInsert('orders', [{
      tableNumber: 1,
      status: 'completed',
      notes: 'Test order with multiple categories',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });
    
    // Add order items for each category
    const orderItems = [];
    Object.keys(categorizedItems).forEach(category => {
      // Add 1-3 items from each category
      const itemsToAdd = Math.min(categorizedItems[category].length, Math.floor(Math.random() * 3) + 1);
      
      for (let i = 0; i < itemsToAdd; i++) {
        const menuItem = categorizedItems[category][i];
        orderItems.push({
          orderId: orderId,
          menuItemId: menuItem.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: menuItem.price,
          notes: `Test item from ${category}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    await queryInterface.bulkInsert('order_items', orderItems, {});
    
    // Create payment for this order
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    return queryInterface.bulkInsert('payments', [{
      orderId: orderId,
      amount: totalAmount,
      paymentMethod: 'cash',
      status: 'completed',
      paymentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('order_items', null, {});
  }
}; 