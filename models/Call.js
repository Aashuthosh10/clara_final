const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'rejected'],
    default: 'waiting'
  },
  callType: {
    type: String,
    enum: ['video', 'audio'],
    default: 'video'
  },
  purpose: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  decision: {
    type: String,
    enum: ['accepted', 'rejected', 'pending'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  // New field for call updates
  updates: [{
    notes: String,
    disposition: String,
    followUpRequired: { type: Boolean, default: false },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  // Audit fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
callSchema.index({ staffId: 1, status: 1, createdAt: -1 });
callSchema.index({ clientId: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

callSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Call', callSchema);
