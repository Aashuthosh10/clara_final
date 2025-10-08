const TimetableService = require('./timetableService');

class TimetableQueryHandler {
  constructor() {
    this.timetableService = new TimetableService();
  }

  /**
   * Process timetable-related queries and return appropriate responses
   */
  async processTimetableQuery(message) {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Check for availability queries
      if (this.isAvailabilityQuery(lowerMessage)) {
        return await this.handleAvailabilityQuery(message);
      }
      
      // Check for schedule queries
      if (this.isScheduleQuery(lowerMessage)) {
        return await this.handleScheduleQuery(message);
      }
      
      // Check for department queries
      if (this.isDepartmentQuery(lowerMessage)) {
        return await this.handleDepartmentQuery(message);
      }
      
      // Check for room availability queries
      if (this.isRoomQuery(lowerMessage)) {
        return await this.handleRoomQuery(message);
      }
      
      // Check for general timetable help
      if (this.isHelpQuery(lowerMessage)) {
        return this.getTimetableHelp();
      }
      
      // Default response for unrecognized timetable queries
      return this.getDefaultTimetableResponse();
      
    } catch (error) {
      console.error('Error processing timetable query:', error);
      return 'I apologize, but I\'m having trouble accessing the timetable information right now. Please try again in a moment.';
    }
  }

  /**
   * Check if the message is asking about teacher availability
   */
  isAvailabilityQuery(message) {
    const availabilityKeywords = [
      'free', 'available', 'busy', 'teaching', 'class', 'occupied',
      'is', 'are', 'free right now', 'available now', 'currently'
    ];
    
    return availabilityKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if the message is asking about teacher schedules
   */
  isScheduleQuery(message) {
    const scheduleKeywords = [
      'schedule', 'classes', 'timetable', 'what classes', 'when does',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    
    return scheduleKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if the message is asking about department information
   */
  isDepartmentQuery(message) {
    const departmentKeywords = [
      'department', 'cse', 'mechanical', 'civil', 'ece', 'ise',
      'computer science', 'electrical', 'information science'
    ];
    
    return departmentKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if the message is asking about room availability
   */
  isRoomQuery(message) {
    const roomKeywords = [
      'room', 'lab', 'available room', 'free room', 'classroom'
    ];
    
    return roomKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if the message is asking for help
   */
  isHelpQuery(message) {
    const helpKeywords = [
      'help', 'how to', 'what can', 'timetable', 'schedule'
    ];
    
    return helpKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle availability queries
   */
  async handleAvailabilityQuery(message) {
    // Extract teacher name from the message
    const teacherName = this.extractTeacherName(message);
    
    if (!teacherName) {
      return 'I\'d be happy to check a teacher\'s availability! Could you please tell me which teacher you\'re asking about? For example: "Is Mr. Sharma free right now?" or "Is Mrs. Gupta available?"';
    }

    try {
      const availability = await this.timetableService.getTeacherAvailability(teacherName);
      
      if (availability.error) {
        return `I'm sorry, but I couldn't find timetable information for ${teacherName}. ${availability.error}`;
      }

      const { teacherName: name, department, currentStatus } = availability;
      
      if (currentStatus.available) {
        return `Yes! ${name} (${department}) is currently free. ${currentStatus.message}`;
      } else {
        return `No, ${name} (${department}) is currently busy. ${currentStatus.message}`;
      }
      
    } catch (error) {
      return `I'm sorry, but I'm having trouble checking ${teacherName}'s availability right now. Please try again later.`;
    }
  }

  /**
   * Handle schedule queries
   */
  async handleScheduleQuery(message) {
    // Extract teacher name and day from the message
    const teacherName = this.extractTeacherName(message);
    const day = this.extractDay(message);
    
    if (!teacherName) {
      return 'I\'d be happy to show you a teacher\'s schedule! Could you please tell me which teacher you\'re asking about? For example: "What classes does Mrs. Gupta have on Thursday?"';
    }

    try {
      if (day) {
        // Get schedule for specific day
        const schedule = await this.timetableService.getTeacherSchedule(teacherName, day);
        
        if (schedule.error) {
          return `I'm sorry, but I couldn't find schedule information for ${teacherName}. ${schedule.error}`;
        }

        if (schedule.schedule.length === 0) {
          return `${schedule.teacherName} (${schedule.department}) has no classes scheduled for ${this.capitalizeFirst(day)}.`;
        }

        let response = `${schedule.teacherName} (${schedule.department}) has the following classes on ${this.capitalizeFirst(day)}:\n\n`;
        
        schedule.schedule.forEach((slot, index) => {
          response += `${index + 1}. ${slot.subject} (${slot.type})\n`;
          response += `   Time: ${slot.startTime} - ${slot.endTime}\n`;
          response += `   Room: ${slot.room}\n`;
          response += `   Class: ${slot.class}\n\n`;
        });

        // Add office hours if available
        if (schedule.officeHours && schedule.officeHours.length > 0) {
          response += `Office Hours:\n`;
          schedule.officeHours.forEach(oh => {
            response += `• ${oh.startTime} - ${oh.endTime} at ${oh.location}\n`;
          });
        }

        return response;
        
      } else {
        // Get current availability
        const availability = await this.timetableService.getTeacherAvailability(teacherName);
        
        if (availability.error) {
          return `I'm sorry, but I couldn't find timetable information for ${teacherName}. ${availability.error}`;
        }

        const { teacherName: name, department, currentStatus } = availability;
        
        if (currentStatus.available) {
          return `${name} (${department}) is currently free. ${currentStatus.message}`;
        } else {
          return `${name} (${department}) is currently busy. ${currentStatus.message}`;
        }
      }
      
    } catch (error) {
      return `I'm sorry, but I'm having trouble accessing ${teacherName}'s schedule right now. Please try again later.`;
    }
  }

  /**
   * Handle department queries
   */
  async handleDepartmentQuery(message) {
    // Extract department from the message
    const department = this.extractDepartment(message);
    
    if (!department) {
      return 'I\'d be happy to show you teachers in a department! Could you please specify which department? For example: "Show me teachers in CSE" or "Who teaches in Mechanical Engineering?"';
    }

    try {
      const teachers = await this.timetableService.getDepartmentTeachers(department);
      
      if (teachers.length === 0) {
        return `I couldn't find any teachers in the ${department} department. Please check the department name and try again.`;
      }

      let response = `Here are the teachers in the ${department} department:\n\n`;
      
      teachers.forEach((teacher, index) => {
        response += `${index + 1}. ${teacher.name}\n`;
        response += `   Email: ${teacher.email}\n`;
        response += `   Timetable: ${teacher.hasTimetable ? 'Available' : 'Not set'}\n`;
        if (teacher.lastTimetableUpdate) {
          response += `   Last Updated: ${new Date(teacher.lastTimetableUpdate).toLocaleDateString()}\n`;
        }
        response += '\n';
      });

      return response;
      
    } catch (error) {
      return `I'm sorry, but I'm having trouble accessing the ${department} department information right now. Please try again later.`;
    }
  }

  /**
   * Handle room availability queries
   */
  async handleRoomQuery(message) {
    // Extract day and time from the message
    const day = this.extractDay(message);
    const time = this.extractTime(message);
    
    if (!day || !time) {
      return 'I\'d be happy to check room availability! Could you please specify the day and time? For example: "Are there any free rooms on Monday at 2 PM?" or "Check room availability for Tuesday 10 AM"';
    }

    try {
      const roomAvailability = await this.timetableService.getRoomAvailability(day, time);
      
      if (roomAvailability.length === 0) {
        return `Great news! All rooms appear to be available on ${this.capitalizeFirst(day)} at ${time}.`;
      }

      let response = `On ${this.capitalizeFirst(day)} at ${time}, the following rooms are occupied:\n\n`;
      
      roomAvailability.forEach(room => {
        response += `• ${room.room}:\n`;
        room.usage.forEach(usage => {
          response += `  - ${usage.subject} by ${usage.teacher}\n`;
          response += `  - Class: ${usage.class}\n`;
          response += `  - Time: ${usage.time}\n\n`;
        });
      });

      return response;
      
    } catch (error) {
      return `I'm sorry, but I'm having trouble checking room availability right now. Please try again later.`;
    }
  }

  /**
   * Get timetable help information
   */
  getTimetableHelp() {
    return `I can help you with various timetable-related questions! Here's what I can do:

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

Just ask me any of these questions and I'll help you find the information you need!`;
  }

  /**
   * Get default response for unrecognized timetable queries
   */
  getDefaultTimetableResponse() {
    return `I can help you with timetable and schedule information! You can ask me about:

• Teacher availability (e.g., "Is Mr. Sharma free?")
• Teacher schedules (e.g., "What classes does Mrs. Gupta have on Thursday?")
• Department teachers (e.g., "Show me CSE teachers")
• Room availability (e.g., "Any free rooms on Monday at 2 PM?")

What would you like to know about?`;
  }

  /**
   * Extract teacher name from message
   */
  extractTeacherName(message) {
    // Common teacher title patterns - improved to capture full names
    const patterns = [
      // Match "Prof. Bhavya T N" or "Dr. Anitha C S" - full names with initials
      /(?:mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+([a-z]+(?:\s+[a-z])*)/gi,
      // Match "is Bhavya free" or "is Anitha available"
      /(?:is|are)\s+([a-z]+(?:\s+[a-z])*)\s+(?:free|available|busy|teaching)/gi,
      // Match "what does Bhavya have" or "when does Anitha teach"
      /(?:what|when)\s+(?:does|do)\s+([a-z]+(?:\s+[a-z])*)\s+have/gi,
      // Match "Bhavya schedule" or "Anitha classes"
      /([a-z]+(?:\s+[a-z])*)\s+(?:schedule|classes|timetable)/gi,
      // Match "professor Bhavya" or "teacher Anitha"
      /(?:professor|teacher|lecturer)\s+([a-z]+(?:\s+[a-z])*)/gi
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Clean up the extracted name and capitalize properly
        const cleanName = match[1].trim().replace(/\s+/g, ' ');
        return this.capitalizeFullName(cleanName);
      }
    }
    
    return null;
  }

  /**
   * Extract day from message
   */
  extractDay(message) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      if (message.includes(day)) {
        return day;
      }
    }
    
    return null;
  }

  /**
   * Extract department from message
   */
  extractDepartment(message) {
    const departments = {
      'cse': 'Computer Science Engineering',
      'computer science': 'Computer Science Engineering',
      'mechanical': 'Mechanical Engineering',
      'civil': 'Civil Engineering',
      'ece': 'Electronics & Communication Engineering',
      'electrical': 'Electronics & Communication Engineering',
      'ise': 'Information Science Engineering',
      'information science': 'Information Science Engineering'
    };
    
    for (const [key, value] of Object.entries(departments)) {
      if (message.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Extract time from message
   */
  extractTime(message) {
    // Look for time patterns like "2 PM", "10 AM", "14:00", etc.
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)?/gi,
      /(\d{1,2})\s*(am|pm)/gi
    ];
    
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        // Convert to 24-hour format for the API
        let hours = parseInt(match[1]);
        let minutes = match[2] ? parseInt(match[2]) : 0;
        
        if (match[3] && match[3].toLowerCase() === 'pm' && hours !== 12) {
          hours += 12;
        } else if (match[3] && match[3].toLowerCase() === 'am' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  }

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Capitalize full name with proper handling of initials
   */
  capitalizeFullName(str) {
    if (!str) return str;
    
    // Split by spaces and capitalize each part
    const parts = str.split(' ');
    const capitalizedParts = parts.map(part => {
      if (part.length === 1) {
        // Single letter (initial) - keep as is
        return part.toUpperCase();
      } else if (part.length === 2 && part.endsWith('.')) {
        // Two-letter initial with dot (e.g., "T.") - capitalize first letter
        return part.charAt(0).toUpperCase() + part.slice(1);
      } else {
        // Regular word - capitalize first letter
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
    });
    
    return capitalizedParts.join(' ');
  }
}

module.exports = TimetableQueryHandler;
