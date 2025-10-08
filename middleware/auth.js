const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo_secret');
    
    // Check if database is connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      req.user = user;
    } else {
      // Demo mode: attach a minimal user
      req.user = { _id: decoded.userId, role: 'staff', name: 'Demo Staff' };
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
};
