const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function removeIsActiveColumn() {
  try {
    console.log('Bắt đầu migration để xóa cột isActive...');
    
    // Kiểm tra xem cột có tồn tại không
    const checkColumnSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kitchen_permissions' 
      AND COLUMN_NAME = 'isActive'
    `;
    
    const columns = await sequelize.query(checkColumnSql, { type: QueryTypes.SELECT });
    
    if (columns.length > 0) {
      // Cột tồn tại, xóa nó
      console.log('Cột isActive được tìm thấy, đang xóa...');
      
      // Xóa cột
      await sequelize.query(`
        ALTER TABLE kitchen_permissions 
        DROP COLUMN isActive
      `);
      
      console.log('Cột isActive đã được xóa thành công.');
    } else {
      console.log('Cột isActive không tồn tại, không cần thay đổi.');
    }
    
    console.log('Migration hoàn tất thành công.');
  } catch (error) {
    console.error('Migration thất bại:', error);
  } finally {
    // Đóng kết nối
    await sequelize.close();
  }
}

// Chạy migration
removeIsActiveColumn(); 