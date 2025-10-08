const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const User = require('../models/User');
const Staff = require('../models/Staff');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For demo purposes, allow requests without token but with limited access
    req.user = { 
      userId: 'demo-user-id', 
      role: 'user',
      employeeId: 'demo-staff-id'
    };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'demo_secret', (err, user) => {
    if (err) {
      // For demo purposes, allow invalid tokens with demo user
      req.user = { 
        userId: 'demo-user-id', 
        role: 'user',
        employeeId: 'demo-staff-id'
      };
      return next();
    }
    req.user = user;
    next();
  });
};

// Create a new session
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { clientId, staffId, purpose } = req.body;
    
    if (!clientId || !staffId) {
      return res.status(400).json({ error: 'Client ID and Staff ID are required' });
    }

    // Verify staff exists
    const staff = await Staff.findOne({ employeeId: staffId });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Check if there's already an active session between this client and staff
    const existingSession = await Session.findOne({
      clientId,
      staffId,
      status: 'active'
    });

    if (existingSession) {
      return res.status(409).json({ 
        error: 'Active session already exists',
        sessionId: existingSession.sessionId
      });
    }

    // Get client details
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create new session
    const sessionId = uuidv4();
    const session = new Session({
      sessionId,
      clientId,
      staffId,
      metadata: {
        clientName: client.name,
        staffName: staff.name,
        purpose: purpose || 'General inquiry'
      }
    });

    await session.save();

    res.status(201).json({
      success: true,
      sessionId,
      session: {
        sessionId,
        clientId,
        staffId,
        clientName: client.name,
        staffName: staff.name,
        purpose: purpose || 'General inquiry',
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// End a session
router.post('/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user has permission to end this session
    if (req.user.role === 'staff' && session.staffId !== req.user.employeeId) {
      return res.status(403).json({ error: 'Not authorized to end this session' });
    }
    if (req.user.role === 'user' && session.clientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to end this session' });
    }

    await session.endSession();

    res.json({
      success: true,
      message: 'Session ended successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get active sessions for a staff member
router.get('/:staffId/active', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    
    // Verify staff exists and user has permission
    if (req.user.role === 'staff' && req.user.employeeId !== staffId) {
      return res.status(403).json({ error: 'Not authorized to view these sessions' });
    }

    const sessions = await Session.find({
      staffId,
      status: 'active'
    })
    .populate('clientId', 'name email')
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        clientId: session.clientId._id,
        clientName: session.metadata.clientName,
        staffName: session.metadata.staffName,
        purpose: session.metadata.purpose,
        callCount: session.metadata.callCount,
        messageCount: session.metadata.messageCount,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }))
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Get session details
router.get('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findOne({ sessionId })
      .populate('clientId', 'name email');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check permissions
    if (req.user.role === 'staff' && session.staffId !== req.user.employeeId) {
      return res.status(403).json({ error: 'Not authorized to view this session' });
    }
    if (req.user.role === 'user' && session.clientId._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this session' });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        clientId: session.clientId._id,
        clientName: session.metadata.clientName,
        staffName: session.metadata.staffName,
        purpose: session.metadata.purpose,
        status: session.status,
        callCount: session.metadata.callCount,
        messageCount: session.metadata.messageCount,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });

  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// Update session activity
router.patch('/:sessionId/activity', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check permissions
    if (req.user.role === 'staff' && session.staffId !== req.user.employeeId) {
      return res.status(403).json({ error: 'Not authorized to update this session' });
    }
    if (req.user.role === 'user' && session.clientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this session' });
    }

    await session.updateActivity();

    res.json({
      success: true,
      message: 'Session activity updated'
    });

  } catch (error) {
    console.error('Error updating session activity:', error);
    res.status(500).json({ error: 'Failed to update session activity' });
  }
});

module.exports = router;
