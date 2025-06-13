const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class KitchenPermission extends Model {}

KitchenPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của nhân viên bếp được cấp quyền'
    },
    grantedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của admin cấp quyền'
    },
    canAutoApprove: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Quyền tự động phê duyệt đơn đặt hàng và thêm nguyên liệu'
    },
    maxOrderValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Giá trị đơn hàng tối đa được phép tự phê duyệt'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày hết hạn quyền (null nếu không hết hạn)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    modelName: 'KitchenPermission',
    tableName: 'kitchen_permissions',
  }
);

module.exports = KitchenPermission; 