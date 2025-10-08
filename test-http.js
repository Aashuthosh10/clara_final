/**
 * HTTP Test for Staff Call Request API
 * Uses built-in http module (no external dependencies)
 */

const http = require('http');

console.log('🧪 HTTP Test: Staff Call Request API\n');

// Test data
const testData = JSON.stringify({
    staffId: 'BTN',
    clientName: 'HTTP Test Client',
    purpose: 'Testing HTTP API endpoint',
    clientSocketId: 'http-test-socket-id'
});

// HTTP request options
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/staff/call-request',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    }
};

console.log('📤 Sending HTTP POST request to /api/staff/call-request...');

// Make the HTTP request
const req = http.request(options, (res) => {
    console.log(`📥 Response Status: ${res.statusCode}`);
    console.log(`📥 Response Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('✅ API Response:', result);
            
            if (result.success) {
                console.log('🎉 SUCCESS! API endpoint is working correctly!');
            } else {
                console.log('❌ API returned error:', result.error);
            }
        } catch (error) {
            console.log('❌ Failed to parse JSON response:', error);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ HTTP Request Error:', error.message);
});

// Send the request data
req.write(testData);
req.end();

console.log('⏳ Waiting for response...');
