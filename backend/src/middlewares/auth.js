const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Use the same hardcoded secret key as in auth.routes.js
    const decoded = jwt.verify(token, 'quanan_jwt_secret_key_temp');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Middleware to check if user is kitchen staff
const isKitchen = (req, res, next) => {
  if (req.user && (req.user.role === 'kitchen' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Kitchen role required.' });
  }
};

// Middleware to check if user is waiter
const isWaiter = (req, res, next) => {
  if (req.user && (req.user.role === 'waiter' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Waiter role required.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isKitchen,
  isWaiter
}; 