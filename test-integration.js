const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server');

// Test data
const testStaff = {
  name: 'Test Staff',
  email: 'teststaff@example.com',
  password: 'password123',
  department: 'Computer Science',
  role: 'staff'
};

const testClient = {
  name: 'Test Client',
  email: 'testclient@example.com',
  phone: '1234567890'
};

const testTimetable = {
  teacherId: null, // Will be set after staff creation
  teacherName: 'Test Staff',
  department: 'Computer Science',
  schedule: [{
    day: 'Monday',
    timeSlots: [{
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Data Structures',
      room: 'Lab 101',
      type: 'lecture'
    }, {
      startTime: '14:00',
      endTime: '15:00',
      subject: 'Office Hours',
      room: 'Office 201',
      type: 'office-hours'
    }]
  }]
};

describe('CLARA Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clara-test');
  });

  afterAll(async () => {
    // Clean up test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('timetables').deleteMany({});
    await mongoose.connection.db.collection('calls').deleteMany({});
    await mongoose.connection.db.collection('appointments').deleteMany({});
  });

  describe('Staff Authentication', () => {
    test('should register and login staff', async () => {
      // Register staff
      const registerResponse = await request(app)
        .post('/api/staff/register')
        .send(testStaff);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      // Login staff
      const loginResponse = await request(app)
        .post('/api/staff/login')
        .send({
          email: testStaff.email,
          password: testStaff.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();
    });
  });

  describe('Timetable Management', () => {
    let authToken;
    let staffId;

    beforeEach(async () => {
      // Create staff and get auth token
      const registerResponse = await request(app)
        .post('/api/staff/register')
        .send(testStaff);
      
      staffId = registerResponse.body.user._id;
      testTimetable.teacherId = staffId;

      const loginResponse = await request(app)
        .post('/api/staff/login')
        .send({
          email: testStaff.email,
          password: testStaff.password
        });
      
      authToken = loginResponse.body.token;
    });

    test('should create timetable', async () => {
      const response = await request(app)
        .post('/api/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTimetable);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.timetable.teacherId).toBe(staffId);
    });

    test('should get weekly timetable', async () => {
      // Create timetable first
      await request(app)
        .post('/api/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTimetable);

      const response = await request(app)
        .get('/api/timetable/weekly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ staffId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.weeklyTimetable).toBeDefined();
      expect(response.body.weeklyTimetable.monday).toHaveLength(2);
    });

    test('should check staff availability', async () => {
      // Create timetable first
      await request(app)
        .post('/api/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTimetable);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/timetable/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ staffId, date: dateStr });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.available).toBeDefined();
    });
  });

  describe('Call Management', () => {
    let authToken;
    let staffId;
    let clientId;

    beforeEach(async () => {
      // Create staff and client
      const staffResponse = await request(app)
        .post('/api/staff/register')
        .send(testStaff);
      staffId = staffResponse.body.user._id;

      const clientResponse = await request(app)
        .post('/api/users/register')
        .send(testClient);
      clientId = clientResponse.body.user._id;

      const loginResponse = await request(app)
        .post('/api/staff/login')
        .send({
          email: testStaff.email,
          password: testStaff.password
        });
      
      authToken = loginResponse.body.token;
    });

    test('should create call', async () => {
      const callData = {
        clientId,
        purpose: 'Academic consultation',
        callType: 'incoming'
      };

      const response = await request(app)
        .post('/api/calls')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.call.clientId).toBe(clientId);
    });

    test('should get call log', async () => {
      // Create a call first
      await request(app)
        .post('/api/calls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          purpose: 'Academic consultation',
          callType: 'incoming'
        });

      const response = await request(app)
        .get('/api/calls')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.calls).toHaveLength(1);
    });

    test('should update call status', async () => {
      // Create a call first
      const createResponse = await request(app)
        .post('/api/calls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          purpose: 'Academic consultation',
          callType: 'incoming'
        });

      const callId = createResponse.body.call._id;

      const response = await request(app)
        .put(`/api/calls/${callId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'connected' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.call.status).toBe('connected');
    });

    test('should add call update', async () => {
      // Create a call first
      const createResponse = await request(app)
        .post('/api/calls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          purpose: 'Academic consultation',
          callType: 'incoming'
        });

      const callId = createResponse.body.call._id;

      const response = await request(app)
        .post(`/api/calls/${callId}/updates`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Student needs help with algorithms',
          disposition: 'helpful',
          followUpRequired: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.call.updates).toHaveLength(1);
    });
  });

  describe('Appointment Management', () => {
    let authToken;
    let staffId;
    let clientId;

    beforeEach(async () => {
      // Create staff and client
      const staffResponse = await request(app)
        .post('/api/staff/register')
        .send(testStaff);
      staffId = staffResponse.body.user._id;

      const clientResponse = await request(app)
        .post('/api/users/register')
        .send(testClient);
      clientId = clientResponse.body.user._id;

      const loginResponse = await request(app)
        .post('/api/staff/login')
        .send({
          email: testStaff.email,
          password: testStaff.password
        });
      
      authToken = loginResponse.body.token;

      // Create timetable for availability checking
      testTimetable.teacherId = staffId;
      await request(app)
        .post('/api/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTimetable);
    });

    test('should create appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const appointmentData = {
        clientId,
        staffId,
        purpose: 'Academic consultation',
        appointmentDate: dateStr,
        appointmentTime: {
          start: '14:00',
          end: '15:00'
        },
        location: 'Office 201'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.appointment.clientId).toBe(clientId);
    });

    test('should get appointments', async () => {
      // Create an appointment first
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          staffId,
          purpose: 'Academic consultation',
          appointmentDate: dateStr,
          appointmentTime: {
            start: '14:00',
            end: '15:00'
          },
          location: 'Office 201'
        });

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appointments).toHaveLength(1);
    });

    test('should check availability for appointments', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/appointments/availability/${staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: dateStr });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.availability).toBeDefined();
    });

    test('should update appointment', async () => {
      // Create an appointment first
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const createResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          staffId,
          purpose: 'Academic consultation',
          appointmentDate: dateStr,
          appointmentTime: {
            start: '14:00',
            end: '15:00'
          },
          location: 'Office 201'
        });

      const appointmentId = createResponse.body.appointment._id;

      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appointment.status).toBe('Confirmed');
    });

    test('should cancel appointment', async () => {
      // Create an appointment first
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const createResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          staffId,
          purpose: 'Academic consultation',
          appointmentDate: dateStr,
          appointmentTime: {
            start: '14:00',
            end: '15:00'
          },
          location: 'Office 201'
        });

      const appointmentId = createResponse.body.appointment._id;

      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appointment.status).toBe('Cancelled');
    });
  });

  describe('Integration Workflow', () => {
    let authToken;
    let staffId;
    let clientId;

    beforeEach(async () => {
      // Create staff and client
      const staffResponse = await request(app)
        .post('/api/staff/register')
        .send(testStaff);
      staffId = staffResponse.body.user._id;

      const clientResponse = await request(app)
        .post('/api/users/register')
        .send(testClient);
      clientId = clientResponse.body.user._id;

      const loginResponse = await request(app)
        .post('/api/staff/login')
        .send({
          email: testStaff.email,
          password: testStaff.password
        });
      
      authToken = loginResponse.body.token;

      // Create timetable
      testTimetable.teacherId = staffId;
      await request(app)
        .post('/api/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTimetable);
    });

    test('should complete full workflow: call -> appointment -> update', async () => {
      // 1. Create incoming call
      const callResponse = await request(app)
        .post('/api/calls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          purpose: 'Need help with algorithms',
          callType: 'incoming'
        });

      const callId = callResponse.body.call._id;

      // 2. Update call status to connected
      await request(app)
        .put(`/api/calls/${callId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'connected' });

      // 3. Create appointment from call
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          staffId,
          purpose: 'Algorithm consultation',
          appointmentDate: dateStr,
          appointmentTime: {
            start: '14:00',
            end: '15:00'
          },
          location: 'Office 201',
          callId,
          createdFromCall: true
        });

      const appointmentId = appointmentResponse.body.appointment._id;

      // 4. Add call update with appointment reference
      await request(app)
        .post(`/api/calls/${callId}/updates`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Appointment scheduled for algorithm help',
          disposition: 'scheduled',
          followUpRequired: false,
          appointmentId
        });

      // 5. Verify call has appointment reference
      const callDetailsResponse = await request(app)
        .get(`/api/calls/${callId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(callDetailsResponse.body.call.updates[0].appointmentId).toBe(appointmentId);

      // 6. Verify appointment exists
      const appointmentsResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(appointmentsResponse.body.appointments).toHaveLength(1);
      expect(appointmentsResponse.body.appointments[0].callId).toBe(callId);
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  const { exec } = require('child_process');
  exec('npm test -- test-integration.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Test execution error: ${error}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}
