const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'quanan_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize; 