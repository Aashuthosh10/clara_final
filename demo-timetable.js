// Demo Timetable Data Populator
// This script can be used to populate sample timetable data for testing

const sampleTimetables = [
  {
    teacherName: "Mr. Sharma",
    department: "Computer Science Engineering",
    schedule: [
      {
        day: "monday",
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            subject: "Data Structures",
            room: "Lab 101",
            class: "CSE 3rd Year",
            type: "lecture"
          },
          {
            startTime: "11:00",
            endTime: "13:00",
            subject: "Data Structures Lab",
            room: "Lab 101",
            class: "CSE 3rd Year",
            type: "lab"
          }
        ]
      },
      {
        day: "tuesday",
        timeSlots: [
          {
            startTime: "10:00",
            endTime: "11:00",
            subject: "Algorithm Analysis",
            room: "Room 205",
            class: "CSE 4th Year",
            type: "lecture"
          }
        ]
      },
      {
        day: "wednesday",
        timeSlots: [
          {
            startTime: "14:00",
            endTime: "16:00",
            subject: "Programming Workshop",
            room: "Lab 102",
            class: "CSE 2nd Year",
            type: "tutorial"
          }
        ]
      }
    ],
    officeHours: [
      {
        day: "monday",
        startTime: "16:00",
        endTime: "18:00",
        location: "Office 301"
      },
      {
        day: "wednesday",
        startTime: "16:00",
        endTime: "18:00",
        location: "Office 301"
      }
    ]
  },
  {
    teacherName: "Mrs. Gupta",
    department: "Mechanical Engineering",
    schedule: [
      {
        day: "monday",
        timeSlots: [
          {
            startTime: "08:00",
            endTime: "10:00",
            subject: "Thermodynamics",
            room: "Room 401",
            class: "MECH 3rd Year",
            type: "lecture"
          }
        ]
      },
      {
        day: "tuesday",
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "11:00",
            subject: "Machine Design",
            room: "Room 402",
            class: "MECH 4th Year",
            type: "lecture"
          }
        ]
      },
      {
        day: "thursday",
        timeSlots: [
          {
            startTime: "14:00",
            endTime: "16:00",
            subject: "CAD Lab",
            room: "Lab 201",
            class: "MECH 3rd Year",
            type: "lab"
          }
        ]
      }
    ],
    officeHours: [
      {
        day: "tuesday",
        startTime: "15:00",
        endTime: "17:00",
        location: "Office 501"
      }
    ]
  },
  {
    teacherName: "Dr. Kumar",
    department: "Electronics & Communication Engineering",
    schedule: [
      {
        day: "monday",
        timeSlots: [
          {
            startTime: "10:00",
            endTime: "12:00",
            subject: "Digital Electronics",
            room: "Room 301",
            class: "ECE 3rd Year",
            type: "lecture"
          }
        ]
      },
      {
        day: "wednesday",
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "11:00",
            subject: "Communication Systems",
            room: "Room 302",
            class: "ECE 4th Year",
            type: "lecture"
          }
        ]
      },
      {
        day: "friday",
        timeSlots: [
          {
            startTime: "13:00",
            endTime: "15:00",
            subject: "VLSI Design",
            room: "Lab 301",
            class: "ECE 4th Year",
            type: "lab"
          }
        ]
      }
    ],
    officeHours: [
      {
        day: "monday",
        startTime: "16:00",
        endTime: "18:00",
        location: "Office 401"
      },
      {
        day: "friday",
        startTime: "15:00",
        endTime: "17:00",
        location: "Office 401"
      }
    ]
  }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = sampleTimetables;
}

// For browser use
if (typeof window !== 'undefined') {
  window.sampleTimetables = sampleTimetables;
}

console.log('📅 Sample timetable data loaded with', sampleTimetables.length, 'teachers');
console.log('Teachers available:');
sampleTimetables.forEach(teacher => {
  console.log(`- ${teacher.teacherName} (${teacher.department})`);
});
