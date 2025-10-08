const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Staff = require('./models/Staff');
const StaffTimetable = require('./models/StaffTimetable');
const Appointment = require('./models/Appointment');
const Conversation = require('./models/Conversation');
const Call = require('./models/Call');

// Import services
const ClaraAI = require('./services/claraAI');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sai_vidya_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Enhanced in-memory storage for WebRTC calls and staff management
const connectedUsers = new Map(); // socketId -> user
const waitingCalls = new Map(); // socketId -> call
const activeCalls = new Map(); // callId -> call session
const staffSessions = new Map(); // staffId -> socketId
const clientSessions = new Map(); // socketId -> client session

// Initialize Clara AI
const claraAI = new ClaraAI();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Staff login and dashboard access
  socket.on('staff-login', async (data) => {
    try {
      const { email, password } = data;
      const staff = await Staff.findOne({ email });
      
      if (!staff || !(await bcrypt.compare(password, staff.password))) {
        socket.emit('login-error', { message: 'Invalid credentials' });
        return;
      }

      // Update staff online status
      staff.isOnline = true;
      staff.lastActive = new Date();
      await staff.save();

      // Store staff session
      staffSessions.set(staff._id.toString(), socket.id);
      connectedUsers.set(socket.id, {
        type: 'staff',
        id: staff._id,
        name: staff.name,
        email: staff.email,
        department: staff.department
      });

      socket.emit('staff-login-success', {
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          designation: staff.designation
        }
      });

      console.log(`👨‍🏫 Staff logged in: ${staff.name}`);
    } catch (error) {
      console.error('Staff login error:', error);
      socket.emit('login-error', { message: 'Login failed' });
    }
  });

  // Client chat with Clara AI
  socket.on('chat-message', async (data) => {
    try {
      const { message, conversationId } = data;
      
      // Process message with Clara AI
      const response = await claraAI.processQuery(message, conversationId);
      
      // Send response back to client
      socket.emit('clara-response', response);
      
      // If there's a call offer, handle it
      if (response.callOffer && response.callOffer.canCall) {
        const staffId = response.staffInfo._id.toString();
        const staffSocketId = staffSessions.get(staffId);
        
        if (staffSocketId) {
          // Notify staff about incoming call request
          io.to(staffSocketId).emit('incoming-call-request', {
            callId: uuidv4(),
            clientName: 'Visitor',
            purpose: response.callOffer.purpose,
            staffName: response.staffInfo.name
          });
        }
      }
      
      // Store conversation
      await Conversation.create({
        conversationId,
        message,
        response: response.response,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('clara-response', {
        response: "I'm experiencing some technical difficulties. Please try again."
      });
    }
  });

  // Staff accepts call request
  socket.on('accept-call-request', async (data) => {
    try {
      const { callId, clientName, purpose } = data;
      const staff = connectedUsers.get(socket.id);
      
      if (!staff || staff.type !== 'staff') return;
      
      // Create call session
      const callSession = {
        callId,
        staffId: staff.id,
        staffName: staff.name,
        clientName,
        purpose,
        startTime: new Date(),
        status: 'active'
      };
      
      activeCalls.set(callId, callSession);
      
      // Notify client that call is accepted
      socket.broadcast.emit('call-accepted', {
        callId,
        staffName: staff.name,
        staffDepartment: staff.department
      });
      
      console.log(`📞 Call accepted: ${staff.name} - ${clientName}`);
      
    } catch (error) {
      console.error('Accept call error:', error);
    }
  });

  // Staff rejects call request
  socket.on('reject-call-request', (data) => {
    const { callId, reason } = data;
    const staff = connectedUsers.get(socket.id);
    
    if (!staff || staff.type !== 'staff') return;
    
    // Notify client that call was rejected
    socket.broadcast.emit('call-rejected', {
      callId,
      reason: reason || 'Call rejected by staff',
      staffName: staff.name
    });
    
    console.log(`❌ Call rejected: ${staff.name} - ${reason}`);
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    const { offer, callId, to } = data;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      socket.to(to).emit('offer', { offer, from: socket.id, callId });
    }
  });

  socket.on('answer', (data) => {
    const { answer, callId, to } = data;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      socket.to(to).emit('answer', { answer, from: socket.id, callId });
    }
  });

  socket.on('ice-candidate', (data) => {
    const { candidate, callId, to } = data;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id, callId });
    }
  });

  // End call
  socket.on('end-call', async (data) => {
    const { callId, reason } = data;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      // Update call status
      callSession.status = 'ended';
      callSession.endTime = new Date();
      callSession.duration = callSession.endTime - callSession.startTime;
      
      // Create temporary appointment for staff decision
      try {
        const appointment = new Appointment({
          appointmentId: `TEMP${Date.now()}`,
          staffId: callSession.staffId,
          clientId: callSession.clientId || new mongoose.Types.ObjectId(),
          clientName: callSession.clientName || 'Video Call Visitor',
          clientEmail: 'visitor@example.com',
          purpose: callSession.purpose || 'Video call follow-up',
          appointmentDate: new Date(),
          appointmentTime: {
            start: '09:00',
            end: '09:30'
          },
          duration: 30,
          status: 'Pending',
          appointmentType: 'In-Person',
          videoCallDetails: {
            callId: callId,
            startTime: callSession.startTime,
            endTime: callSession.endTime,
            duration: callSession.duration
          }
        });
        
        await appointment.save();
        
        // Notify staff about pending appointment decision
        const staffSocketId = staffSessions.get(callSession.staffId);
        if (staffSocketId) {
          io.to(staffSocketId).emit('pending_appointment_decision', {
            appointment: appointment.toObject(),
            callDuration: callSession.duration
          });
        }
        
        console.log(`📅 Temporary appointment created for decision: ${appointment._id}`);
        
      } catch (error) {
        console.error('Error creating temporary appointment:', error);
      }
      
      // Notify all participants
      io.emit('call-ended', {
        callId,
        reason: reason || 'Call ended',
        duration: callSession.duration
      });
      
      // Remove from active calls
      activeCalls.delete(callId);
      
      console.log(`📞 Call ended: ${callSession.staffName} - ${callSession.clientName}`);
    }
  });

  // Book appointment
  socket.on('book-appointment', async (data) => {
    try {
      const { staffId, date, time, purpose, qrCodeData } = data;
      
      // Create appointment
      const appointment = new Appointment({
        appointmentId: `APT${Date.now()}`,
        staffId,
        clientName: 'Visitor',
        clientEmail: 'visitor@example.com',
        purpose,
        appointmentDate: new Date(date),
        appointmentTime: {
          start: time,
          end: calculateEndTime(time, 30) // 30 minutes default
        },
        duration: 30,
        status: 'Confirmed',
        qrCode: {
          data: qrCodeData,
          generatedAt: new Date()
        }
      });
      
      await appointment.save();
      
      // Notify staff about new appointment
      const staffSocketId = staffSessions.get(staffId);
      if (staffSocketId) {
        io.to(staffSocketId).emit('new-appointment', {
          appointment: appointment.toObject()
        });
      }
      
      console.log(`📅 Appointment booked: ${staffId} - ${date} ${time}`);
      
    } catch (error) {
      console.error('Book appointment error:', error);
      socket.emit('appointment-error', { message: 'Failed to book appointment' });
    }
  });

  // Staff sets availability
  socket.on('set-availability', async (data) => {
    try {
      const { isAvailable, isAvailableForCalls } = data;
      const staff = connectedUsers.get(socket.id);
      
      if (!staff || staff.type !== 'staff') return;
      
      // Update staff availability
      await Staff.findByIdAndUpdate(staff.id, {
        isAvailable,
        isAvailableForCalls,
        lastActive: new Date()
      });
      
      console.log(`🔄 Staff availability updated: ${staff.name} - Available: ${isAvailable}`);
      
    } catch (error) {
      console.error('Set availability error:', error);
    }
  });

  // Handle appointment decision (approve/reject)
  socket.on('appointment_decision', async (data) => {
    try {
      const { appointmentId, staffId, approved } = data;
      const staff = connectedUsers.get(socket.id);
      
      if (!staff || staff.type !== 'staff') {
        socket.emit('appointment_decision_error', { message: 'Unauthorized' });
        return;
      }
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        socket.emit('appointment_decision_error', { message: 'Appointment not found' });
        return;
      }
      
      // Update appointment status
      appointment.status = approved ? 'Confirmed' : 'Cancelled';
      appointment.staffNotes = approved ? 'Appointment approved after video call' : 'Appointment rejected after video call';
      
      if (!approved) {
        appointment.cancellationReason = 'Rejected by staff after video call';
        appointment.cancelledBy = 'Staff';
        appointment.cancelledAt = new Date();
      }
      
      await appointment.save();
      
      // Notify client about the decision
      const clientSocketId = clientSessions.get(appointment.clientId);
      if (clientSocketId) {
        io.to(clientSocketId).emit('appointment_decision', {
          appointmentId: appointmentId,
          approved: approved,
          message: approved ? 
            `Appointment approved! QR code will be generated.` : 
            `Appointment rejected. Please contact us for alternative arrangements.`
        });
      }
      
      // If approved, generate QR code and send to client
      if (approved) {
        const qrData = {
          appointmentId: appointment.appointmentId,
          staffName: staff.name,
          date: appointment.appointmentDate.toDateString(),
          time: `${appointment.appointmentTime.start} - ${appointment.appointmentTime.end}`,
          purpose: appointment.purpose,
          location: appointment.location || 'Office'
        };
        
        const qrCodeData = JSON.stringify(qrData);
        
        // Update appointment with QR code
        appointment.qrCode = {
          data: qrCodeData,
          generatedAt: new Date()
        };
        await appointment.save();
        
        // Send QR code to client
        if (clientSocketId) {
          io.to(clientSocketId).emit('qr_code_generated', {
            appointmentId: appointmentId,
            qrCodeData: qrCodeData,
            appointmentDetails: qrData
          });
        }
      }
      
      console.log(`📅 Appointment ${approved ? 'approved' : 'rejected'}: ${appointmentId} by ${staff.name}`);
      
    } catch (error) {
      console.error('Appointment decision error:', error);
      socket.emit('appointment_decision_error', { message: 'Failed to process appointment decision' });
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      if (user.type === 'staff') {
        // Update staff offline status
        await Staff.findByIdAndUpdate(user.id, {
          isOnline: false,
          lastActive: new Date()
        });
        
        // Remove from staff sessions
        staffSessions.delete(user.id);
        console.log(`👨‍🏫 Staff went offline: ${user.name}`);
      }
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
    }
    
    console.log(`🔌 Disconnected: ${socket.id}`);
  });
});

// Helper function to calculate end time
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes + durationMinutes, 0, 0);
  
  return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/client-interface.html');
});

// Staff interface
app.get('/staff', (req, res) => {
  res.sendFile(__dirname + '/public/staff-interface.html');
});

// Legacy routes for backward compatibility
app.get('/clara', (req, res) => {
  res.sendFile(__dirname + '/public/client-interface.html');
});

app.get('/staff-dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/staff-interface.html');
});

app.get('/staff-login', (req, res) => {
  res.sendFile(__dirname + '/public/staff-interface.html');
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all staff members
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true }).select('name department designation office phone isAvailable isOnline');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get staff timetable
app.get('/api/staff/:staffId/timetable', async (req, res) => {
  try {
    const timetable = await StaffTimetable.findOne({ 
      staffId: req.params.staffId, 
      isActive: true 
    });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Get staff appointments
app.get('/api/staff/:staffId/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      staffId: req.params.staffId 
    }).sort({ appointmentDate: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update staff timetable
app.post('/api/staff/:staffId/timetable', async (req, res) => {
  try {
    const { entries, academicYear, semester, day, timeSlot, activity, subject, room } = req.body;

    const year = academicYear || '2024-25';
    const sem = semester || '1st Semester';

    let timetable = await StaffTimetable.findOne({ 
      staffId: req.params.staffId, 
      academicYear: year, 
      semester: sem 
    });

    if (!timetable) {
      timetable = new StaffTimetable({
        staffId: req.params.staffId,
        academicYear: year,
        semester: sem,
        entries: []
      });
    }

    // If a full entries array is provided, replace; otherwise, append a single entry
    if (Array.isArray(entries) && entries.length) {
      timetable.entries = entries;
    } else if (day && timeSlot && timeSlot.start && timeSlot.end && activity) {
      timetable.entries.push({
        day,
        timeSlot: { start: timeSlot.start, end: timeSlot.end },
        activity,
        subject: subject || activity,
        room: room || 'Office'
      });
    }

    timetable.lastUpdated = new Date();
    await timetable.save();

    res.json({ message: 'Timetable updated successfully', timetable });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update timetable' });
  }
});

// Get conversation history
app.get('/api/conversations/:conversationId', async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      conversationId: req.params.conversationId 
    }).sort({ timestamp: 1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});



// Import staff profiles
const staffProfiles = require('./staff-profiles.js');

// Staff login using staff-profiles.js data
app.post('/api/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find staff member in staff-profiles.js
    const staff = staffProfiles.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (!staff) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password (plain text comparison as per staff-profiles.js)
    if (staff.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        staffId: staff.shortName, // Use shortName as staffId
        name: staff.name, 
        department: staff.department,
        email: staff.email,
        shortName: staff.shortName,
        subjects: staff.subjects
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Login successful',
      token: token,
      staff: {
        _id: staff.shortName,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        designation: staff.name.includes('Prof.') ? 'Professor' : 'Assistant Professor',
        shortName: staff.shortName,
        subjects: staff.subjects
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Clara AI Reception System running on port ${PORT}`);
  console.log(`📱 Client Interface: http://localhost:${PORT}`);
  console.log(`👨‍🏫 Staff Interface: http://localhost:${PORT}/staff`);
  console.log(`🎓 Clara AI Receptionist: http://localhost:${PORT}/clara (legacy)`);
  console.log(`👥 Staff Login: http://localhost:${PORT}/staff-login (legacy)`);
  console.log(`👨‍🏫 Staff Dashboard: http://localhost:${PORT}/staff-dashboard (legacy)`);
  console.log(`🔧 API health check: http://localhost:${PORT}/api/health`);
  console.log(`🏫 Staff API: http://localhost:${PORT}/api/staff`);
  console.log(`📅 Timetable API: http://localhost:${PORT}/api/staff/:staffId/timetable`);
  console.log(`📋 Appointments API: http://localhost:${PORT}/api/staff/:staffId/appointments`);
});
