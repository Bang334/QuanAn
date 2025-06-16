const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// Import models to ensure they're registered with Sequelize
const models = require('./models');

// Import the menu availability checker
const { checkAllMenuItemsAvailability } = require('./scripts/check-menu-availability');

// Import scheduled tasks
const { scheduleSalaryGeneration } = require('./utils/scheduledTasks');
const { scheduleAbsentMarking } = require('./cron/attendance.cron');
const { scheduleAutoReject } = require('./cron/schedule.cron');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'menu'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'qrcodes'), { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/menu', require('./routes/menu.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/promotions', require('./routes/promotion.routes'));
app.use('/api/salaries', require('./routes/salary.routes'));
app.use('/api/salary', require('./routes/salary.routes'));
app.use('/api/salary-rate', require('./routes/salaryRate.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/kitchen-permissions', require('./routes/kitchen-permissions.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/schedule', require('./routes/schedule.routes'));

// Socket.IO connection
io.on('connection', (socket) => {
  // console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    // console.log('User disconnected:', socket.id);
  });
  
  // Handle order updates
  socket.on('orderUpdate', (data) => {
    io.emit('orderStatusChanged', data);
  });
  
  // Handle table status updates
  socket.on('tableUpdate', (data) => {
    io.emit('tableStatusChanged', data);
  });
  
  // Handle payment updates
  socket.on('paymentUpdate', (data) => {
    io.emit('paymentStatusChanged', data);
  });
  
  // Handle promotion updates
  socket.on('promotionUpdate', (data) => {
    io.emit('promotionStatusChanged', data);
  });
  
  // Handle salary updates
  socket.on('salaryUpdate', (data) => {
    io.emit('salaryStatusChanged', data);
  });
  
  // Handle inventory updates
  socket.on('inventoryUpdate', (data) => {
    io.emit('inventoryStatusChanged', data);
  });
  
  // Handle purchase order updates
  socket.on('purchaseOrderUpdate', (data) => {
    io.emit('purchaseOrderStatusChanged', data);
  });
  
  // Handle inventory report updates
  socket.on('inventoryReportUpdate', (data) => {
    io.emit('inventoryReportUpdated', data);
  });
  
  // Handle low stock alerts
  socket.on('lowStockAlert', (data) => {
    io.emit('lowStockNotification', data);
  });
  
  // Handle forecast updates
  socket.on('forecastUpdate', (data) => {
    io.emit('forecastUpdated', data);
  });
});

// Database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Tắt chức năng tự động tạo bảng
    // await sequelize.sync({ alter: true });
    console.log('Database sync disabled. Using existing tables.');
    
    // Check if there are any menu items, if not, add some sample items
    const { MenuItem } = require('./models');
    const menuItemCount = await MenuItem.count();
    console.log(`Current menu items count: ${menuItemCount}`);
    
    if (menuItemCount === 0) {
      console.log('No menu items found, adding sample data...');
      
      const sampleMenuItems = [
        {
          name: 'Bún bò Huế',
          description: 'Bún bò Huế cay nồng đặc trưng',
          price: 60000,
          image: 'https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2018/10/bun-bo-hue-nong-hoi.jpg',
          category: 'Món chính',
          isAvailable: true,
          isPopular: true
        },
        {
          name: 'Chả giò tôm thịt',
          description: 'Chả giò tôm thịt giòn rụm',
          price: 35000,
          image: 'https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2018/10/cha-gio-gion-tan.jpg',
          category: 'Món phụ',
          isAvailable: true
        },
        {
          name: 'Gỏi cuốn',
          description: 'Gỏi cuốn tôm thịt tươi mát',
          price: 30000,
          image: 'https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2018/10/goi-cuon-ngon.jpg',
          category: 'Món phụ',
          isAvailable: true
        },
        {
          name: 'Nước chanh',
          description: 'Nước chanh tươi mát',
          price: 15000,
          image: 'https://images.unsplash.com/photo-1556679343-c1c3d4309b59',
          category: 'Đồ uống',
          isAvailable: true
        },
        {
          name: 'Trà đá',
          description: 'Trà đá miễn phí',
          price: 0,
          image: 'https://images.unsplash.com/photo-1556679343-c1c3d4309b59',
          category: 'Đồ uống',
          isAvailable: true
        }
      ];
      
      await MenuItem.bulkCreate(sampleMenuItems);
      console.log('Sample menu items added successfully');
    }
    
    // Set up scheduled task to check menu item availability
    // Run every hour and when inventory changes
    cron.schedule('0 * * * *', async () => {
      console.log('Running scheduled menu item availability check...');
      await checkAllMenuItemsAvailability();
    });
    
    // Run the check once at startup
    console.log('Running initial menu item availability check...');
    await checkAllMenuItemsAvailability();
    
    // Initialize automatic salary generation task
    // scheduleSalaryGeneration();
    
    // Initialize automatic absent marking task
    scheduleAbsentMarking();
    
    // Initialize automatic schedule rejection task
    scheduleAutoReject();
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();