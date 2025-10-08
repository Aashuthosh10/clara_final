const io = require('socket.io-client');

// Test the conversation system
async function testConversation() {
    console.log('🧪 Testing Clara AI Conversation System...\n');

    // Connect to the server
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('✅ Connected to server');
        
        // Test staff availability
        testStaffAvailability();
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });

    socket.on('conversation-started', (data) => {
        console.log('✅ Conversation started successfully:', data);
        socket.disconnect();
    });

    socket.on('conversation-error', (data) => {
        console.log('❌ Conversation error:', data.message);
        socket.disconnect();
    });

    async function testStaffAvailability() {
        try {
            console.log('📋 Testing staff availability...');
            const response = await fetch('http://localhost:3000/api/staff/available');
            const staff = await response.json();
            
            if (staff.length > 0) {
                console.log(`✅ Found ${staff.length} available staff members:`);
                staff.forEach(member => {
                    console.log(`   - ${member.name} (${member.department})`);
                });
                
                // Test starting a conversation
                console.log('\n🚀 Testing conversation start...');
                socket.emit('start-conversation', {
                    name: 'Test User',
                    email: 'test@example.com',
                    purpose: 'Testing conversation system',
                    selectedStaffId: staff[0]._id || staff[0].id
                });
            } else {
                console.log('❌ No staff members available');
                socket.disconnect();
            }
        } catch (error) {
            console.log('❌ Error testing staff availability:', error.message);
            socket.disconnect();
        }
    }

    // Timeout after 10 seconds
    setTimeout(() => {
        console.log('⏰ Test timeout - server may not be running');
        socket.disconnect();
        process.exit(1);
    }, 10000);
}

// Run the test
testConversation().catch(console.error);
