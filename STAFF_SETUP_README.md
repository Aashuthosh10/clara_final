# Staff Profile and Timetable Setup

This document explains how to set up staff profiles and timetables for the Clara AI system using the provided timetable data.

## Overview

The system now includes:
- **11 Faculty Members** from CSE Data Science department
- **Complete Timetables** for both Section A and Section B
- **Automatic Login Credentials** generation
- **Integrated Timetable Management** in the Staff Interface

## Faculty Members

| Name | Email | Password | Short Name | Subjects |
|------|-------|----------|------------|----------|
| Prof. Lakshmi Durga N | lakshmidurgan@gmail.com | lakshmidurgan | LDN | Software Engineering, Data Visualization Lab |
| Prof. Anitha C S | anithacs@gmail.com | anithacs | ACS | Research Methodology, Computer Networks Lab |
| Dr. G Dhivyasri | gdhivyasri@gmail.com | gdhivyasri | GD | Computer Networks |
| Prof. Nisha S K | nishask@gmail.com | nishask | NSK | NOSQL Databases |
| Prof. Amarnath B Patil | amarnathbpatil@gmail.com | amarnathbpatil | ABP | Mini Project |
| Dr. Nagashree N | nagashreen@gmail.com | nagashreen | NN | Theory of Computation, Yoga |
| Prof. Anil Kumar K V | anilkumarkv@gmail.com | anilkumarkv | AKV | Environmental Studies |
| Prof. Jyoti Kumari | jyotikumari@gmail.com | jyotikumari | JK | Computer Networks Lab, PE |
| Prof. Vidyashree R | vidyashreer@gmail.com | vidyashreer | VR | Data Visualization Lab |
| Dr. Bhavana A | bhavanaa@gmail.com | bhavanaa | BA | Mini Project |
| Prof. Bhavya T N | bhavyatn@gmail.com | bhavyatn | BTN | NSS |

## Setup Instructions

### 1. Run the Staff Population Script

```bash
cd Clara-3.0
node scripts/populate-staff-complete.js
```

This script will:
- Create all 11 staff user accounts
- Generate hashed passwords
- Create complete timetables from both sections
- Display login credentials

### 2. Access the Staff Interface

1. Open `http://localhost:3000/staff.html`
2. Use any of the faculty credentials above to log in
3. View the complete timetable for that faculty member

### 3. Features Available

- **Complete Timetable View**: See all classes across both sections
- **Daily Schedule**: Organized by day of the week
- **Class Details**: Subject, time, room, class, and type
- **Office Hours**: Automatically assigned based on teaching schedule
- **Edit Capability**: Modify timetables as needed

## Timetable Structure

### Academic Information
- **Semester**: V
- **Class**: CSE (Data Science)
- **Sections**: A (Room 224) and B (Room 225)
- **Academic Year**: 2025-26

### Class Types
- **Lecture**: Regular theory classes
- **Lab**: Practical sessions
- **Break**: Coffee and lunch breaks
- **Other**: Proctor hours, forum activities, NSS/Yoga/Sports

### Time Slots
- **Morning**: 8:30 AM - 12:30 PM
- **Afternoon**: 1:15 PM - 4:10 PM
- **Break Times**: 10:20-10:40 AM, 12:30-1:15 PM

## Testing the System

### 1. Staff Login Test
```bash
# Test with Prof. Lakshmi Durga N
Email: lakshmidurgan@gmail.com
Password: lakshmidurgan
```

### 2. Clara AI Timetable Queries
Once logged in, test these queries:
- "Is Prof. Lakshmi Durga N free right now?"
- "What classes does Dr. G Dhivyasri have on Monday?"
- "Show me teachers in Computer Science Engineering department"
- "Are there any free rooms on Tuesday at 2 PM?"

### 3. Timetable Management
- Add new time slots
- Modify existing schedules
- Delete classes
- Update office hours

## Database Schema

### User Model
- `name`: Full faculty name
- `email`: Faculty email address
- `password`: Hashed password
- `role`: Set to 'staff'
- `department`: Computer Science Engineering
- `isAvailable`: Default true

### Timetable Model
- `teacherId`: Reference to User
- `teacherName`: Faculty name
- `department`: Department name
- `schedule`: Array of daily schedules
- `officeHours`: Array of office hours
- `academicYear`: 2025-26
- `semester`: V

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file

2. **Script Execution Error**
   - Install dependencies: `npm install`
   - Check Node.js version (v14+ required)

3. **Login Issues**
   - Verify email/password combination
   - Check browser console for errors

### Reset Database

To start fresh:
```bash
node scripts/populate-staff-complete.js
```

This will clear existing data and recreate everything.

## Next Steps

1. **Customize Timetables**: Modify schedules as needed
2. **Add More Faculty**: Extend the staff profiles
3. **Integrate with Calendar**: Sync with external calendar systems
4. **Notification System**: Add class reminders and updates

## Support

For technical support or questions about the timetable system, refer to the main project documentation or contact the development team.
