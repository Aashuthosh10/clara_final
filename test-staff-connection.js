/**
 * Test Staff Connection and Video Call Functionality
 * This file demonstrates how the staff connection system works
 */

const io = require('socket.io-client');

class StaffConnectionTest {
    constructor() {
        this.clientSocket = null;
        this.staffSocket = null;
        this.testResults = [];
    }

    async runTests() {
        console.log('🧪 Starting Staff Connection Tests...\n');
        
        try {
            await this.testStaffConnection();
            await this.testVideoCallRequest();
            await this.testCallAcceptance();
            
            this.printResults();
        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            this.cleanup();
        }
    }

    async testStaffConnection() {
        console.log('📞 Test 1: Staff Connection and Login');
        
        // Connect staff socket
        this.staffSocket = io('http://localhost:3000');
        
        return new Promise((resolve) => {
            this.staffSocket.on('connect', () => {
                console.log('✅ Staff connected to server');
                
                // Login as staff member
                this.staffSocket.emit('staff-login', {
                    email: 'bhavyatn@gmail.com',
                    password: 'bhavyatn'
                });
                
                this.staffSocket.on('login-success', (data) => {
                    console.log('✅ Staff login successful:', data.staff.name);
                    this.addResult('Staff Login', true, 'Staff member logged in successfully');
                    resolve();
                });
                
                this.staffSocket.on('login-error', (data) => {
                    console.log('❌ Staff login failed:', data.message);
                    this.addResult('Staff Login', false, data.message);
                    resolve();
                });
            });
        });
    }

    async testVideoCallRequest() {
        console.log('\n🎥 Test 2: Video Call Request');
        
        // Connect client socket
        this.clientSocket = io('http://localhost:3000');
        
        return new Promise((resolve) => {
            this.clientSocket.on('connect', () => {
                console.log('✅ Client connected to server');
                
                // Send video call request
                const videoCallData = {
                    staffName: 'Prof. Bhavya T N',
                    staffEmail: 'bhavyatn@gmail.com',
                    staffDepartment: 'Computer Science Engineering',
                    clientName: 'Test Client',
                    clientSocketId: this.clientSocket.id
                };
                
                console.log('📤 Sending video call request:', videoCallData);
                this.clientSocket.emit('video-call-request', videoCallData);
                
                this.clientSocket.on('video-call-request-sent', (data) => {
                    console.log('✅ Video call request sent:', data.message);
                    this.addResult('Video Call Request', true, 'Request sent successfully');
                    resolve();
                });
                
                this.clientSocket.on('video-call-error', (data) => {
                    console.log('❌ Video call request failed:', data.message);
                    this.addResult('Video Call Request', false, data.message);
                    resolve();
                });
            });
        });
    }

    async testCallAcceptance() {
        console.log('\n✅ Test 3: Call Acceptance');
        
        return new Promise((resolve) => {
            // Listen for video call request on staff side
            this.staffSocket.on('video-call-request', (data) => {
                console.log('🎥 Staff received video call request:', data);
                this.addResult('Call Notification', true, 'Staff received call request');
                
                // Accept the call
                setTimeout(() => {
                    console.log('✅ Staff accepting call...');
                    this.staffSocket.emit('video-call-response', {
                        requestId: data.requestId,
                        staffId: 'BTN',
                        accepted: true
                    });
                    
                    this.addResult('Call Acceptance', true, 'Staff accepted the call');
                    resolve();
                }, 1000);
            });
            
            // Listen for call acceptance on client side
            this.clientSocket.on('video-call-accepted', (data) => {
                console.log('🎉 Client received call acceptance:', data.message);
                this.addResult('Call Confirmation', true, 'Client confirmed call acceptance');
            });
        });
    }

    addResult(testName, success, message) {
        this.testResults.push({
            test: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });
    }

    printResults() {
        console.log('\n📊 Test Results:');
        console.log('================');
        
        this.testResults.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
        });
        
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        
        console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! Staff connection system is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please check the implementation.');
        }
    }

    cleanup() {
        if (this.clientSocket) {
            this.clientSocket.disconnect();
        }
        if (this.staffSocket) {
            this.staffSocket.disconnect();
        }
        console.log('\n🧹 Cleanup completed');
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const test = new StaffConnectionTest();
    test.runTests();
}

module.exports = StaffConnectionTest;
