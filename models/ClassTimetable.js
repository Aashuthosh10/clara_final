const mongoose = require('mongoose');

const classTimetableSchema = new mongoose.Schema({
  semester: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  academic_year: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  timetable: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    slots: [{
      start_time: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      end_time: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      },
      subject_code: {
        type: String,
        default: null
      },
      subject_name: {
        type: String,
        required: true
      },
      faculty: {
        type: String,
        default: null
      },
      note: {
        type: String,
        default: null
      }
    }]
  }],
  subject_faculty_map: [{
    subject_code: {
      type: String,
      required: true
    },
    subject_name: {
      type: String,
      required: true
    },
    faculty: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
classTimetableSchema.index({ semester: 1, class: 1, section: 1, academic_year: 1 });
classTimetableSchema.index({ isActive: 1, lastUpdated: -1 });

// Pre-save middleware
classTimetableSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('ClassTimetable', classTimetableSchema);
