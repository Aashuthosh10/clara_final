# 🎥 Video Call System - Clara AI Reception

A comprehensive WebRTC-based video calling system integrated with the Clara AI Reception platform, featuring explicit staff selection, persistent signaling server, and real-time communication.

## ✨ Features

### 🔐 **Explicit Staff Selection**
- Clients must explicitly choose a staff member by ID/email/name
- No auto-picking of available staff
- Clear visibility of available staff members
- Staff availability status tracking

### 🌐 **Persistent Shared Server**
- Node.js + Express + Socket.IO backend
- In-memory state management (easily replaceable with Redis/DB)
- Supports multiple concurrent client-staff calls
- Handles reconnection after page refresh

### 📹 **WebRTC Video Calling**
- Peer-to-peer video/audio streaming
- Server handles only signaling (offers, answers, ICE candidates)
- STUN servers for NAT traversal
- Mute/unmute and video on/off controls

### 🚀 **Real-time Communication**
- Live staff availability updates
- Instant call notifications
- Real-time call status updates
- Seamless call management

## 🏗️ Architecture

### **Backend Components**
```
server.js
├── Socket.IO server for real-time communication
├── WebRTC signaling server
├── Staff session management
├── Call state management
└── In-memory storage (MongoDB fallback)
```

### **Frontend Interfaces**
```
public/
├── video-call-client.html     # Client interface
├── video-call-staff.html      # Staff interface
└── socket.io client library
```

### **Data Flow**
```
Client → Select Staff → Start Call → WebRTC Signaling → Video Call
  ↓           ↓           ↓              ↓              ↓
Socket.IO → Server → Staff Notification → Accept → Media Stream
```

## 🚀 Getting Started

### **1. Install Dependencies**
```bash
npm install
```

### **2. Environment Configuration**
Create a `.env` file with:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/clara_db
JWT_SECRET=your_jwt_secret
DEMO_STAFF_EMAIL=staff@demo.com
DEMO_STAFF_PASSWORD=demo123
```

### **3. Start the Server**
```bash
npm start
# or for development
npm run dev
```

### **4. Access Interfaces**
- **Client Interface**: http://localhost:3000/video-call
- **Staff Interface**: http://localhost:3000/video-staff
- **Main System**: http://localhost:3000

## 📱 Usage Guide

### **For Clients**

1. **Access the Interface**
   - Navigate to `/video-call`
   - Fill in your name, email, and call purpose

2. **Select Staff Member**
   - View available staff members
   - Click to select your preferred staff member
   - Staff availability is shown in real-time

3. **Start Video Call**
   - Click "Start Video Call"
   - Grant camera/microphone permissions
   - Wait for staff to accept

4. **During Call**
   - Use mute/unmute controls
   - Toggle video on/off
   - End call when finished

### **For Staff Members**

1. **Login**
   - Navigate to `/video-staff`
   - Login with your credentials
   - View your status and waiting calls

2. **Receive Calls**
   - See incoming call requests in real-time
   - View client name, purpose, and timestamp
   - Accept calls you're assigned to

3. **Manage Calls**
   - Handle multiple call requests
   - Start video calls with clients
   - Use call controls (mute, video, hangup)

## 🔧 Technical Implementation

### **WebRTC Signaling Flow**

```javascript
// 1. Client creates offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
socket.emit('offer', { offer, callId });

// 2. Server forwards offer to staff
io.to(staffSocketId).emit('offer', { offer, from: clientId, callId });

// 3. Staff creates answer
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);
socket.emit('answer', { answer, callId });

// 4. Server forwards answer to client
io.to(clientSocketId).emit('answer', { answer, from: staffId, callId });

// 5. ICE candidates exchanged
socket.emit('ice-candidate', { candidate, callId });
```

### **State Management**

```javascript
// In-memory storage for real-time state
const connectedUsers = new Map();        // socketId -> user
const waitingCalls = new Map();          // socketId -> call
const activeCalls = new Map();           // callId -> call session
const staffSessions = new Map();         // staffId -> socketId
const clientSessions = new Map();        // clientId -> socketId
```

### **Call Session Validation**

```javascript
// Validate call session before signaling
const callSession = activeCalls.get(callId);
if (!callSession) {
    socket.emit('signaling-error', { message: 'Invalid call session' });
    return;
}

// Verify sender is part of the call
if (socket.id !== callSession.clientSocketId && 
    socket.id !== callSession.staffSocketId) {
    socket.emit('signaling-error', { message: 'Unauthorized signaling attempt' });
    return;
}
```

## 🔒 Security Features

### **Authentication & Authorization**
- JWT-based staff authentication
- Role-based access control
- Session validation for all operations

### **Call Security**
- Call session validation
- Participant verification
- Unauthorized signaling prevention

### **Data Protection**
- No sensitive data in client-side storage
- Secure WebRTC connections
- Input validation and sanitization

## 📊 Monitoring & Debugging

### **Server Logs**
```bash
# Real-time connection monitoring
User connected: socket_id_123
Staff login successful: staff_name
New call request: call_id_456
Call accepted: call_id_456
Call ended: call_id_456
```

### **Client Console**
```javascript
// Enable debug logging
socket.on('connect', () => console.log('Connected to server'));
socket.on('offer', (data) => console.log('Received offer:', data));
socket.on('answer', (data) => console.log('Received answer:', data));
```

### **Health Check Endpoint**
```bash
GET /api/health
{
  "status": "OK",
  "connectedUsers": 5,
  "waitingCalls": 2,
  "activeCalls": 1,
  "databaseStatus": "connected"
}
```

## 🚀 Deployment Options

### **1. Cloud Deployment (Recommended)**
```bash
# AWS EC2
sudo apt update
sudo apt install nodejs npm
npm install -g pm2
pm2 start server.js

# Google Cloud Run
gcloud run deploy video-call-server --source .

# Railway
railway up
```

### **2. Local Development with Public Access**
```bash
# Using ngrok
npm start
ngrok http 3000

# Using localtunnel
npm start
npx localtunnel --port 3000

# Using cloudflared
npm start
cloudflared tunnel --url http://localhost:3000
```

### **3. Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration Options

### **WebRTC Configuration**
```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN servers for production
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
  ]
};
```

### **Socket.IO Configuration**
```javascript
const io = socketIo(server, {
  cors: {
    origin: "*", // Configure for production
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});
```

### **Rate Limiting**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Camera/Microphone Access Denied**
   - Check browser permissions
   - Ensure HTTPS in production
   - Test with different browsers

2. **WebRTC Connection Failed**
   - Check STUN server availability
   - Verify firewall settings
   - Test network connectivity

3. **Call Not Connecting**
   - Check server logs
   - Verify Socket.IO connection
   - Check call session state

4. **Video Quality Issues**
   - Adjust video constraints
   - Check network bandwidth
   - Monitor WebRTC stats

### **Debug Commands**
```bash
# Check server status
curl http://localhost:3000/api/health

# Monitor Socket.IO connections
# Check browser console for connection logs

# Test WebRTC connectivity
# Use browser WebRTC internals (chrome://webrtc-internals/)
```

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Screen sharing capability
- [ ] Recording functionality
- [ ] Chat during calls
- [ ] Call analytics and reporting
- [ ] Mobile app support
- [ ] Advanced video filters

### **Scalability Improvements**
- [ ] Redis integration for state management
- [ ] Load balancing support
- [ ] Microservices architecture
- [ ] CDN integration for static assets

### **Security Enhancements**
- [ ] End-to-end encryption
- [ ] Two-factor authentication
- [ ] Audit logging
- [ ] GDPR compliance tools

## 📚 API Reference

### **Socket.IO Events**

#### **Client Events**
- `start-conversation`: Start a new call with selected staff
- `offer`: Send WebRTC offer
- `answer`: Send WebRTC answer
- `ice-candidate`: Send ICE candidate
- `end-call`: End active call

#### **Staff Events**
- `staff-login`: Authenticate staff member
- `accept-call`: Accept incoming call
- `offer`: Send WebRTC offer
- `answer`: Send WebRTC answer
- `ice-candidate`: Send ICE candidate
- `end-call`: End active call

#### **Server Events**
- `login-success`: Staff authentication successful
- `login-error`: Staff authentication failed
- `new-call-request`: New call request notification
- `call-accepted`: Call accepted notification
- `call-ended`: Call ended notification
- `staff-list-updated`: Available staff list update

### **REST API Endpoints**

#### **Authentication**
```http
POST /api/auth/login
POST /api/auth/register
```

#### **Call Management**
```http
GET /api/calls/waiting
GET /api/calls/my-calls
```

#### **Staff Management**
```http
GET /api/staff/available
```

#### **System Health**
```http
GET /api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Test with the demo interfaces

---

**Built with ❤️ using Node.js, Express, Socket.IO, and WebRTC**
