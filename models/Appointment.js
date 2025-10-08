const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
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
  duration: {
    type: Number, // in minutes
    required: true,
    default: 30
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'],
    default: 'Pending'
  },
  appointmentType: {
    type: String,
    required: true,
    enum: ['Video Call', 'In-Person', 'Phone Call'],
    default: 'In-Person'
  },
  location: {
    type: String,
    trim: true,
    default: 'Office'
  },
  notes: {
    type: String,
    trim: true
  },
  staffNotes: {
    type: String,
    trim: true
  },
  qrCode: {
    data: String,
    imageUrl: String,
    generatedAt: Date
  },
  videoCallDetails: {
    callId: String,
    startTime: Date,
    endTime: Date,
    duration: Number,
    recordingUrl: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['Email', 'SMS', 'Push'],
      required: true
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending'
    }
  }],
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: String,
    enum: ['Client', 'Staff', 'System'],
    default: 'System'
  },
  cancelledAt: Date,
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ staffId: 1, appointmentDate: 1 });
appointmentSchema.index({ clientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ 'qrCode.data': 1 });

// Generate unique appointment ID
appointmentSchema.pre('save', async function(next) {
  if (!this.appointmentId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.appointmentId = `APT${year}${month}${day}${random}`;
  }
  next();
});

// Method to check if appointment is in the future
appointmentSchema.methods.isInFuture = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(
    parseInt(this.appointmentTime.start.split(':')[0]),
    parseInt(this.appointmentTime.start.split(':')[1])
  );
  return appointmentDateTime > now;
};

// Method to check if appointment is today
appointmentSchema.methods.isToday = function() {
  const today = new Date().toDateString();
  const appointmentDate = new Date(this.appointmentDate).toDateString();
  return today === appointmentDate;
};

// Method to get appointment status color
appointmentSchema.methods.getStatusColor = function() {
  const statusColors = {
    'Pending': '#ffc107',
    'Confirmed': '#17a2b8',
    'Completed': '#28a745',
    'Cancelled': '#dc3545',
    'No-Show': '#6c757d'
  };
  return statusColors[this.status] || '#6c757d';
};

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(
    parseInt(this.appointmentTime.start.split(':')[0]),
    parseInt(this.appointmentTime.start.split(':')[1])
  );
  
  // Can cancel if appointment is more than 2 hours away
  const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  return appointmentDateTime > twoHoursFromNow && this.status === 'Confirmed';
};

// Method to get appointment summary
appointmentSchema.methods.getSummary = function() {
  return {
    id: this.appointmentId,
    clientName: this.clientName,
    staffName: this.staffId, // Will be populated when querying
    purpose: this.purpose,
    date: this.appointmentDate,
    time: `${this.appointmentTime.start} - ${this.appointmentTime.end}`,
    status: this.status,
    type: this.appointmentType
  };
};

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function(staffId = null, limit = 10) {
  const query = {
    appointmentDate: { $gte: new Date() },
    status: { $in: ['Pending', 'Confirmed'] }
  };
  
  if (staffId) {
    query.staffId = staffId;
  }
  
  return this.find(query)
    .sort({ appointmentDate: 1, 'appointmentTime.start': 1 })
    .limit(limit)
    .populate('staffId', 'name department designation')
    .populate('clientId', 'name email');
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, staffId = null) {
  const query = {
    appointmentDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (staffId) {
    query.staffId = staffId;
  }
  
  return this.find(query)
    .sort({ appointmentDate: 1, 'appointmentTime.start': 1 })
    .populate('staffId', 'name department designation')
    .populate('clientId', 'name email');
};

module.exports = mongoose.model('Appointment', appointmentSchema);
