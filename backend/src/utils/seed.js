const bcrypt = require('bcrypt');
const { User, Table, MenuItem } = require('../models');
const sequelize = require('../config/database');

async function seedDatabase() {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@quanan.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created:', adminUser.name);

    // Create kitchen user
    const kitchenUser = await User.create({
      name: 'Đầu bếp',
      email: 'kitchen@quanan.com',
      password: 'kitchen123',
      role: 'kitchen'
    });
    console.log('Kitchen user created:', kitchenUser.name);

    // Create waiter user
    const waiterUser = await User.create({
      name: 'Phục vụ',
      email: 'waiter@quanan.com',
      password: 'waiter123',
      role: 'waiter'
    });
    console.log('Waiter user created:', waiterUser.name);

    // Create tables
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      const table = await Table.create({
        name: `Bàn ${i}`,
        capacity: i % 3 === 0 ? 6 : 4,
        status: 'available'
      });
      tables.push(table);
    }
    console.log(`${tables.length} tables created`);

    // Create menu items
    const menuItems = [
      // Món chính
      {
        name: 'Phở bò',
        description: 'Phở bò truyền thống với nước dùng ngon',
        price: 50000,
        category: 'Món chính',
        isAvailable: true,
        image: null
      },
      {
        name: 'Bún chả',
        description: 'Bún chả Hà Nội với thịt nướng thơm ngon',
        price: 45000,
        category: 'Món chính',
        isAvailable: true,
        image: null
      },
      {
        name: 'Cơm tấm',
        description: 'Cơm tấm sườn nướng đặc biệt',
        price: 55000,
        category: 'Món chính',
        isAvailable: true,
        image: null
      },
      {
        name: 'Bún bò Huế',
        description: 'Bún bò Huế cay nồng đặc trưng',
        price: 60000,
        category: 'Món chính',
        isAvailable: true,
        image: null
      },
      // Món phụ
      {
        name: 'Chả giò',
        description: 'Chả giò giòn rụm',
        price: 35000,
        category: 'Món phụ',
        isAvailable: true,
        image: null
      },
      {
        name: 'Gỏi cuốn',
        description: 'Gỏi cuốn tôm thịt tươi mát',
        price: 30000,
        category: 'Món phụ',
        isAvailable: true,
        image: null
      },
      // Đồ uống
      {
        name: 'Nước chanh',
        description: 'Nước chanh tươi mát',
        price: 15000,
        category: 'Đồ uống',
        isAvailable: true,
        image: null
      },
      {
        name: 'Trà đá',
        description: 'Trà đá miễn phí',
        price: 0,
        category: 'Đồ uống',
        isAvailable: true,
        image: null
      },
      {
        name: 'Bia Hà Nội',
        description: 'Bia Hà Nội mát lạnh',
        price: 25000,
        category: 'Đồ uống',
        isAvailable: true,
        image: null
      },
      // Tráng miệng
      {
        name: 'Chè thái',
        description: 'Chè thái thơm ngon',
        price: 20000,
        category: 'Tráng miệng',
        isAvailable: true,
        image: null
      },
      {
        name: 'Trái cây dĩa',
        description: 'Đĩa trái cây theo mùa',
        price: 35000,
        category: 'Tráng miệng',
        isAvailable: true,
        image: null
      }
    ];

    for (const item of menuItems) {
      await MenuItem.create(item);
    }
    console.log(`${menuItems.length} menu items created`);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the seed function
seedDatabase(); 