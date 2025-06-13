const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function removeCategoryColumn() {
  try {
    console.log('Starting migration to remove allowedCategories column...');
    
    // Check if column exists
    const checkColumnSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kitchen_permissions' 
      AND COLUMN_NAME = 'allowedCategories'
    `;
    
    const columns = await sequelize.query(checkColumnSql, { type: QueryTypes.SELECT });
    
    if (columns.length > 0) {
      // Column exists, drop it
      console.log('Column allowedCategories found, removing...');
      
      // Update comment on canAutoApprove to reflect new purpose
      await sequelize.query(`
        ALTER TABLE kitchen_permissions 
        MODIFY COLUMN canAutoApprove BOOLEAN DEFAULT false 
        COMMENT 'Quyền tự động phê duyệt đơn đặt hàng và thêm nguyên liệu'
      `);
      
      // Drop the column
      await sequelize.query(`
        ALTER TABLE kitchen_permissions 
        DROP COLUMN allowedCategories
      `);
      
      console.log('Column allowedCategories has been removed successfully.');
    } else {
      console.log('Column allowedCategories does not exist, no changes needed.');
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the migration
removeCategoryColumn(); 