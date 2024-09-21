const mongoose = require('mongoose');

const JobScheduleSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  schedule_type: { type: String, required: true },
  start_time: { type: Date },
  interval: { type: String },
  end_time: { type: Date },
  occurence: {type: Number}
});

module.exports = mongoose.model('JobSchedule', JobScheduleSchema);
