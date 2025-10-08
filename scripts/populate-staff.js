const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const staffProfiles = require('../staff-profiles');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clara-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Timetable data from the provided JSON
const timetableData = [
  {
    semester: "V",
    class: "CSE (Data Science)",
    section: "A",
    academic_year: "2025-26",
    room: "224",
    timetable: [
      {
        day: "monday",
        slots: [
          {
            startTime: "08:30",
            endTime: "09:25",
            subject: "Software Engineering & Project Management",
            faculty: "Prof. Lakshmi Durga N(LDN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "09:25",
            endTime: "10:20",
            subject: "Research Methodology and IPR",
            faculty: "Prof. Anitha C S(ACS)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "10:20",
            endTime: "10:40",
            subject: "Coffee Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "10:40",
            endTime: "11:35",
            subject: "Computer Networks",
            faculty: "Dr. G Dhivyasri (GD)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "11:35",
            endTime: "12:30",
            subject: "NOSQL Databases",
            faculty: "Prof. Nisha S K (NSK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "12:30",
            endTime: "13:15",
            subject: "Lunch Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "13:15",
            endTime: "14:10",
            subject: "Mini Project",
            faculty: "Prof. Amarnath B Patil (ABP)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "14:10",
            endTime: "15:05",
            subject: "Mini Project",
            faculty: "Prof. Amarnath B Patil (ABP)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "15:05",
            endTime: "16:10",
            subject: "Mini Project",
            faculty: "Prof. Amarnath B Patil (ABP)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          }
        ]
      },
      {
        day: "tuesday",
        slots: [
          {
            startTime: "08:30",
            endTime: "09:25",
            subject: "Computer Networks",
            faculty: "Dr. G Dhivyasri (GD)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "09:25",
            endTime: "10:20",
            subject: "NOSQL Databases",
            faculty: "Prof. Nisha S K (NSK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "10:20",
            endTime: "10:40",
            subject: "Coffee Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "10:40",
            endTime: "11:35",
            subject: "Theory of Computation",
            faculty: "Dr. Nagashree N (NN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "11:35",
            endTime: "12:30",
            subject: "Environmental Studies",
            faculty: "Prof. Anil Kumar K V (AKV)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "12:30",
            endTime: "13:15",
            subject: "Lunch Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "13:15",
            endTime: "14:10",
            subject: "Computer Networks Lab",
            faculty: "Prof. Anitha CS(ACS) / Prof. Jyoti Kumari(JK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "14:10",
            endTime: "15:05",
            subject: "Computer Networks Lab",
            faculty: "Prof. Anitha CS(ACS) / Prof. Jyoti Kumari(JK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "15:05",
            endTime: "16:10",
            subject: "Computer Networks Lab",
            faculty: "Prof. Anitha CS(ACS) / Prof. Jyoti Kumari(JK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          }
        ]
      },
      {
        day: "wednesday",
        slots: [
          {
            startTime: "08:30",
            endTime: "09:25",
            subject: "Data Visualization Lab",
            faculty: "Prof. Lakshmi Durga N(LDN)/Prof. Vidyashree R(VR)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "09:25",
            endTime: "10:20",
            subject: "Data Visualization Lab",
            faculty: "Prof. Lakshmi Durga N(LDN)/Prof. Vidyashree R(VR)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "10:20",
            endTime: "10:40",
            subject: "Coffee Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "10:40",
            endTime: "11:35",
            subject: "Data Visualization Lab",
            faculty: "Prof. Lakshmi Durga N(LDN)/Prof. Vidyashree R(VR)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lab"
          },
          {
            startTime: "11:35",
            endTime: "12:30",
            subject: "Theory of Computation",
            faculty: "Dr. Nagashree N (NN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "12:30",
            endTime: "13:15",
            subject: "Lunch Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "13:15",
            endTime: "14:10",
            subject: "Computer Networks",
            faculty: "Dr. G Dhivyasri (GD)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "14:10",
            endTime: "15:05",
            subject: "Research Methodology and IPR",
            faculty: "Prof. Anitha C S(ACS)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "15:05",
            endTime: "16:10",
            subject: "Placement Training",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "other"
          }
        ]
      },
      {
        day: "thursday",
        slots: [
          {
            startTime: "08:30",
            endTime: "09:25",
            subject: "Theory of Computation",
            faculty: "Dr. Nagashree N (NN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "09:25",
            endTime: "10:20",
            subject: "NOSQL Databases",
            faculty: "Prof. Nisha S K (NSK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "10:20",
            endTime: "10:40",
            subject: "Coffee Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "10:40",
            endTime: "11:35",
            subject: "Software Engineering & Project Management",
            faculty: "Prof. Lakshmi Durga N(LDN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "11:35",
            endTime: "12:30",
            subject: "Research Methodology and IPR",
            faculty: "Prof. Anitha C S(ACS)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "12:30",
            endTime: "13:15",
            subject: "Lunch Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "13:15",
            endTime: "14:10",
            subject: "Software Engineering & Project Management",
            faculty: "Prof. Lakshmi Durga N(LDN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "14:10",
            endTime: "15:05",
            subject: "Proctor Hour",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "other"
          },
          {
            startTime: "15:05",
            endTime: "16:10",
            subject: "FORUM ACTIVITY",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "other"
          }
        ]
      },
      {
        day: "friday",
        slots: [
          {
            startTime: "08:30",
            endTime: "09:25",
            subject: "Software Engineering & Project Management",
            faculty: "Prof. Lakshmi Durga N(LDN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "09:25",
            endTime: "10:20",
            subject: "Computer Networks",
            faculty: "Dr. G Dhivyasri (GD)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "10:20",
            endTime: "10:40",
            subject: "Coffee Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "10:40",
            endTime: "11:35",
            subject: "Theory of Computation",
            faculty: "Dr. Nagashree N (NN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "11:35",
            endTime: "12:30",
            subject: "NOSQL Databases",
            faculty: "Prof. Nisha S K (NSK)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture"
          },
          {
            startTime: "12:30",
            endTime: "13:15",
            subject: "Lunch Break",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "break"
          },
          {
            startTime: "13:15",
            endTime: "14:10",
            subject: "Theory of Computation",
            faculty: "Dr. Nagashree N (NN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture",
            note: "Remedial Class"
          },
          {
            startTime: "14:10",
            endTime: "15:05",
            subject: "Software Engineering & Project Management",
            faculty: "Prof. Lakshmi Durga N(LDN)",
            room: "224",
            class: "CSE (Data Science) - A",
            type: "lecture",
            note: "Remedial Class"
          },
          {
            startTime: "15:05",
            endTime: "16:10",
            subject: "NSS/YOGA/SPORTS",
            faculty: null,
            room: "224",
            class: "CSE (Data Science) - A",
            type: "other"
          }
        ]
      },
      {
        day: "saturday",
        slots: []
      }
    ]
  }
];

async function populateStaff() {
  try {
    console.log('🚀 Starting staff population...');
    
    // Clear existing staff users
    await User.deleteMany({ role: 'staff' });
    console.log('✅ Cleared existing staff users');
    
    // Clear existing timetables
    await Timetable.deleteMany({});
    console.log('✅ Cleared existing timetables');
    
    // Create staff users
    const createdUsers = [];
    for (const profile of staffProfiles) {
      const hashedPassword = await bcrypt.hash(profile.password, 10);
      
      const user = new User({
        name: profile.name,
        email: profile.email,
        password: hashedPassword,
        role: 'staff',
        department: profile.department,
        isAvailable: true
      });
      
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created staff user: ${profile.name} (${profile.email})`);
    }
    
    // Create timetables for each staff member
    for (const user of createdUsers) {
      const userTimetable = {
        teacherId: user._id,
        teacherName: user.name,
        department: user.department,
        schedule: [],
        officeHours: [],
        academicYear: "2025-26",
        semester: "V",
        isActive: true
      };
      
      // Extract schedule for this teacher from the timetable data
      for (const dayData of timetableData[0].timetable) {
        const daySchedule = {
          day: dayData.day.toLowerCase(),
          timeSlots: []
        };
        
        for (const slot of dayData.slots) {
          // Check if this slot belongs to the current teacher
          if (slot.faculty && slot.faculty.includes(user.name.split(' ').pop())) {
            daySchedule.timeSlots.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: slot.subject,
              room: slot.room,
              class: slot.class,
              type: slot.type
            });
          }
        }
        
        if (daySchedule.timeSlots.length > 0) {
          userTimetable.schedule.push(daySchedule);
        }
      }
      
      // Add some office hours (example)
      userTimetable.officeHours = [
        {
          day: 'monday',
          startTime: '16:30',
          endTime: '17:30',
          location: 'Office'
        },
        {
          day: 'wednesday',
          startTime: '16:30',
          endTime: '17:30',
          location: 'Office'
        }
      ];
      
      const timetable = new Timetable(userTimetable);
      await timetable.save();
      console.log(`✅ Created timetable for: ${user.name}`);
    }
    
    console.log('\n🎉 Staff population completed successfully!');
    console.log(`📊 Created ${createdUsers.length} staff users with timetables`);
    
    // Display login credentials
    console.log('\n🔑 Login Credentials:');
    console.log('====================');
    staffProfiles.forEach(profile => {
      console.log(`${profile.name}:`);
      console.log(`  Email: ${profile.email}`);
      console.log(`  Password: ${profile.password}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error populating staff:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the population script
populateStaff();
