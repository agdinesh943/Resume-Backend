const mongoose = require('mongoose');

const resumeLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  resumeCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Index for faster queries
resumeLogSchema.index({ resumeCode: 1 });
resumeLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ResumeLog', resumeLogSchema);


