# 🎯 Clara AI Timetable Query Demonstrations

## Example Queries and Expected Responses

### 📚 Teacher Availability Queries

#### Query: "Is Mr. Sharma free right now?"
**Expected Response:**
```
Yes! Mr. Sharma (Computer Science Engineering) is currently free. Currently free.
```

#### Query: "Is Mrs. Gupta available?"
**Expected Response:**
```
No, Mrs. Gupta (Mechanical Engineering) is currently busy. Currently teaching Thermodynamics in Room 401 (08:00-10:00)
```

#### Query: "Check if Dr. Kumar is busy"
**Expected Response:**
```
No, Dr. Kumar (Electronics & Communication Engineering) is currently busy. Currently teaching Digital Electronics in Room 301 (10:00-12:00)
```

### 📅 Teacher Schedule Queries

#### Query: "What classes does Mr. Sharma have on Monday?"
**Expected Response:**
```
Mr. Sharma (Computer Science Engineering) has the following classes on Monday:

1. Data Structures (lecture)
   Time: 09:00 - 10:00
   Room: Lab 101
   Class: CSE 3rd Year

2. Data Structures Lab (lab)
   Time: 11:00 - 13:00
   Room: Lab 101
   Class: CSE 3rd Year

Office Hours:
• 16:00 - 18:00 at Office 301
```

#### Query: "Show me Mrs. Gupta's schedule for Tuesday"
**Expected Response:**
```
Mrs. Gupta (Mechanical Engineering) has the following classes on Tuesday:

1. Machine Design (lecture)
   Time: 09:00 - 11:00
   Room: Room 402
   Class: MECH 4th Year

Office Hours:
• 15:00 - 17:00 at Office 501
```

#### Query: "What's Dr. Kumar's timetable for Wednesday?"
**Expected Response:**
```
Dr. Kumar (Electronics & Communication Engineering) has the following classes on Wednesday:

1. Communication Systems (lecture)
   Time: 09:00 - 11:00
   Room: Room 302
   Class: ECE 4th Year
```

### 🏢 Department Information Queries

#### Query: "Show me teachers in CSE department"
**Expected Response:**
```
Here are the teachers in the Computer Science Engineering department:

1. Mr. Sharma
   Email: sharma@college.edu
   Timetable: Available
   Last Updated: 8/14/2025
```

#### Query: "Who teaches in Mechanical Engineering?"
**Expected Response:**
```
Here are the teachers in the Mechanical Engineering department:

1. Mrs. Gupta
   Email: gupta@college.edu
   Timetable: Available
   Last Updated: 8/14/2025
```

### 🏫 Room Availability Queries

#### Query: "Are there any free rooms on Monday at 2 PM?"
**Expected Response:**
```
Great news! All rooms appear to be available on Monday at 14:00.
```

#### Query: "Check room availability for Tuesday 10 AM"
**Expected Response:**
```
On Tuesday at 10:00, the following rooms are occupied:

• Room 402:
  - Machine Design by Mrs. Gupta
  - Class: MECH 4th Year
  - Time: 09:00-11:00
```

#### Query: "Which rooms are occupied on Wednesday at 3 PM?"
**Expected Response:**
```
On Wednesday at 15:00, the following rooms are occupied:

• Lab 102:
  - Programming Workshop by Mr. Sharma
  - Class: CSE 2nd Year
  - Time: 14:00-16:00
```

### 🆘 Help and General Queries

#### Query: "Help with timetable"
**Expected Response:**
```
I can help you with various timetable-related questions! Here's what I can do:

📚 **Teacher Availability**: 
• "Is Mr. Sharma free right now?"
• "Is Mrs. Gupta available?"

📅 **Teacher Schedules**: 
• "What classes does Mr. Kumar have on Monday?"
• "Show me Mrs. Patel's schedule for Tuesday"

🏢 **Department Information**: 
• "Show me teachers in CSE department"
• "Who teaches in Mechanical Engineering?"

🏫 **Room Availability**: 
• "Are there any free rooms on Wednesday at 3 PM?"
• "Check room availability for Friday 11 AM"

Just ask me any of these questions and I'll help you find the information you need!
```

#### Query: "What can you tell me about timetables?"
**Expected Response:**
```
I can help you with timetable and schedule information! You can ask me about:

• Teacher availability (e.g., "Is Mr. Sharma free?")
• Teacher schedules (e.g., "What classes does Mrs. Gupta have on Thursday?")
• Department teachers (e.g., "Show me CSE teachers")
• Room availability (e.g., "Any free rooms on Monday at 2 PM?")

What would you like to know about?
```

## 🧪 Testing the System

### 1. **Start the Server**
```bash
cd Clara-3.0
npm start
```

### 2. **Access the Interfaces**
- **Staff Interface**: `http://localhost:3000/staff`
- **Client Interface**: `http://localhost:3000`

### 3. **Test Staff Interface**
1. Login with staff credentials
2. Navigate to "Timetable Management" panel
3. Click "Add Slot" to create sample schedules
4. Test different day tabs and slot management

### 4. **Test AI Queries**
1. Open the client interface
2. Start a conversation with Clara AI
3. Ask the example queries above
4. Verify responses match expected output

### 5. **Test API Endpoints**
```bash
# Get teacher availability
curl "http://localhost:3000/api/timetable/teacher/Mr.%20Sharma"

# Get department teachers
curl "http://localhost:3000/api/timetable/department/Computer%20Science%20Engineering"

# Check room availability
curl "http://localhost:3000/api/timetable/room-availability?day=monday&time=14:00"
```

## 🔍 Debugging Tips

### Check Server Logs
Look for these log messages:
```
📅 Processing timetable query...
✅ Timetable query processed successfully
❌ Timetable query error: [error details]
```

### Common Issues
1. **No Response**: Check if timetable service is running
2. **Wrong Responses**: Verify teacher names and schedules exist
3. **API Errors**: Check MongoDB connection and authentication
4. **UI Issues**: Verify CSS and JavaScript files are loaded

### Sample Data Population
Use the demo data to quickly populate test schedules:
```javascript
// In your browser console or test script
const sampleData = require('./demo-timetable.js');
// Use the data to populate timetables via API
```

---

**🎯 Ready to Test!** Use these examples to verify that your Clara AI Timetable System is working correctly. The system should provide accurate, helpful responses to all types of timetable queries!
