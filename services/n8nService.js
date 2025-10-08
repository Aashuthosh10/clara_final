const axios = require('axios');

class N8nService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/073f1fed-1718-42b7-be10-5374376414ec';
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
  }

  /**
   * Send data to n8n webhook
   * @param {Object} data - Data to send to webhook
   * @param {string} webhookId - Optional webhook ID override
   * @returns {Promise<Object>} Response from n8n
   */
  async sendToWebhook(data, webhookId = null) {
    try {
      const url = webhookId 
        ? `${this.n8nBaseUrl}/webhook/${webhookId}`
        : this.webhookUrl;

      console.log(`📤 Sending data to n8n webhook: ${url}`);
      console.log('📊 Data payload:', JSON.stringify(data, null, 2));

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Clara-AI-System/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`✅ n8n webhook response:`, response.status, response.data);
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: 'Data sent successfully to n8n'
      };
    } catch (error) {
      console.error('❌ n8n webhook error:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 'NETWORK_ERROR',
        message: 'Failed to send data to n8n webhook'
      };
    }
  }

  /**
   * Send conversation data to n8n for processing
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<Object>} Response from n8n
   */
  async processConversation(conversationData) {
    const payload = {
      event: 'conversation_processed',
      timestamp: new Date().toISOString(),
      conversation: {
        sessionId: conversationData.sessionId,
        userId: conversationData.userId,
        messages: conversationData.messages,
        metadata: {
          source: 'clara_ai',
          version: '3.0',
          platform: 'web'
        }
      }
    };

    return await this.sendToWebhook(payload);
  }

  /**
   * Send call data to n8n for workflow processing
   * @param {Object} callData - Call data
   * @returns {Promise<Object>} Response from n8n
   */
  async processCall(callData) {
    const payload = {
      event: 'call_processed',
      timestamp: new Date().toISOString(),
      call: {
        callId: callData._id || callData.callId,
        clientId: callData.clientId,
        purpose: callData.purpose,
        status: callData.status,
        createdAt: callData.createdAt,
        metadata: {
          source: 'clara_ai',
          version: '3.0',
          platform: 'web'
        }
      }
    };

    return await this.sendToWebhook(payload);
  }

  /**
   * Send user activity data to n8n
   * @param {Object} userData - User activity data
   * @returns {Promise<Object>} Response from n8n
   */
  async processUserActivity(userData) {
    const payload = {
      event: 'user_activity',
      timestamp: new Date().toISOString(),
      user: {
        userId: userData._id || userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        action: userData.action,
        metadata: {
          source: 'clara_ai',
          version: '3.0',
          platform: 'web'
        }
      }
    };

    return await this.sendToWebhook(payload);
  }

  /**
   * Send system health data to n8n
   * @param {Object} healthData - System health data
   * @returns {Promise<Object>} Response from n8n
   */
  async sendHealthData(healthData) {
    const payload = {
      event: 'system_health',
      timestamp: new Date().toISOString(),
      health: {
        status: healthData.status,
        connectedUsers: healthData.connectedUsers,
        waitingCalls: healthData.waitingCalls,
        databaseStatus: healthData.databaseStatus,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        metadata: {
          source: 'clara_ai',
          version: '3.0',
          platform: 'web'
        }
      }
    };

    return await this.sendToWebhook(payload);
  }

  /**
   * Test n8n webhook connectivity
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const testPayload = {
        event: 'connection_test',
        timestamp: new Date().toISOString(),
        message: 'Testing n8n webhook connectivity from Clara AI System',
        metadata: {
          source: 'clara_ai',
          version: '3.0',
          platform: 'web'
        }
      };

      const result = await this.sendToWebhook(testPayload);
      
      if (result.success) {
        console.log('✅ n8n webhook connection test successful');
      } else {
        console.log('❌ n8n webhook connection test failed');
      }

      return result;
    } catch (error) {
      console.error('❌ n8n connection test error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Connection test failed'
      };
    }
  }

  /**
   * Get webhook status and configuration
   * @returns {Object} Webhook configuration
   */
  getWebhookConfig() {
    return {
      webhookUrl: this.webhookUrl,
      n8nBaseUrl: this.n8nBaseUrl,
      hasApiKey: !!this.apiKey,
      status: 'configured'
    };
  }
}

module.exports = N8nService;
