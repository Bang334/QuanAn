'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing orders
    const orders = await queryInterface.sequelize.query(
      `SELECT id FROM orders WHERE status = 'completed' LIMIT 10;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (orders.length === 0) {
      console.log('No completed orders found. Cannot create payment data.');
      return;
    }

    // Create payments for different categories
    const payments = [];
    const paymentMethods = ['cash', 'credit_card', 'momo', 'zalopay'];
    
    for (let i = 0; i < orders.length; i++) {
      const orderId = orders[i].id;
      
      // Get order total
      const orderTotal = await queryInterface.sequelize.query(
        `SELECT SUM(quantity * price) as total FROM order_items WHERE orderId = ${orderId};`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (!orderTotal[0].total) continue;
      
      payments.push({
        orderId: orderId,
        amount: orderTotal[0].total,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: 'completed',
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return queryInterface.bulkInsert('payments', payments, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('payments', null, {});
  }
}; 