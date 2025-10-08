const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    timeSlots: [{
      startTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      endTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      },
      subject: {
        type: String,
        required: true
      },
      room: {
        type: String,
        required: true
      },
      class: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial', 'seminar', 'office-hours'],
        default: 'lecture'
      }
    }]
  }],
  officeHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: 'Office'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-25'
  },
  semester: {
    type: String,
    required: true,
    default: '1'
  }
});

// Index for efficient queries
timetableSchema.index({ teacherId: 1, academicYear: 1, semester: 1 });
timetableSchema.index({ department: 1, day: 1 });

// Method to check if teacher is available at a specific time
timetableSchema.methods.isAvailableAt = function(day, time) {
  const daySchedule = this.schedule.find(s => s.day.toLowerCase() === day.toLowerCase());
  if (!daySchedule) return false;
  
  const timeInMinutes = this.timeToMinutes(time);
  
  // Check if time conflicts with any class
  for (const slot of daySchedule.timeSlots) {
    const startMinutes = this.timeToMinutes(slot.startTime);
    const endMinutes = this.timeToMinutes(slot.endTime);
    
    if (timeInMinutes >= startMinutes && timeInMinutes < endMinutes) {
      return false;
    }
  }
  
  return true;
};

// Method to get current availability status
timetableSchema.methods.getCurrentStatus = function() {
  const now = new Date();
  const currentDay = this.getDayName(now.getDay());
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const daySchedule = this.schedule.find(s => s.day.toLowerCase() === currentDay.toLowerCase());
  if (!daySchedule) return { available: true, message: 'No classes scheduled today' };
  
  const currentTimeMinutes = this.timeToMinutes(currentTime);
  
  for (const slot of daySchedule.timeSlots) {
    const startMinutes = this.timeToMinutes(slot.startTime);
    const endMinutes = this.timeToMinutes(slot.endTime);
    
    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return {
        available: false,
        message: `Currently teaching ${slot.subject} in ${slot.room} (${slot.startTime}-${slot.endTime})`,
        currentClass: slot
      };
    }
  }
  
  return { available: true, message: 'Currently free' };
};

// Helper method to convert time to minutes
timetableSchema.methods.timeToMinutes = function(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper method to get day name
timetableSchema.methods.getDayName = function(dayNumber) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber];
};

// Pre-save middleware to update lastUpdated
timetableSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);
