'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Thay đổi định nghĩa của cột status để bao gồm completed là trạng thái đã thanh toán
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'processing', 'ready', 'delivered', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'pending: đang chờ, processing: đang chế biến, ready: sẵn sàng phục vụ, delivered: đã giao cho khách, completed: đã thanh toán, cancelled: đã hủy'
    });

    // 2. Thay đổi định nghĩa của cột paymentMethod để chỉ còn 2 phương thức
    await queryInterface.changeColumn('orders', 'paymentMethod', {
      type: Sequelize.ENUM('cash', 'bank'),
      defaultValue: 'cash',
      allowNull: true,
      comment: 'Phương thức thanh toán: cash (tiền mặt), bank (chuyển khoản)'
    });

    // 3. Cập nhật các đơn hàng có trạng thái completed và paymentStatus = paid
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET status = 'completed' 
      WHERE paymentStatus = 'paid' AND status = 'delivered'
    `);

    // 4. Xóa cột paymentStatus vì không còn cần thiết
    await queryInterface.removeColumn('orders', 'paymentStatus');
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Thêm lại cột paymentStatus
    await queryInterface.addColumn('orders', 'paymentStatus', {
      type: Sequelize.ENUM('unpaid', 'partial', 'paid'),
      defaultValue: 'unpaid',
      allowNull: false
    });

    // 2. Khôi phục lại các giá trị paymentStatus dựa trên trạng thái
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET paymentStatus = 'paid' 
      WHERE status = 'completed'
    `);

    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET paymentStatus = 'unpaid' 
      WHERE status != 'completed'
    `);

    // 3. Khôi phục định nghĩa của cột status
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'processing', 'ready', 'delivered', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'pending: đang chờ, processing: đang chế biến, ready: sẵn sàng phục vụ, delivered: đã giao cho khách, completed: đã hoàn thành, cancelled: đã hủy'
    });

    // 4. Khôi phục định nghĩa của cột paymentMethod
    await queryInterface.changeColumn('orders', 'paymentMethod', {
      type: Sequelize.ENUM('cash', 'card', 'bank', 'e-wallet'),
      defaultValue: 'cash',
      allowNull: true
    });
  }
}; 