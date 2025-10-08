const mongoose = require('mongoose');
const StaffTimetable = require('../models/StaffTimetable');
const Staff = require('../models/Staff');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clara-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Staff timetable data provided by user
const staffTimetableData = [
  {
    "faculty_name": "Mrs. Anitha C S (ACS)",
    "designation": "Assistant Professor",
    "academic_year": "2025-2026",
    "semester_type": "Odd",
    "workload": {
      "theory_hours": 8,
      "lab_hours": 8,
      "total_units": 16
    },
    "courses_taught": [
      {
        "subject_code": "BRMK557",
        "subject_name": "Research Methodology and IPR"
      },
      {
        "subject_code": "BCD502",
        "subject_name": "Computer Networks (NS-2/3) Lab"
      },
      {
        "subject_code": "BCDL504",
        "subject_name": "Data Visualization Lab"
      },
      {
        "subject_code": "BCS302",
        "subject_name": "Digital Design And Computer Organization Lab"
      }
    ],
    "timetable": [
      {
        "day": "Monday",
        "slots": [
          {
            "start_time": "09:25",
            "end_time": "10:20",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th A"
          },
          {
            "start_time": "10:40",
            "end_time": "11:35",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th B"
          },
          {
            "start_time": "15:05",
            "end_time": "16:10",
            "subject_code": "BCS302",
            "subject_name": "Digital Design And Computer Organization Lab",
            "class_details": "3rd A"
          }
        ]
      },
      {
        "day": "Tuesday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "10:20",
            "subject_code": "BCDL504",
            "subject_name": "Data Visualization Lab",
            "class_details": "5th B"
          },
          {
            "start_time": "10:40",
            "end_time": "12:30",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3) Lab",
            "class_details": "5th A"
          },
          {
            "start_time": "13:15",
            "end_time": "14:10",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th B"
          }
        ]
      },
      {
        "day": "Wednesday",
        "slots": [
          {
            "start_time": "09:25",
            "end_time": "10:20",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th A"
          }
        ]
      },
      {
        "day": "Thursday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "09:25",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th B"
          },
          {
            "start_time": "10:40",
            "end_time": "12:30",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3) Lab",
            "class_details": "5th B"
          },
          {
            "start_time": "13:15",
            "end_time": "14:10",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th A"
          }
        ]
      },
      {
        "day": "Friday",
        "slots": [
          {
            "start_time": "09:25",
            "end_time": "10:20",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th B"
          },
          {
            "start_time": "10:40",
            "end_time": "11:35",
            "subject_code": "BRMK557",
            "subject_name": "Research Methodology and IPR",
            "class_details": "5th A"
          }
        ]
      },
      {
        "day": "Saturday",
        "slots": []
      }
    ]
  },
  {
    "faculty_name": "Ms. Lakshmi Durga N",
    "designation": "Assistant Professor",
    "academic_year": "2025-2026",
    "semester_type": "Odd",
    "workload": {
      "theory_hours": 8,
      "lab_hours": 8,
      "total_units": 16
    },
    "courses_taught": [
      {
        "subject_code": "BCD501",
        "subject_name": "Software Engineering & Project Management"
      },
      {
        "subject_code": "BCDL504",
        "subject_name": "Data Visualization Lab"
      },
      {
        "subject_code": "BCS302",
        "subject_name": "Digital Design And Computer Organization Lab"
      },
      {
        "subject_code": "BCS358C",
        "subject_name": "Project Management With Git"
      },
      {
        "subject_code": "BAD702",
        "subject_name": "Statistical Machine Learning for Data Science Lab"
      }
    ],
    "timetable": [
      {
        "day": "Monday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "09:25",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th A"
          },
          {
            "start_time": "11:35",
            "end_time": "12:30",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th B"
          }
        ]
      },
      {
        "day": "Tuesday",
        "slots": [
          {
            "start_time": "10:40",
            "end_time": "11:35",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th B"
          },
          {
            "start_time": "13:15",
            "end_time": "14:10",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th A"
          }
        ]
      },
      {
        "day": "Wednesday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "09:25",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th B"
          },
          {
            "start_time": "10:40",
            "end_time": "12:30",
            "subject_code": "BAD702",
            "subject_name": "Statistical Machine Learning for Data Science Lab",
            "class_details": "7th A"
          },
          {
            "start_time": "13:15",
            "end_time": "15:05",
            "subject_code": "BCS302",
            "subject_name": "Digital Design And Computer Organization Lab",
            "class_details": "3rd B"
          }
        ]
      },
      {
        "day": "Thursday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "09:25",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th A"
          },
          {
            "start_time": "09:25",
            "end_time": "10:20",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th B"
          }
        ]
      },
      {
        "day": "Friday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "10:20",
            "subject_code": "BCDL504",
            "subject_name": "Data Visualization Lab",
            "class_details": "5th A"
          },
          {
            "start_time": "10:40",
            "end_time": "11:35",
            "subject_code": "BCD501",
            "subject_name": "Software Engineering & Project Management",
            "class_details": "5th A"
          },
          {
            "start_time": "13:15",
            "end_time": "15:05",
            "subject_code": "BCS358C",
            "subject_name": "Project Management With Git",
            "class_details": "3rd B"
          }
        ]
      },
      {
        "day": "Saturday",
        "slots": []
      }
    ]
  },
  {
    "faculty_name": "Dr. Dhivyasri G",
    "designation": "Associate Professor",
    "academic_year": "2025-2026",
    "semester_type": "Odd",
    "workload": {
      "theory_hours": 8,
      "lab_hours": 6,
      "total_units": 14
    },
    "courses_taught": [
      {
        "subject_code": "BCD502",
        "subject_name": "Computer Networks (NS-2/3)"
      },
      {
        "subject_code": "BCD502",
        "subject_name": "Computer Networks (NS-2/3) Lab"
      },
      {
        "subject_code": "BCDL504",
        "subject_name": "Data Visualization Lab"
      }
    ],
    "timetable": [
      {
        "day": "Monday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "09:25",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th B"
          },
          {
            "start_time": "10:40",
            "end_time": "11:35",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th A"
          }
        ]
      },
      {
        "day": "Tuesday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "09:25",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th A"
          },
          {
            "start_time": "13:15",
            "end_time": "16:10",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3) Lab",
            "class_details": "5th A"
          }
        ]
      },
      {
        "day": "Wednesday",
        "slots": [
          {
            "start_time": "09:25",
            "end_time": "10:20",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th A"
          },
          {
            "start_time": "11:35",
            "end_time": "12:30",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th B"
          }
        ]
      },
      {
        "day": "Thursday",
        "slots": [
          {
            "start_time": "09:25",
            "end_time": "10:20",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th A"
          },
          {
            "start_time": "10:40",
            "end_time": "13:15",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3) Lab",
            "class_details": "5th B"
          },
          {
            "start_time": "13:15",
            "end_time": "14:10",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th B"
          }
        ]
      },
      {
        "day": "Friday",
        "slots": [
          {
            "start_time": "08:30",
            "end_time": "10:20",
            "subject_code": "BCDL504",
            "subject_name": "Data Visualization Lab",
            "class_details": "5th A"
          },
          {
            "start_time": "11:35",
            "end_time": "12:30",
            "subject_code": "BCD502",
            "subject_name": "Computer Networks (NS-2/3)",
            "class_details": "5th B"
          }
        ]
      },
      {
        "day": "Saturday",
        "slots": []
      }
    ]
  }
];

// Helper function to find staff by name
async function findStaffByName(name) {
  // Map the provided names to existing staff names
  const nameMapping = {
    "Mrs. Anitha C S (ACS)": "Anitha C S",
    "Ms. Lakshmi Durga N": "Lakshmi Durga N", 
    "Dr. Dhivyasri G": "G Dhivyasri"
  };
  
  const mappedName = nameMapping[name] || name;
  
  // Try to find by exact name match first
  let staff = await Staff.findOne({ name: mappedName });
  
  if (!staff) {
    // Try partial matches
    const partialMatches = await Staff.find({
      name: { $regex: mappedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    });
    
    if (partialMatches.length > 0) {
      staff = partialMatches[0];
    }
  }
  
  return staff;
}

// Helper function to convert timetable data to StaffTimetable format
function convertToStaffTimetableFormat(facultyData) {
  const entries = [];
  
  for (const dayData of facultyData.timetable) {
    for (const slot of dayData.slots) {
      entries.push({
        day: dayData.day,
        timeSlot: {
          start: slot.start_time,
          end: slot.end_time
        },
        activity: slot.subject_name.includes('Lab') ? 'Lab Session' : 'Teaching',
        subject: `${slot.subject_code} - ${slot.subject_name}`,
        room: 'Classroom', // Default room
        batch: slot.class_details,
        semester: '5th Semester', // Based on class details
        notes: `Class: ${slot.class_details}`,
        isRecurring: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });
    }
  }
  
  return {
    academicYear: facultyData.academic_year,
    semester: '5th Semester', // Based on the data
    entries: entries,
    lastUpdated: new Date(),
    isActive: true
  };
}

async function populateStaffTimetables() {
  try {
    console.log('🚀 Starting staff timetable population...');
    
    // Clear existing staff timetables
    await StaffTimetable.deleteMany({});
    console.log('✅ Cleared existing staff timetables');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const facultyData of staffTimetableData) {
      try {
        console.log(`\n📚 Processing ${facultyData.faculty_name}...`);
        
        // Find the staff member
        const staff = await findStaffByName(facultyData.faculty_name);
        
        if (!staff) {
          console.log(`❌ Staff not found: ${facultyData.faculty_name}`);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Found staff: ${staff.name} (${staff.email})`);
        
        // Convert timetable data
        const timetableData = convertToStaffTimetableFormat(facultyData);
        
        // Create staff timetable
        const staffTimetable = new StaffTimetable({
          staffId: staff._id.toString(),
          academicYear: timetableData.academicYear,
          semester: timetableData.semester,
          entries: timetableData.entries,
          lastUpdated: timetableData.lastUpdated,
          isActive: timetableData.isActive
        });
        
        await staffTimetable.save();
        console.log(`✅ Created timetable for ${staff.name} (${timetableData.entries.length} entries)`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Error processing ${facultyData.faculty_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Staff timetable population completed!');
    console.log(`📊 Successfully created: ${successCount} timetables`);
    console.log(`❌ Errors: ${errorCount} timetables`);
    
    // Display summary
    console.log('\n📋 Timetable Summary:');
    console.log('====================');
    for (const facultyData of staffTimetableData) {
      const totalSlots = facultyData.timetable.reduce((total, day) => total + day.slots.length, 0);
      console.log(`${facultyData.faculty_name}: ${totalSlots} time slots`);
    }
    
  } catch (error) {
    console.error('❌ Error populating staff timetables:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the population script
populateStaffTimetables();
