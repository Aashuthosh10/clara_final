/**
 * Quick Test for Staff Connection System
 * Run this to test if the system works
 */

const io = require('socket.io-client');

console.log('🧪 Quick Test: Staff Connection System\n');

// Test 1: Staff Login
console.log('📞 Test 1: Staff Login');
const staffSocket = io('http://localhost:3000');

staffSocket.on('connect', () => {
    console.log('✅ Staff connected to server');
    
    // Login as staff
    staffSocket.emit('staff-login', {
        email: 'bhavyatn@gmail.com',
        password: 'bhavyatn'
    });
});

staffSocket.on('staff-login-success', (data) => {
    console.log('✅ Staff login successful:', data.staff.name);
    
    // Test 2: Listen for call requests
    console.log('\n🎥 Test 2: Listening for call requests...');
    
    staffSocket.on('incoming-call-request', (data) => {
        console.log('🎉 SUCCESS! Staff received call request:', data);
        console.log('✅ System is working correctly!');
        
        // Accept the call
        setTimeout(() => {
            console.log('✅ Staff accepting call...');
            staffSocket.emit('call-response', {
                callId: data.callId,
                accepted: true
            });
        }, 1000);
    });
    
    staffSocket.on('new-call-request', (data) => {
        console.log('🎉 SUCCESS! Staff received new call request:', data);
        console.log('✅ System is working correctly!');
    });
    
    staffSocket.on('video-call-request', (data) => {
        console.log('🎉 SUCCESS! Staff received video call request:', data);
        console.log('✅ System is working correctly!');
    });
    
    // Test 3: Send test call request using socket.io instead of fetch
    setTimeout(() => {
        console.log('\n📤 Test 3: Sending test call request via socket...');
        
        // Create a client socket to send the call request
        const clientSocket = io('http://localhost:3000');
        
        clientSocket.on('connect', () => {
            console.log('✅ Client connected to server');
            
            // Send video call request via socket
            clientSocket.emit('video-call-request', {
                staffName: 'Prof. Bhavya T N',
                staffEmail: 'bhavyatn@gmail.com',
                staffDepartment: 'Computer Science Engineering',
                clientName: 'Test Client',
                clientSocketId: clientSocket.id
            });
            
            console.log('📤 Video call request sent via socket');
        });
        
        clientSocket.on('video-call-request-sent', (data) => {
            console.log('✅ Call request sent successfully:', data.message);
        });
        
        clientSocket.on('video-call-error', (data) => {
            console.log('❌ Call request failed:', data.message);
        });
        
        // Cleanup client socket after 5 seconds
        setTimeout(() => {
            clientSocket.disconnect();
        }, 5000);
    }, 2000);
});

staffSocket.on('login-error', (data) => {
    console.log('❌ Staff login failed:', data.message);
});

// Cleanup after 15 seconds
setTimeout(() => {
    console.log('\n🧹 Cleaning up...');
    staffSocket.disconnect();
    process.exit(0);
}, 15000);
