const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/staff-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-login.html'));
});

app.get('/staff-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-dashboard.html'));
});

app.get('/staff-interface', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-interface.html'));
});

app.get('/college-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'college-demo.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Clara AI Reception System (Test Server)',
    port: PORT,
    ssl: false,
    message: 'Server is running successfully'
  });
});

// Test endpoint for external access
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Clara AI Reception System is accessible from external devices!',
    timestamp: new Date().toISOString(),
    server: 'Test Server',
    status: 'Active'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clara AI Test Server running on port ${PORT}`);
  console.log(`📱 Client Interface: http://localhost:${PORT}`);
  console.log(`👥 Staff Login: http://localhost:${PORT}/staff-login`);
  console.log(`📊 Staff Dashboard: http://localhost:${PORT}/staff-dashboard`);
  console.log(`🎓 College Demo: http://localhost:${PORT}/college-demo`);
  console.log(`📋 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
  console.log(`\n🌐 Server is accessible from external devices on your network!`);
  console.log(`📱 Use your computer's IP address to access from mobile/tablet:`);
  console.log(`   Example: http://192.168.1.100:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

