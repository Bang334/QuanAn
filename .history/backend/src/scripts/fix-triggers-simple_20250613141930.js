const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function executeSqlScript() {
  // Tạo kết nối đến cơ sở dữ liệu
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restaurant_management',
    multipleStatements: true // Cho phép thực thi nhiều câu lệnh SQL
  });

  try {
    console.log('Đang kết nối đến cơ sở dữ liệu...');
    
    // Đọc nội dung file SQL
    const sqlFilePath = path.join(__dirname, 'fix-triggers-simple.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Đang thực thi script SQL...');
    await connection.query(sqlScript);
    
    console.log('Đã sửa các trigger thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi script SQL:', error);
  } finally {
    await connection.end();
  }
}

// Thực thi script
executeSqlScript().catch(console.error); 