const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Staff = require('./models/Staff');
const StaffTimetable = require('./models/StaffTimetable');
const staffProfiles = require('./staff-profiles');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sai_vidya_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample staff data - combining profiles with additional data
const sampleStaff = [
  // Staff from profiles with additional required fields
  {
    name: 'Prof. Lakshmi Durga N',
    email: 'lakshmidurgan@gmail.com',
    password: 'lakshmidurgan',
    employeeId: 'EMP001',
    department: 'Computer Science',
    designation: 'Professor',
    phone: '+91-9876543210',
    office: {
      building: 'Main Block',
      room: '101'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Anitha C S',
    email: 'anithacs@gmail.com',
    password: 'anithacs',
    employeeId: 'EMP002',
    department: 'Computer Science',
    designation: 'Associate Professor',
    phone: '+91-9876543211',
    office: {
      building: 'Main Block',
      room: '102'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Dr. G Dhivyasri',
    email: 'gdhivyasri@gmail.com',
    password: 'gdhivyasri',
    employeeId: 'EMP003',
    department: 'Computer Science',
    designation: 'Professor',
    phone: '+91-9876543212',
    office: {
      building: 'Main Block',
      room: '103'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Nisha S K',
    email: 'nishask@gmail.com',
    password: 'nishask',
    employeeId: 'EMP004',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91-9876543213',
    office: {
      building: 'Main Block',
      room: '104'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Amarnath B Patil',
    email: 'amarnathbpatil@gmail.com',
    password: 'amarnathbpatil',
    employeeId: 'EMP005',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91-9876543214',
    office: {
      building: 'Main Block',
      room: '105'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Dr. Nagashree N',
    email: 'nagashreen@gmail.com',
    password: 'nagashreen',
    employeeId: 'EMP006',
    department: 'Computer Science',
    designation: 'Professor',
    phone: '+91-9876543215',
    office: {
      building: 'Main Block',
      room: '106'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Anil Kumar K V',
    email: 'anilkumarkv@gmail.com',
    password: 'anilkumarkv',
    employeeId: 'EMP007',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91-9876543216',
    office: {
      building: 'Main Block',
      room: '107'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Jyoti Kumari',
    email: 'jyotikumari@gmail.com',
    password: 'jyotikumari',
    employeeId: 'EMP008',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91-9876543217',
    office: {
      building: 'Main Block',
      room: '108'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Vidyashree R',
    email: 'vidyashreer@gmail.com',
    password: 'vidyashreer',
    employeeId: 'EMP009',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91-9876543218',
    office: {
      building: 'Main Block',
      room: '109'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Dr. Bhavana A',
    email: 'bhavanaa@gmail.com',
    password: 'bhavanaa',
    employeeId: 'EMP010',
    department: 'Computer Science',
    designation: 'Professor',
    phone: '+91-9876543219',
    office: {
      building: 'Main Block',
      room: '110'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  },
  {
    name: 'Prof. Bhavya T N',
    email: 'bhavyatn@gmail.com',
    password: 'bhavyatn',
    employeeId: 'EMP011',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91-9876543220',
    office: {
      building: 'Main Block',
      room: '111'
    },
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isAvailableForCalls: true
  }
];

// Sample timetable data
const sampleTimetables = [
  {
    staffId: null, // Will be set after staff creation
    academicYear: '2024-25',
    semester: '5th Semester',
    entries: [
      {
        day: 'Monday',
        timeSlot: { start: '09:00', end: '10:00' },
        activity: 'Office Hours',
        subject: 'General Consultation',
        room: 'Office'
      },
      {
        day: 'Monday',
        timeSlot: { start: '10:00', end: '12:00' },
        activity: 'Teaching',
        subject: 'Computer Science',
        room: 'Lab 101'
      },
      {
        day: 'Monday',
        timeSlot: { start: '14:00', end: '16:00' },
        activity: 'Free',
        subject: 'Available for calls',
        room: 'Office'
      },
      {
        day: 'Tuesday',
        timeSlot: { start: '09:00', end: '11:00' },
        activity: 'Teaching',
        subject: 'Advanced Topics',
        room: 'Classroom 201'
      },
      {
        day: 'Tuesday',
        timeSlot: { start: '14:00', end: '16:00' },
        activity: 'Office Hours',
        subject: 'Student Consultation',
        room: 'Office'
      },
      {
        day: 'Wednesday',
        timeSlot: { start: '09:00', end: '12:00' },
        activity: 'Free',
        subject: 'Available for calls',
        room: 'Office'
      },
      {
        day: 'Wednesday',
        timeSlot: { start: '14:00', end: '16:00' },
        activity: 'Meeting',
        subject: 'Department Meeting',
        room: 'Conference Room'
      },
      {
        day: 'Thursday',
        timeSlot: { start: '09:00', end: '11:00' },
        activity: 'Teaching',
        subject: 'Core Subjects',
        room: 'Lab 102'
      },
      {
        day: 'Thursday',
        timeSlot: { start: '14:00', end: '16:00' },
        activity: 'Office Hours',
        subject: 'General Consultation',
        room: 'Office'
      },
      {
        day: 'Friday',
        timeSlot: { start: '09:00', end: '12:00' },
        activity: 'Free',
        subject: 'Available for calls',
        room: 'Office'
      },
      {
        day: 'Friday',
        timeSlot: { start: '14:00', end: '16:00' },
        activity: 'Teaching',
        subject: 'Special Topics',
        room: 'Classroom 202'
      }
    ],
    isActive: true
  }
];

async function setupDatabase() {
  try {
    console.log('🚀 Starting Clara AI Reception System Setup...');
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Staff.deleteMany({});
    await StaffTimetable.deleteMany({});
    
    // Create staff members
    console.log('👥 Creating staff members...');
    const createdStaff = [];
    
    for (const staffData of sampleStaff) {
      const hashedPassword = await bcrypt.hash(staffData.password, 12);
      const staff = new Staff({
        ...staffData,
        password: hashedPassword
      });
      
      const savedStaff = await staff.save();
      createdStaff.push(savedStaff);
      console.log(`✅ Created staff: ${savedStaff.name} (${savedStaff.email})`);
    }
    
    // Create timetables for each staff member
    console.log('📅 Creating staff timetables...');
    
    for (const staff of createdStaff) {
      const timetableData = {
        ...sampleTimetables[0],
        staffId: staff._id
      };
      
      const timetable = new StaffTimetable(timetableData);
      await timetable.save();
      console.log(`✅ Created timetable for: ${staff.name}`);
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 System Information:');
    console.log(`- Staff Members: ${createdStaff.length}`);
    console.log(`- Demo Login: ${createdStaff[0].email} / ${sampleStaff[0].password}`);
    console.log(`- Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/sai_vidya_db'}`);
    console.log('\n🌐 Access Points:');
    console.log('- Main Reception: http://localhost:3000/clara');
    console.log('- Staff Login: http://localhost:3000/staff-login');
    console.log('- Staff Dashboard: http://localhost:3000/staff-dashboard');
    
    console.log('\n🔑 Demo Credentials:');
    createdStaff.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name}: ${staff.email} / ${sampleStaff[index].password}`);
    });
    
    console.log('\n✨ Clara AI Reception System is ready to use!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run setup
setupDatabase();
