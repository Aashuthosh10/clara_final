const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  staffId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'paused'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  endedAt: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    clientName: String,
    staffName: String,
    purpose: String,
    callCount: {
      type: Number,
      default: 0
    },
    messageCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
sessionSchema.index({ staffId: 1, status: 1 });
sessionSchema.index({ clientId: 1, status: 1 });
sessionSchema.index({ sessionId: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });

// Methods
sessionSchema.methods.endSession = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  return this.save();
};

sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.incrementCallCount = function() {
  this.metadata.callCount += 1;
  return this.save();
};

sessionSchema.methods.incrementMessageCount = function() {
  this.metadata.messageCount += 1;
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);
