const mongoose = require('mongoose');

const JobParameterSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  param_key: { type: String, required: true },
  param_value: { type: String, required: true }
});

module.exports = mongoose.model('JobParameter', JobParameterSchema);
