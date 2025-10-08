const express = require('express');
const router = express.Router();
const N8nService = require('../services/n8nService');

const n8nService = new N8nService();

// Test n8n webhook connectivity
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing n8n webhook connectivity...');
    const result = await n8nService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'n8n webhook connection test successful',
        data: result,
        config: n8nService.getWebhookConfig()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'n8n webhook connection test failed',
        error: result.error,
        config: n8nService.getWebhookConfig()
      });
    }
  } catch (error) {
    console.error('❌ n8n test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during n8n test',
      error: error.message
    });
  }
});

// Get n8n webhook configuration
router.get('/config', (req, res) => {
  try {
    const config = n8nService.getWebhookConfig();
    res.json({
      success: true,
      config,
      message: 'n8n webhook configuration retrieved successfully'
    });
  } catch (error) {
    console.error('❌ n8n config route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve n8n configuration',
      error: error.message
    });
  }
});

// Manual trigger for n8n webhook
router.post('/trigger', async (req, res) => {
  try {
    const { event, data, webhookId } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({
        success: false,
        message: 'Event and data are required'
      });
    }

    console.log(`🚀 Manually triggering n8n webhook for event: ${event}`);
    
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        source: 'clara_ai',
        version: '3.0',
        platform: 'web',
        manualTrigger: true
      }
    };

    const result = await n8nService.sendToWebhook(payload, webhookId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'n8n webhook triggered successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger n8n webhook',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ n8n trigger route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during webhook trigger',
      error: error.message
    });
  }
});

// Send conversation data to n8n
router.post('/conversation', async (req, res) => {
  try {
    const { sessionId, userId, messages } = req.body;
    
    if (!sessionId || !userId || !messages) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, user ID, and messages are required'
      });
    }

    console.log(`💬 Sending conversation data to n8n for session: ${sessionId}`);
    
    const conversationData = {
      sessionId,
      userId,
      messages
    };

    const result = await n8nService.processConversation(conversationData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conversation data sent to n8n successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send conversation data to n8n',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ n8n conversation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during conversation processing',
      error: error.message
    });
  }
});

// Send call data to n8n
router.post('/call', async (req, res) => {
  try {
    const { callId, clientId, purpose, status, createdAt } = req.body;
    
    if (!callId || !clientId || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Call ID, client ID, and purpose are required'
      });
    }

    console.log(`📞 Sending call data to n8n for call: ${callId}`);
    
    const callData = {
      callId,
      clientId,
      purpose,
      status: status || 'waiting',
      createdAt: createdAt || new Date()
    };

    const result = await n8nService.processCall(callData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Call data sent to n8n successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send call data to n8n',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ n8n call route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during call processing',
      error: error.message
    });
  }
});

// Send user activity data to n8n
router.post('/user-activity', async (req, res) => {
  try {
    const { userId, name, email, role, action } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: 'User ID and action are required'
      });
    }

    console.log(`👤 Sending user activity data to n8n for user: ${userId}`);
    
    const userData = {
      userId,
      name,
      email,
      role,
      action
    };

    const result = await n8nService.processUserActivity(userData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User activity data sent to n8n successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send user activity data to n8n',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ n8n user activity route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during user activity processing',
      error: error.message
    });
  }
});

// Send system health data to n8n
router.post('/health', async (req, res) => {
  try {
    const { status, connectedUsers, waitingCalls, databaseStatus } = req.body;
    
    console.log('🏥 Sending system health data to n8n');
    
    const healthData = {
      status: status || 'OK',
      connectedUsers: connectedUsers || 0,
      waitingCalls: waitingCalls || 0,
      databaseStatus: databaseStatus || 'unknown'
    };

    const result = await n8nService.sendHealthData(healthData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'System health data sent to n8n successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send system health data to n8n',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ n8n health route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during health data processing',
      error: error.message
    });
  }
});

module.exports = router;
