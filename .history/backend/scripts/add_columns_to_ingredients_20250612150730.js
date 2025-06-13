const sequelize = require('../src/config/database');

async function addColumnsToIngredients() {
  try {
    console.log('Connecting to database...');
    
    // Test the connection
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (err) {
      console.error('Unable to connect to the database:', err);
      return;
    }

    console.log('Adding missing columns to ingredients table...');

    // Add expiryDate column
    try {
      await sequelize.query(
        'ALTER TABLE ingredients ADD COLUMN expiryDate DATETIME NULL COMMENT "Hạn sử dụng của nguyên liệu"'
      );
      console.log('Added expiryDate column');
    } catch (err) {
      console.log('Error adding expiryDate column:', err.message);
      // Continue with other columns even if this one fails
    }

    // Add location column
    try {
      await sequelize.query(
        'ALTER TABLE ingredients ADD COLUMN location VARCHAR(255) NULL COMMENT "Vị trí lưu trữ trong kho"'
      );
      console.log('Added location column');
    } catch (err) {
      console.log('Error adding location column:', err.message);
    }

    // Add isActive column
    try {
      await sequelize.query(
        'ALTER TABLE ingredients ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT "Trạng thái hoạt động của nguyên liệu"'
      );
      console.log('Added isActive column');
    } catch (err) {
      console.log('Error adding isActive column:', err.message);
    }

    // Add image column
    try {
      await sequelize.query(
        'ALTER TABLE ingredients ADD COLUMN image VARCHAR(255) NULL COMMENT "Đường dẫn đến hình ảnh nguyên liệu"'
      );
      console.log('Added image column');
    } catch (err) {
      console.log('Error adding image column:', err.message);
    }

    // Verify the columns were added
    try {
      const [results] = await sequelize.query('DESCRIBE ingredients');
      console.log('Current table structure:');
      console.log(results.map(row => row.Field));
    } catch (err) {
      console.error('Error describing table:', err);
    }

    console.log('Column addition process completed!');
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    // Close the connection
    try {
      await sequelize.close();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the function
addColumnsToIngredients(); 