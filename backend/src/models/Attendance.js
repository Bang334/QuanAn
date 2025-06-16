const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Attendance extends Model {}

Attendance.init(
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
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'schedules',
        key: 'id'
      },
      comment: 'ID của lịch làm việc tương ứng'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeIn: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Thời gian check-in thực tế'
    },
    timeOut: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Thời gian check-out thực tế'
    },
    hoursWorked: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      comment: 'Số giờ làm việc được tính bằng min(thời gian checkout, thời gian ra của ca) - max(thời gian check in, thời gian vào theo ca)'
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late'),
      allowNull: false,
      defaultValue: 'present',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'Attendance',
    tableName: 'attendances',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date']
      }
    ],
    hooks: {
      beforeSave: async (attendance) => {
        // Giờ làm việc sẽ được tính toán trong controller dựa trên lịch làm việc
        // Không cần tính toán ở đây nữa
      }
    }
  }
);

module.exports = Attendance; 