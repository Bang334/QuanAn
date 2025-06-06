const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Table extends Model {}

Table.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved'),
      defaultValue: 'available',
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    }
  },
  {
    sequelize,
    modelName: 'Table',
    tableName: 'tables',
  }
);

module.exports = Table; 