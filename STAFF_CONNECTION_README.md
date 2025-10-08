# Staff Connection System - Video Call Integration

## Overview

This system provides seamless integration between the client interface and staff interfaces for video call requests. When a client selects a staff member during conversation start, the system automatically triggers a video call request to the respective staff interface, creating a professional connection flow.

## How It Works

### 1. Client Interface (index.html)

**Staff Selection Process:**
- Client fills out the conversation start form
- Selects a staff member from the dropdown
- System automatically triggers video call request after conversation starts

**Key Features:**
- Automatic video call request generation
- Real-time status updates
- Professional UI with staff member information
- Seamless integration with Clara AI

### 2. Staff Interface (staff-interface.html)

**Call Management:**
- Receives video call requests in real-time
- Professional call notification system
- Accept/Reject functionality
- Enhanced video call interface

**Key Features:**
- Different notification styles for regular vs video calls
- Professional video call controls
- Real-time call status updates
- Responsive design

### 3. Server Integration (server.js)

**Event Handling:**
- Manages video call requests
- Routes calls to appropriate staff members
- Handles call acceptance/rejection
- Maintains call state

## Staff Members Available

| Staff ID | Name | Email | Department |
|----------|------|-------|------------|
| BTN | Prof. Bhavya T N | bhavyatn@gmail.com | Computer Science Engineering |
| LDN | Prof. Lakshmi Durga N | lakshmidurgan@gmail.com | Computer Science Engineering |
| ACS | Prof. Anitha C S | anithacs@gmail.com | Computer Science Engineering |
| GD | Dr. G Dhivyasri | gdhivyasri@gmail.com | Computer Science Engineering |
| NSK | Prof. Nisha S K | nishask@gmail.com | Computer Science Engineering |
| ABP | Prof. Amarnath B Patil | amarnathbpatil@gmail.com | Computer Science Engineering |
| NN | Dr. Nagashree N | nagashreen@gmail.com | Computer Science Engineering |
| AKV | Prof. Anil Kumar K V | anilkumarkv@gmail.com | Computer Science Engineering |
| JK | Prof. Jyoti Kumari | jyotikumari@gmail.com | Computer Science Engineering |
| VR | Prof. Vidyashree R | vidyashreer@gmail.com | Computer Science Engineering |
| BA | Dr. Bhavana A | bhavanaa@gmail.com | Computer Science Engineering |

## Workflow

### 1. Client Initiates Conversation
```
Client → Fills form → Selects staff → Starts conversation
```

### 2. Automatic Video Call Request
```
System → Triggers video call request → Sends to staff interface
```

### 3. Staff Receives Notification
```
Staff interface → Shows call notification → Accept/Reject options
```

### 4. Call Connection
```
If accepted → Video call interface opens → WebRTC connection established
If rejected → Client notified → Clara AI continues conversation
```

## Technical Implementation

### Event Flow

1. **Client Side Events:**
   - `start-conversation` - Initiates conversation with staff
   - `video-call-request` - Sends video call request
   - `video-call-accepted` - Receives call acceptance
   - `video-call-rejected` - Receives call rejection

2. **Staff Side Events:**
   - `video-call-request` - Receives incoming call request
   - `video-call-response` - Sends accept/reject response
   - `call-started` - Call connection established

3. **Server Events:**
   - Routes video call requests to appropriate staff
   - Manages call state and WebRTC signaling
   - Handles offline staff queuing

### Key Functions

#### Client Interface (script.js)
```javascript
// Trigger video call request automatically
triggerVideoCallRequest(data) {
    // Maps staff ID to profile information
    // Sends video call request to server
    // Updates UI with status
}

// Handle conversation start
handleConversationSubmit(e) {
    // Collects form data
    // Starts conversation
    // Automatically triggers video call request
}
```

#### Staff Interface (staff-interface.html)
```javascript
// Show video call request notification
showVideoCallRequest(callData) {
    // Displays professional call notification
    // Different styling for video calls
    // Ringing animation
}

// Accept video call
acceptCall() {
    // Sends acceptance response
    // Opens video call interface
    // Establishes WebRTC connection
}
```

## Professional Features

### 1. Enhanced UI/UX
- **Gradient backgrounds** for different call types
- **Smooth animations** and transitions
- **Professional color schemes**
- **Responsive design** for all devices

### 2. Call Management
- **Real-time notifications** with sound/visual cues
- **Call queuing** for offline staff
- **Professional call controls** (mute, video, screen share)
- **Call history** and status tracking

### 3. Integration Features
- **Seamless Clara AI integration**
- **Automatic staff mapping**
- **Error handling** and recovery
- **Connection status monitoring**

## Testing

Run the test suite to verify functionality:

```bash
node test-staff-connection.js
```

This will test:
- Staff login and connection
- Video call request sending
- Call acceptance flow
- Error handling

## Usage Instructions

### For Clients:
1. Open the main interface (index.html)
2. Fill out the conversation form
3. Select a staff member from the dropdown
4. Submit the form
5. System automatically requests video call
6. Wait for staff response

### For Staff:
1. Open staff interface (staff-interface.html)
2. Login with credentials
3. Receive call notifications
4. Accept/reject calls
5. Use video call interface for communication

## Configuration

### Staff Credentials
Staff credentials are stored in `staff-profiles.js`:
```javascript
{
    name: "Prof. Bhavya T N",
    email: "bhavyatn@gmail.com",
    password: "bhavyatn",
    department: "Computer Science Engineering",
    shortName: "BTN",
    subjects: ["National Service Scheme (NSS)"]
}
```

### Server Configuration
The server handles:
- Socket.IO connections
- Video call routing
- Staff session management
- Call state persistence

## Troubleshooting

### Common Issues:

1. **Staff not receiving calls:**
   - Check if staff is logged in
   - Verify staff ID mapping
   - Check server connection

2. **Video call not starting:**
   - Ensure WebRTC is supported
   - Check camera/microphone permissions
   - Verify call acceptance flow

3. **Connection issues:**
   - Check server status
   - Verify Socket.IO connection
   - Check network connectivity

## Future Enhancements

1. **Advanced Video Features:**
   - Screen sharing
   - Recording capabilities
   - Virtual backgrounds

2. **Enhanced Integration:**
   - Calendar integration
   - Appointment scheduling
   - File sharing

3. **Analytics:**
   - Call duration tracking
   - Staff availability metrics
   - Client satisfaction surveys

## Support

For technical support or questions about the staff connection system, please refer to the main documentation or contact the development team.
