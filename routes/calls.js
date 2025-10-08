const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /api/calls
 * @desc Get call log with pagination and filters
 * @access Private (Staff)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      staffId, 
      clientId, 
      startDate, 
      endDate 
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (staffId) query.staffId = staffId;
    if (clientId) query.clientId = clientId;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'staffId', select: 'name email department' },
        { path: 'clientId', select: 'name email phone' }
      ]
    };

    const calls = await Call.paginate(query, options);

    res.json({
      success: true,
      calls: calls.docs,
      pagination: {
        page: calls.page,
        pages: calls.totalPages,
        total: calls.totalDocs,
        limit: calls.limit
      }
    });
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

/**
 * @route GET /api/calls/:id
 * @desc Get call details with updates
 * @access Private (Staff)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('staffId', 'name email department')
      .populate('clientId', 'name email phone')
      .populate('updates.updatedBy', 'name email');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Get call details error:', error);
    res.status(500).json({ error: 'Failed to fetch call details' });
  }
});

/**
 * @route POST /api/calls
 * @desc Create new call record
 * @access Private (Staff)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      clientId,
      purpose,
      callType = 'incoming',
      status = 'queued'
    } = req.body;

    if (!clientId || !purpose) {
      return res.status(400).json({ error: 'clientId and purpose are required' });
    }

    const call = new Call({
      clientId,
      staffId: req.user.id,
      purpose,
      callType,
      status,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await call.save();

    res.status(201).json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

/**
 * @route PUT /api/calls/:id/status
 * @desc Update call status
 * @access Private (Staff)
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['queued', 'ringing', 'connected', 'completed', 'failed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const call = await Call.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'name email department')
     .populate('clientId', 'name email phone');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Update call status error:', error);
    res.status(500).json({ error: 'Failed to update call status' });
  }
});

/**
 * @route POST /api/calls/:id/updates
 * @desc Add update/note to call
 * @access Private (Staff)
 */
router.post('/:id/updates', authenticateToken, async (req, res) => {
  try {
    const { notes, disposition, followUpRequired = false, appointmentId } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const update = {
      notes,
      disposition,
      followUpRequired,
      appointmentId,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    const call = await Call.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { updates: update },
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'name email department')
     .populate('clientId', 'name email phone')
     .populate('updates.updatedBy', 'name email');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Add call update error:', error);
    res.status(500).json({ error: 'Failed to add call update' });
  }
});

/**
 * @route GET /api/calls/stats/summary
 * @desc Get call statistics summary
 * @access Private (Staff)
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (staffId) matchQuery.staffId = staffId;
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Call.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCalls = await Call.countDocuments(matchQuery);
    const todayCalls = await Call.countDocuments({
      ...matchQuery,
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lte: new Date().setHours(23, 59, 59, 999)
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalCalls,
        today: todayCalls,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({ error: 'Failed to fetch call statistics' });
  }
});

module.exports = router;
