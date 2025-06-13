const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function removePaymentStatusField() {
  try {
    console.log('Starting migration: Removing paymentStatus field from orders table...');
    
    // Check if the column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'paymentStatus'
    `, { type: QueryTypes.SELECT });
    
    if (results) {
      // Remove the paymentStatus column
      await sequelize.query(`
        ALTER TABLE orders 
        DROP COLUMN paymentStatus
      `);
      console.log('Successfully removed paymentStatus column from orders table');
    } else {
      console.log('paymentStatus column does not exist in orders table');
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

removePaymentStatusField(); 