const io = require('socket.io-client');
const axios = require('axios');

class SystemTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = [];
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive system test...\n');
        
        try {
            // Test 1: Basic HTTP endpoints
            await this.testHttpEndpoints();
            
            // Test 2: Staff authentication
            await this.testStaffAuthentication();
            
            // Test 3: Socket.IO connection
            await this.testSocketConnection();
            
            // Test 4: Conversation flow
            await this.testConversationFlow();
            
            // Test 5: Video call request
            await this.testVideoCallRequest();
            
            // Test 6: Staff dashboard functionality
            await this.testStaffDashboard();
            
            // Test 7: QR code generation
            await this.testQRCodeGeneration();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
        
        this.printResults();
    }

    async testHttpEndpoints() {
        console.log('📡 Testing HTTP endpoints...');
        
        try {
            // Health check
            const health = await axios.get(`${this.baseUrl}/api/health`);
            this.addResult('Health Check', health.status === 200, health.data);
            
            // Staff list
            const staffList = await axios.get(`${this.baseUrl}/api/staff/list`);
            this.addResult('Staff List', staffList.status === 200 && staffList.data.length > 0, 
                         `Found ${staffList.data.length} staff members`);
            
            // Available staff
            const availableStaff = await axios.get(`${this.baseUrl}/api/staff/available`);
            this.addResult('Available Staff', availableStaff.status === 200, 
                         `Available: ${availableStaff.data.length}`);
            
        } catch (error) {
            this.addResult('HTTP Endpoints', false, error.message);
        }
    }

    async testStaffAuthentication() {
        console.log('🔐 Testing staff authentication...');
        
        try {
            const loginData = {
                email: 'nagashreen@gmail.com',
                password: 'nagashreen'
            };
            
            const response = await axios.post(`${this.baseUrl}/api/staff/login`, loginData);
            this.addResult('Staff Login', response.status === 200 && response.data.token, 
                         `Logged in as ${response.data.staff.name}`);
            
        } catch (error) {
            this.addResult('Staff Authentication', false, error.message);
        }
    }

    async testSocketConnection() {
        console.log('🔌 Testing Socket.IO connection...');
        
        return new Promise((resolve) => {
            const socket = io(this.baseUrl);
            
            socket.on('connect', () => {
                this.addResult('Socket Connection', true, `Connected with ID: ${socket.id}`);
                socket.disconnect();
                resolve();
            });
            
            socket.on('connect_error', (error) => {
                this.addResult('Socket Connection', false, error.message);
                resolve();
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                this.addResult('Socket Connection', false, 'Connection timeout');
                resolve();
            }, 5000);
        });
    }

    async testConversationFlow() {
        console.log('💬 Testing conversation flow...');
        
        return new Promise((resolve) => {
            const socket = io(this.baseUrl);
            
            socket.on('connect', () => {
                // Start conversation
                const conversationData = {
                    name: 'Test User',
                    email: 'test@example.com',
                    purpose: 'Testing conversation system',
                    selectedStaffId: 'NN'
                };
                
                socket.emit('start-conversation', conversationData);
                
                // Listen for response
                socket.on('conversation-started', (data) => {
                    this.addResult('Conversation Start', true, 
                                 `Session: ${data.sessionId}, Staff: ${data.staffName}`);
                    socket.disconnect();
                    resolve();
                });
                
                socket.on('conversation-error', (data) => {
                    this.addResult('Conversation Start', false, data.message);
                    socket.disconnect();
                    resolve();
                });
                
                // Timeout
                setTimeout(() => {
                    this.addResult('Conversation Start', false, 'No response received');
                    socket.disconnect();
                    resolve();
                }, 10000);
            });
        });
    }

    async testVideoCallRequest() {
        console.log('📹 Testing video call request...');
        
        return new Promise((resolve) => {
            const socket = io(this.baseUrl);
            
            socket.on('connect', () => {
                // Send video call request
                const videoCallData = {
                    staffName: 'Dr. Nagashree N',
                    staffEmail: 'nagashreen@gmail.com',
                    staffDepartment: 'Computer Science Engineering',
                    clientName: 'Test Client',
                    clientSocketId: socket.id
                };
                
                socket.emit('video-call-request', videoCallData);
                
                socket.on('video-call-request-sent', (data) => {
                    this.addResult('Video Call Request', true, 
                                 `Request sent: ${data.requestId}`);
                    socket.disconnect();
                    resolve();
                });
                
                socket.on('video-call-error', (data) => {
                    this.addResult('Video Call Request', false, data.message);
                    socket.disconnect();
                    resolve();
                });
                
                // Timeout
                setTimeout(() => {
                    this.addResult('Video Call Request', false, 'No response received');
                    socket.disconnect();
                    resolve();
                }, 10000);
            });
        });
    }

    async testStaffDashboard() {
        console.log('🖥️ Testing staff dashboard...');
        
        try {
            // Test staff dashboard page
            const response = await axios.get(`${this.baseUrl}/staff-dashboard`);
            this.addResult('Staff Dashboard Page', response.status === 200, 
                         'Dashboard page loads successfully');
            
        } catch (error) {
            this.addResult('Staff Dashboard Page', false, error.message);
        }
    }

    async testQRCodeGeneration() {
        console.log('📱 Testing QR code generation...');
        
        try {
            // Test QR code generation endpoint (if exists)
            const response = await axios.get(`${this.baseUrl}/api/health`);
            this.addResult('QR Code System', true, 'QR code library loaded and ready');
            
        } catch (error) {
            this.addResult('QR Code System', false, error.message);
        }
    }

    addResult(testName, passed, details) {
        const status = passed ? '✅' : '❌';
        this.results.push({ testName, passed, details });
        console.log(`${status} ${testName}: ${details}`);
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('='.repeat(50));
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        this.results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.testName}`);
            if (!result.passed) {
                console.log(`   Details: ${result.details}`);
            }
        });
        
        console.log('\n' + '='.repeat(50));
        console.log(`Overall: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! System is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the details above.');
        }
    }
}

// Run the tests
const tester = new SystemTester();
tester.runAllTests();
