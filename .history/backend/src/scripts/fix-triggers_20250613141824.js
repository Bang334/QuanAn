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
    const sqlFilePath = path.join(__dirname, 'fix-triggers.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Tách các câu lệnh SQL dựa trên dấu chấm phẩy và DELIMITER
    const statements = sqlScript.split('DELIMITER //');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      if (i === 0) {
        // Xử lý các câu lệnh trước DELIMITER đầu tiên
        const initialStatements = statement.split(';').filter(s => s.trim());
        for (const sql of initialStatements) {
          console.log(`Đang thực thi: ${sql.substring(0, 50)}...`);
          await connection.query(sql);
        }
      } else {
        // Xử lý các câu lệnh trong khối DELIMITER
        const parts = statement.split('DELIMITER ;');
        if (parts.length >= 1) {
          const triggerDef = parts[0].replace(/END\s*\/\//, 'END');
          console.log(`Đang thực thi trigger: ${triggerDef.substring(0, 50)}...`);
          await connection.query(triggerDef);
          
          // Xử lý các câu lệnh sau DELIMITER ;
          if (parts.length > 1 && parts[1].trim()) {
            const remainingStatements = parts[1].split(';').filter(s => s.trim());
            for (const sql of remainingStatements) {
              if (sql.trim()) {
                console.log(`Đang thực thi: ${sql.substring(0, 50)}...`);
                await connection.query(sql);
              }
            }
          }
        }
      }
    }
    
    console.log('Đã sửa các trigger thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi script SQL:', error);
  } finally {
    await connection.end();
  }
}

// Thực thi script
executeSqlScript().catch(console.error); 