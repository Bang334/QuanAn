const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');
const fs = require('fs');

// Import models to ensure they're registered with Sequelize
const models = require('./models');

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

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
});

// Database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync database models with less aggressive options
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();