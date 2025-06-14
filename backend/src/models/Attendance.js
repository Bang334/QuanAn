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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeIn: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    timeOut: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    hoursWorked: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'leave'),
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
      beforeSave: (attendance) => {
        // Tính toán số giờ làm việc nếu có cả giờ vào và giờ ra
        if (attendance.timeIn && attendance.timeOut) {
          const timeIn = new Date(`1970-01-01T${attendance.timeIn}`);
          const timeOut = new Date(`1970-01-01T${attendance.timeOut}`);
          
          // Nếu timeOut nhỏ hơn timeIn, giả định là qua ngày hôm sau
          let diff = timeOut - timeIn;
          if (diff < 0) {
            diff += 24 * 60 * 60 * 1000; // Cộng thêm 1 ngày
          }
          
          // Chuyển đổi milliseconds thành giờ và làm tròn đến 2 chữ số thập phân
          attendance.hoursWorked = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
        }
      }
    }
  }
);

module.exports = Attendance; 