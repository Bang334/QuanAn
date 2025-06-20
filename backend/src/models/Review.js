const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Review extends Model {}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu_items',
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tables',
        key: 'id'
      }
    },
    reviewDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    indexes: [
      {
        fields: ['menuItemId']
      },
      {
        fields: ['orderId']
      },
      {
        fields: ['tableId']
      }
    ]
  }
);

module.exports = Review; 