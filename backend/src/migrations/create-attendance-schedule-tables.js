'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tạo bảng attendances
    await queryInterface.createTable('attendances', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      timeIn: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      timeOut: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      hoursWorked: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'late', 'leave'),
        allowNull: false,
        defaultValue: 'present',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    // Tạo bảng schedules
    await queryInterface.createTable('schedules', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      shift: {
        type: Sequelize.ENUM('morning', 'afternoon', 'evening', 'night', 'full_day'),
        allowNull: false,
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'confirmed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    // Tạo indexes
    await queryInterface.addIndex('attendances', ['userId', 'date'], {
      unique: true,
      name: 'idx_attendance_user_date'
    });

    await queryInterface.addIndex('schedules', ['userId', 'date', 'shift'], {
      unique: true,
      name: 'idx_schedule_user_date_shift'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attendances');
    await queryInterface.dropTable('schedules');
  }
}; 