const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Schedule extends Model {}

Schedule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    shift: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night', 'full_day'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'cancelled', 'rejected'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.ENUM('admin', 'staff'),
      allowNull: false,
      defaultValue: 'admin',
    }
  },
  {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedules',
    indexes: [
      {
        fields: ['userId', 'date', 'shift'],
        unique: true
      }
    ]
  }
);

module.exports = Schedule; 