const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  timeSlot: {
    start: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    end: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    }
  },
  activity: {
    type: String,
    required: true,
    enum: ['Teaching', 'Office Hours', 'Meeting', 'Lab Session', 'Consultation', 'Free', 'Busy']
  },
  subject: {
    type: String,
    trim: true
  },
  room: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  exceptions: [{
    date: Date,
    reason: String,
    isCancelled: Boolean
  }]
});

const staffTimetableSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-25'
  },
  semester: {
    type: String,
    required: true,
    enum: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester']
  },
  entries: [timetableEntrySchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
staffTimetableSchema.index({ staffId: 1, academicYear: 1, semester: 1 });
staffTimetableSchema.index({ 'entries.day': 1, 'entries.timeSlot.start': 1 });

// Method to check if staff is free at a specific time
staffTimetableSchema.methods.isFreeAt = function(day, time) {
  const entry = this.entries.find(e => 
    e.day === day && 
    e.timeSlot.start <= time && 
    e.timeSlot.end > time
  );
  
  return !entry || entry.activity === 'Free';
};

// Method to get today's schedule
staffTimetableSchema.methods.getTodaySchedule = function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  if (today === 'Sunday') return [];
  
  return this.entries
    .filter(e => e.day === today)
    .sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start));
};

// Method to get next available slot
staffTimetableSchema.methods.getNextAvailableSlot = function(day, time) {
  const dayEntries = this.entries
    .filter(e => e.day === day)
    .sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start));
  
  for (let entry of dayEntries) {
    if (entry.activity === 'Free' && entry.timeSlot.start >= time) {
      return entry;
    }
  }
  
  return null;
};

// Method to get weekly schedule
staffTimetableSchema.methods.getWeeklySchedule = function() {
  const schedule = {};
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
    schedule[day] = this.entries
      .filter(e => e.day === day)
      .sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start));
  });
  
  return schedule;
};

// Static method to find staff by availability
staffTimetableSchema.statics.findAvailableStaff = function(day, time, department = null) {
  const query = {
    isActive: true,
    'entries.day': day,
    $or: [
      { 'entries.activity': 'Free' },
      { 'entries.timeSlot.start': { $lte: time }, 'entries.timeSlot.end': { $gt: time } }
    ]
  };
  
  if (department) {
    // For string-based staffId, we'll need to handle this differently
    // For now, just return all available staff timetables
  }
  
  return this.find(query);
};

module.exports = mongoose.model('StaffTimetable', staffTimetableSchema);
