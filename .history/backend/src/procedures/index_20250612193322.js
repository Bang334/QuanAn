const sequelize = require('../config/database');

/**
 * Thực thi stored procedure MySQL
 * @param {string} procedureName - Tên của stored procedure
 * @param {Array} params - Mảng các tham số cho procedure
 * @returns {Promise<Array>} - Kết quả trả về từ procedure
 */
const executeStoredProcedure = async (procedureName, params = []) => {
  try {
    // Xây dựng câu lệnh gọi procedure với số lượng tham số động
    const paramPlaceholders = params.map(() => '?').join(', ');
    const query = `CALL ${procedureName}(${paramPlaceholders})`;
    
    // Thực thi procedure
    const [results] = await sequelize.query(query, {
      replacements: params,
      type: sequelize.QueryTypes.RAW
    });
    
    // Trả về kết quả (thường là mảng đầu tiên trong kết quả)
    return results[0] || [];
  } catch (error) {
    console.error(`Error executing stored procedure ${procedureName}:`, error);
    throw error;
  }
};

/**
 * Thực thi raw SQL query
 * @param {string} query - Câu lệnh SQL
 * @param {Object} options - Các tùy chọn cho query
 * @returns {Promise<Array>} - Kết quả trả về từ query
 */
const executeRawQuery = async (query, options = {}) => {
  try {
    const results = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      ...options
    });
    
    return results;
  } catch (error) {
    console.error('Error executing raw query:', error);
    throw error;
  }
};

// Import các procedures modules
const inventoryProcedures = require('./inventory.procedures');
const paymentProcedures = require('./payment.procedures');
const reportProcedures = require('./report.procedures');

// Export tất cả các procedures
module.exports = {
  executeStoredProcedure,
  executeRawQuery,
  ...inventoryProcedures,
  ...paymentProcedures,
  ...reportProcedures
}; 