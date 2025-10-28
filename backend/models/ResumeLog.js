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
    unique: true, // This already creates an index automatically
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Index for faster queries by date (for sorting recent logs)
resumeLogSchema.index({ createdAt: -1 });

// Note: resumeCode already has a unique index automatically created by unique: true

module.exports = mongoose.model('ResumeLog', resumeLogSchema);


