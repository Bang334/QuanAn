'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Cập nhật trạng thái completed để có nghĩa là đã thanh toán
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET status = 'completed' 
      WHERE paymentStatus = 'paid'
    `);

    // 2. Thay đổi định nghĩa của cột paymentMethod để chỉ còn 2 phương thức
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      MODIFY COLUMN paymentMethod ENUM('cash', 'bank') DEFAULT 'cash'
    `);

    // 3. Xóa cột paymentStatus vì không còn cần thiết
    await queryInterface.removeColumn('orders', 'paymentStatus');
    
    // 4. Cập nhật tương tự cho bảng payments
    await queryInterface.sequelize.query(`
      ALTER TABLE payments 
      MODIFY COLUMN paymentMethod ENUM('cash', 'bank') DEFAULT 'cash'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Thêm lại cột paymentStatus
    await queryInterface.addColumn('orders', 'paymentStatus', {
      type: Sequelize.ENUM('unpaid', 'paid'),
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

    // 3. Khôi phục định nghĩa của cột paymentMethod
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      MODIFY COLUMN paymentMethod ENUM('cash', 'card', 'momo', 'zalopay', 'vnpay') DEFAULT 'cash'
    `);
    
    // 4. Khôi phục định nghĩa của cột paymentMethod trong bảng payments
    await queryInterface.sequelize.query(`
      ALTER TABLE payments 
      MODIFY COLUMN paymentMethod ENUM('cash', 'card', 'momo', 'zalopay', 'vnpay', 'bank_transfer') DEFAULT 'cash'
    `);
  }
}; 