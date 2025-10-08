const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clara-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Staff data to create
const staffToCreate = [
  {
    name: "Mrs. Anitha C S",
    email: "anithacs@gmail.com",
    password: "anitha123",
    department: "Computer Science Engineering",
    designation: "Assistant Professor",
    shortName: "ACS"
  },
  {
    name: "Ms. Lakshmi Durga N",
    email: "lakshmi@gmail.com",
    password: "lakshmi123",
    department: "Computer Science Engineering",
    designation: "Assistant Professor",
    shortName: "LDN"
  },
  {
    name: "Dr. Dhivyasri G",
    email: "dhivyasri@gmail.com",
    password: "dhivyasri123",
    department: "Computer Science Engineering",
    designation: "Associate Professor",
    shortName: "GD"
  }
];

async function checkAndCreateStaff() {
  try {
    console.log('🔍 Checking current staff members...');
    
    // Get current staff
    const currentStaff = await Staff.find({});
    console.log(`\n📋 Current staff members (${currentStaff.length}):`);
    currentStaff.forEach(s => console.log(`- ${s.name} (${s.email})`));
    
    console.log('\n🚀 Creating missing staff members...');
    
    for (const staffData of staffToCreate) {
      // Check if staff already exists
      const existingStaff = await Staff.findOne({ 
        $or: [
          { email: staffData.email },
          { name: staffData.name }
        ]
      });
      
      if (existingStaff) {
        console.log(`✅ Staff already exists: ${staffData.name}`);
        continue;
      }
      
      // Create new staff member
      const hashedPassword = await bcrypt.hash(staffData.password, 10);
      
      const staff = new Staff({
        name: staffData.name,
        email: staffData.email,
        password: hashedPassword,
        department: staffData.department,
        designation: staffData.designation,
        shortName: staffData.shortName,
        isAvailable: true
      });
      
      await staff.save();
      console.log(`✅ Created staff: ${staffData.name} (${staffData.email})`);
    }
    
    console.log('\n🎉 Staff check and creation completed!');
    
    // Display final staff list
    const finalStaff = await Staff.find({});
    console.log(`\n📋 Final staff members (${finalStaff.length}):`);
    finalStaff.forEach(s => console.log(`- ${s.name} (${s.email})`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
checkAndCreateStaff();
