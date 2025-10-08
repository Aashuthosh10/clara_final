# n8n Integration for Clara AI System

This document describes the n8n webhook integration implemented in the Clara AI Reception System.

## Overview

The n8n integration allows Clara AI to send real-time data to n8n workflows for automated processing, analytics, and external integrations.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# n8n Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/073f1fed-1718-42b7-be10-5374376414ec
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGY5MDgzYS0wYmE5LTQzNzAtODQwNy1jNDAyNGJhNjhiOTQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NDI1MjE3LCJleHAiOjE3NTc5OTUyMDB9.9LDEMc4I-Z2i5kQI-tSYKSdRNhaBX3Jbnj6h6gM1Ty8
```

### Default Webhook URL

The system is configured to use the webhook URL: `http://localhost:5678/webhook/073f1fed-1718-42b7-be10-5374376414ec`

## API Endpoints

### Base URL
```
/api/n8n
```

### Available Endpoints

#### 1. Configuration
- **GET** `/api/n8n/config` - Get current n8n configuration
- **GET** `/api/n8n/test` - Test n8n webhook connectivity

#### 2. Manual Triggers
- **POST** `/api/n8n/trigger` - Manually trigger webhook with custom data
- **POST** `/api/n8n/conversation` - Send conversation data to n8n
- **POST** `/api/n8n/call` - Send call data to n8n
- **POST** `/api/n8n/user-activity` - Send user activity data to n8n
- **POST** `/api/n8n/health` - Send system health data to n8n

## Automatic Integration Points

The system automatically sends data to n8n at these points:

### 1. Conversation Processing
- **When**: Every time a user sends a message and Clara responds
- **Data**: Session ID, user ID, conversation messages
- **Event**: `conversation_processed`

### 2. Call Management
- **When**: Call creation, acceptance, and completion
- **Data**: Call ID, client ID, purpose, status, timestamps
- **Event**: `call_processed`

### 3. User Activities
- **When**: Staff login/logout, user actions
- **Data**: User ID, name, email, role, action type
- **Event**: `user_activity`

### 4. System Health
- **When**: Health check endpoint is called
- **Data**: System status, connected users, waiting calls, database status
- **Event**: `system_health`

## Data Format

All webhook payloads follow this structure:

```json
{
  "event": "event_type",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    // Event-specific data
  },
  "metadata": {
    "source": "clara_ai",
    "version": "3.0",
    "platform": "web"
  }
}
```

## Testing

### Web Interface
Visit: `http://localhost:3000/n8n-test`

This page provides:
- Configuration status
- Connection testing
- Manual webhook triggering
- Sample data testing

### API Testing

Test the connection:
```bash
curl http://localhost:3000/api/n8n/test
```

Get configuration:
```bash
curl http://localhost:3000/api/n8n/config
```

Trigger manual webhook:
```bash
curl -X POST http://localhost:3000/api/n8n/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test_event",
    "data": {"message": "Hello from Clara AI"}
  }'
```

## Error Handling

- **Graceful Degradation**: If n8n is unavailable, the main system continues to function
- **Error Logging**: All n8n errors are logged to console but don't interrupt user experience
- **Retry Logic**: Built-in timeout handling (10 seconds) for webhook calls

## n8n Workflow Examples

### 1. Conversation Analytics
```javascript
// n8n workflow trigger
{
  "event": "conversation_processed",
  "conversation": {
    "sessionId": "abc123",
    "userId": "user456",
    "messages": [...]
  }
}
```

### 2. Call Tracking
```javascript
// n8n workflow trigger
{
  "event": "call_processed",
  "call": {
    "callId": "call789",
    "clientId": "client123",
    "purpose": "General inquiry",
    "status": "completed"
  }
}
```

### 3. System Monitoring
```javascript
// n8n workflow trigger
{
  "event": "system_health",
  "health": {
    "status": "OK",
    "connectedUsers": 5,
    "waitingCalls": 2,
    "databaseStatus": "connected"
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure n8n is running on the configured port
   - Check firewall settings
   - Verify webhook URL is correct

2. **Timeout Errors**
   - Check n8n workflow performance
   - Verify network connectivity
   - Consider increasing timeout in n8nService.js

3. **Authentication Errors**
   - Verify N8N_API_KEY is set correctly
   - Check n8n authentication settings

### Debug Mode

Enable detailed logging by checking console output for:
- `📤 Sending data to n8n webhook: [URL]`
- `📊 Data payload: [JSON]`
- `✅ n8n webhook response: [Status] [Data]`
- `❌ n8n webhook error: [Error]`

## Security Considerations

- **Webhook URLs**: Keep webhook URLs private and secure
- **API Keys**: Use environment variables for sensitive data
- **Rate Limiting**: n8n handles incoming webhook rate limiting
- **Data Validation**: All outgoing data is validated before sending

## Performance

- **Asynchronous Processing**: Webhook calls don't block user interactions
- **Timeout Handling**: 10-second timeout prevents hanging requests
- **Error Isolation**: n8n failures don't affect core system performance

## Future Enhancements

- **Retry Mechanisms**: Implement exponential backoff for failed webhooks
- **Batch Processing**: Group multiple events for bulk processing
- **Webhook Authentication**: Add signature verification for enhanced security
- **Metrics Dashboard**: Real-time webhook success/failure monitoring
