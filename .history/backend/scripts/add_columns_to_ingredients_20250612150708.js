const { sequelize } = require('../src/config/database');

async function addColumnsToIngredients() {
  try {
    console.log('Adding missing columns to ingredients table...');

    // Add expiryDate column
    await sequelize.query(
      'ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS expiryDate DATETIME NULL COMMENT "Hạn sử dụng của nguyên liệu"'
    );
    console.log('Added expiryDate column');

    // Add location column
    await sequelize.query(
      'ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL COMMENT "Vị trí lưu trữ trong kho"'
    );
    console.log('Added location column');

    // Add isActive column
    await sequelize.query(
      'ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT "Trạng thái hoạt động của nguyên liệu"'
    );
    console.log('Added isActive column');

    // Add image column
    await sequelize.query(
      'ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS image VARCHAR(255) NULL COMMENT "Đường dẫn đến hình ảnh nguyên liệu"'
    );
    console.log('Added image column');

    console.log('All columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the function
addColumnsToIngredients(); 