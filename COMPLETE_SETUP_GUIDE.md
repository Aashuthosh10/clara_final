# 🎓 **Complete Clara AI Reception System Setup Guide**

A comprehensive AI-powered receptionist system for Sai Vidya Institute of Technology with Gemini AI integration, video calling, and automated appointment booking.

## ✨ **System Overview**

The Clara AI Reception System provides:

- **🤖 AI-Powered Receptionist**: Clara uses Gemini AI for intelligent conversations
- **📞 Video Calling**: WebRTC-based video calls between visitors and staff
- **📅 Appointment Booking**: Automated scheduling with QR code generation
- **👨‍🏫 Staff Management**: Complete staff profiles and timetable management
- **🎯 Smart Routing**: Intelligent staff identification and call routing

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v16+)
- MongoDB (v5+)
- Google Gemini AI API key

### **1. Installation**

```bash
# Navigate to the project directory
cd BOIS

# Install dependencies
npm install

# Copy environment template
copy env-template.txt .env
```

### **2. Environment Configuration**

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sai_vidya_db

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=24h

# Gemini AI Configuration (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# Demo Mode Configuration
DEMO_STAFF_EMAIL=staff@demo.com
DEMO_STAFF_PASSWORD=demo123

# Security Configuration
BCRYPT_ROUNDS=12
```

### **3. Database Setup**

```bash
# Start MongoDB (if not already running)
mongod

# Run the setup script to populate with sample data
node setup.js
```

### **4. Start the System**

```bash
# Start the enhanced server with AI features
node server-enhanced.js
```

### **5. Access the System**

| Interface | URL | Description |
|-----------|-----|-------------|
| **Main Reception** | `http://localhost:3000/clara` | Clara AI receptionist interface |
| **Staff Login** | `http://localhost:3000/staff-login` | Staff authentication portal |
| **Staff Dashboard** | `http://localhost:3000/staff-dashboard` | Staff management interface |

## 🔑 **Demo Credentials**

After running the setup script, you can use these demo accounts:

| Staff Member | Email | Password |
|--------------|-------|----------|
| Dr. Smith | `smith@saividya.edu` | `demo123` |
| Prof. Johnson | `johnson@saividya.edu` | `demo123` |
| Dr. Williams | `williams@saividya.edu` | `demo123` |

## 🎯 **Complete Workflow**

### **For Visitors/Parents**

1. **Access Clara**: Visit `http://localhost:3000/clara`
2. **Chat with Clara**: Ask questions about staff, timetables, or general information
3. **Staff Mention**: When you mention a staff member's name, Clara will offer a video call
4. **Video Call**: If you accept, Clara initiates a video call request to the staff
5. **Call Completion**: After the video call ends, staff decides on allowing/rejecting an in-person meeting
6. **Appointment Confirmation**: If approved, Clara generates a QR code with appointment details
7. **QR Code**: Scan the QR code with your mobile device to view appointment details

### **For Staff Members**

1. **Login**: Visit `http://localhost:3000/staff-login` and use demo credentials
2. **Dashboard Access**: Manage your availability and view incoming requests
3. **Video Call Requests**: Receive real-time notifications for incoming video calls
4. **Call Management**: Accept/reject video call requests from visitors
5. **Post-Call Decision**: After video calls, decide whether to allow or reject in-person meetings
6. **Appointment Management**: View and manage all appointments

## 🤖 **Clara AI Features**

### **Intelligent Conversation**
- **Context Awareness**: Understands institute-specific queries
- **Staff Recognition**: Identifies staff members from conversations
- **Intent Detection**: Determines user needs (appointments, calls, info)
- **Gemini Integration**: Leverages Google's AI for natural responses

### **Smart Staff Identification**
```javascript
// Clara AI analyzes messages for staff mentions
const analysis = await claraAI.analyzeMessage("I want to talk to Dr. Smith");
// Returns: { staffNames: [staffObject], intent: 'schedule_call' }
```

### **Response Generation**
```javascript
// Combines staff data with Gemini AI for accurate responses
const response = await claraAI.generateIntelligentResponse(message, analysis, staffData);
```

## 📞 **Video Calling System**

### **Call Flow**
1. **Visitor Request**: User asks Clara to call specific staff
2. **Staff Notification**: Staff receives incoming call request
3. **Call Acceptance**: Staff accepts/rejects the call
4. **WebRTC Connection**: Peer-to-peer video/audio setup
5. **Call Management**: Mute, video toggle, call controls
6. **Call End**: Automatic appointment booking prompt

### **WebRTC Implementation**
```javascript
// Real-time signaling via Socket.IO
socket.on('offer', (data) => {
  // Handle WebRTC offer
  socket.to(data.to).emit('offer', { offer: data.offer, from: socket.id });
});

socket.on('answer', (data) => {
  // Handle WebRTC answer
  socket.to(data.to).emit('answer', { answer: data.answer, from: socket.id });
});
```

## 📅 **Appointment System**

### **Booking Process**
1. **Call Completion**: After video call ends
2. **Staff Decision**: Staff decides to allow/reject in-person meeting
3. **QR Generation**: If approved, unique QR code is generated
4. **Database Storage**: Appointment details saved
5. **Client Notification**: Client receives QR code and appointment details

### **QR Code Features**
- **Unique Identifier**: Each appointment gets unique QR code
- **Mobile Scanning**: Visitors can scan with mobile devices
- **Appointment Details**: Shows staff, time, purpose, and location
- **Digital Record**: Complete appointment history tracking

## 👨‍🏫 **Staff Management**

### **Staff Profiles**
- **Personal Information**: Name, email, department, designation
- **Contact Details**: Phone, office location, working hours
- **Availability Status**: Online/offline, call acceptance
- **Specializations**: Subject expertise and qualifications

### **Timetable Management**
- **Weekly Schedule**: Monday to Saturday scheduling
- **Time Slots**: 9 AM to 5 PM with customizable intervals
- **Activity Types**: Teaching, Office Hours, Meetings, Free time
- **Real-time Updates**: Instant availability changes

### **Dashboard Features**
- **Availability Toggle**: Quick on/off for calls and general availability
- **Call Notifications**: Real-time incoming call alerts
- **Appointment Overview**: Today's and upcoming appointments
- **Statistics**: Call counts, appointment summaries

## 🔌 **API Endpoints**

### **Staff Management**
```http
GET /api/staff                    # Get all staff members
GET /api/staff/:id/timetable     # Get staff timetable
POST /api/staff/:id/timetable    # Update staff timetable
GET /api/staff/:id/appointments  # Get staff appointments
```

### **Conversation History**
```http
GET /api/conversations/:conversationId  # Get chat history
```

### **Health Check**
```http
GET /api/health                  # System status
```

## 🎯 **Use Cases**

### **For Visitors/Parents**
1. **Information Queries**: Ask about staff, departments, schedules
2. **Video Calls**: Connect directly with specific staff members
3. **Appointment Booking**: Schedule in-person meetings
4. **QR Code Access**: Mobile-friendly appointment details

### **For Staff Members**
1. **Profile Management**: Update availability and preferences
2. **Timetable Control**: Manage weekly schedules and activities
3. **Call Handling**: Accept/reject incoming video call requests
4. **Appointment Tracking**: View and manage scheduled meetings

## 🔒 **Security Features**

- **JWT Authentication**: Secure staff login and session management
- **Input Validation**: Comprehensive data validation and sanitization
- **Rate Limiting**: API request throttling to prevent abuse
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Helmet Security**: HTTP security headers and protection

## 📱 **Responsive Design**

- **Mobile-First**: Optimized for mobile devices and tablets
- **Touch-Friendly**: Large buttons and intuitive navigation
- **Cross-Browser**: Compatible with modern web browsers
- **Accessibility**: Screen reader friendly and keyboard navigation

## 🚀 **Deployment Options**

### **Local Development**
```bash
npm run dev          # Development mode with nodemon
npm start           # Production mode
```

### **Cloud Deployment**
- **AWS EC2**: Scalable cloud server
- **Google Cloud**: Managed infrastructure
- **Azure VM**: Microsoft cloud platform
- **Render/Railway**: Easy deployment platforms

### **Environment Variables**
```bash
# Required
MONGODB_URI=mongodb://your-db-connection
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret

# Optional
PORT=3000
NODE_ENV=production
```

## 🧪 **Testing**

### **Demo Mode**
- **Demo Credentials**: Use the provided demo accounts
- **Sample Data**: Pre-populated staff and timetable data
- **Test Calls**: Simulated video call functionality

### **API Testing**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test staff endpoint
curl http://localhost:3000/api/staff
```

## 🔧 **Troubleshooting**

### **Common Issues**
1. **MongoDB Connection**: Check connection string and database status
2. **Gemini API**: Verify API key and quota limits
3. **WebRTC Issues**: Check browser permissions and firewall settings
4. **Socket.IO**: Ensure proper CORS configuration

### **Logs and Debugging**
```bash
# Enable debug logging
DEBUG=socket.io* node server-enhanced.js

# Check MongoDB connection
mongo --eval "db.runCommand('ping')"
```

## 📈 **Future Enhancements**

- **Multi-language Support**: Regional language interfaces
- **Advanced Analytics**: Call quality metrics and staff performance
- **Integration APIs**: Connect with existing institute systems
- **Mobile Apps**: Native iOS and Android applications
- **AI Training**: Custom model training for institute-specific knowledge

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Commit changes**: `git commit -am 'Add new feature'`
4. **Push to branch**: `git push origin feature/new-feature`
5. **Submit pull request**

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 **Support**

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and feature requests
- **Email**: Contact the development team for technical support

---

## 🎉 **Quick Start Summary**

1. **Install Dependencies**: `npm install`
2. **Configure Environment**: Copy and edit `.env` file
3. **Setup Database**: `node setup.js`
4. **Start Server**: `node server-enhanced.js`
5. **Access System**: Open `http://localhost:3000/clara`
6. **Staff Login**: Use `http://localhost:3000/staff-login`

**Welcome to the future of institutional communication! 🚀**
