const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class MenuItem extends Model {}

MenuItem.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isPopular: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nutritionInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preparationTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isSpicy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isVegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allergens: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avgRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  },
  {
    sequelize,
    modelName: 'MenuItem',
    tableName: 'menu_items',
  }
);

module.exports = MenuItem; 