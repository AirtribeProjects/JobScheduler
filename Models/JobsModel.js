const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  type: { type: String, required: true },
  status: { type: String, default: 'new' },
  retry_count: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastRun: { type: Date, default: null }, // Store last run timestamp
  // Reference to JobSchedules
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobSchedule'
  },

  // Reference to JobParameters
  parameters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobParameter'
  }],
  successEmailSent: { type: Boolean, default: false },
});

module.exports = mongoose.model('Job', JobSchema);
