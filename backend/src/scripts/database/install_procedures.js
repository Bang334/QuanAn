/**
 * Script để cài đặt các stored procedures và triggers vào database
 */

const fs = require('fs');
const path = require('path');
const sequelize = require('../../config/database');

/**
 * Đọc và thực thi file SQL
 * @param {string} filePath - Đường dẫn đến file SQL
 * @returns {Promise<void>}
 */
const executeSqlFile = async (filePath) => {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    
    // Đọc nội dung file SQL
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Tách các câu lệnh SQL (phân tách theo DELIMITER)
    const sqlStatements = [];
    let currentDelimiter = ';';
    let currentStatement = '';
    
    // Xử lý DELIMITER trong file SQL
    const lines = sqlContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Kiểm tra nếu dòng thay đổi delimiter
      if (trimmedLine.toUpperCase().startsWith('DELIMITER')) {
        // Lưu statement hiện tại nếu có
        if (currentStatement.trim()) {
          sqlStatements.push({ statement: currentStatement, delimiter: currentDelimiter });
          currentStatement = '';
        }
        
        // Cập nhật delimiter mới
        currentDelimiter = trimmedLine.split(' ')[1];
      } 
      // Kiểm tra nếu dòng kết thúc bằng delimiter hiện tại
      else if (trimmedLine.endsWith(currentDelimiter)) {
        // Thêm dòng hiện tại vào statement và lưu statement
        currentStatement += line.replace(currentDelimiter, ';') + '\n';
        sqlStatements.push({ statement: currentStatement, delimiter: currentDelimiter });
        currentStatement = '';
      } 
      // Nếu không, thêm dòng vào statement hiện tại
      else {
        currentStatement += line + '\n';
      }
    }
    
    // Thêm statement cuối cùng nếu có
    if (currentStatement.trim()) {
      sqlStatements.push({ statement: currentStatement, delimiter: currentDelimiter });
    }
    
    // Thực thi từng câu lệnh SQL
    for (const { statement } of sqlStatements) {
      if (statement.trim()) {
        await sequelize.query(statement, { 
          type: sequelize.QueryTypes.RAW,
          raw: true,
          logging: false
        });
      }
    }
    
    console.log(`Successfully executed SQL file: ${filePath}`);
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Cài đặt các stored procedures và triggers
 */
const installDatabaseObjects = async () => {
  try {
    // Kiểm tra kết nối database
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Đường dẫn đến các file SQL
    const proceduresPath = path.join(__dirname, 'procedures.sql');
    const triggersPath = path.join(__dirname, 'triggers.sql');
    const validationTriggersPath = path.join(__dirname, 'triggers_validation.sql');
    
    // Thực thi file procedures.sql
    await executeSqlFile(proceduresPath);
    
    // Thực thi file triggers.sql
    await executeSqlFile(triggersPath);
    
    // Thực thi file triggers_validation.sql
    await executeSqlFile(validationTriggersPath);
    
    console.log('All database objects (procedures and triggers) have been installed successfully.');
  } catch (error) {
    console.error('Error installing database objects:', error);
    process.exit(1);
  } finally {
    // Đóng kết nối database
    await sequelize.close();
  }
};

// Thực thi script
installDatabaseObjects(); 