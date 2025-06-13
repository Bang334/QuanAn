const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addPaymentStatusField() {
  try {
    console.log('Starting migration: Adding paymentStatus field to orders table...');
    
    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'paymentStatus'
    `, { type: QueryTypes.SELECT });
    
    if (!results) {
      // Add the paymentStatus column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN paymentStatus ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending'
      `);
      console.log('Successfully added paymentStatus column to orders table');
    } else {
      console.log('paymentStatus column already exists in orders table');
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addPaymentStatusField(); 