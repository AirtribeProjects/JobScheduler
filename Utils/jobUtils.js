const { check } = require('express-validator');
const Job = require("../Models/JobsModel");
const JobSchedule = require("../Models/JobScheduleModel");
const  JobParameter = require("../Models/JobParameterModel");

const jobValidate = [
  check('type', 'Job type is required').not().isEmpty(),
  check('parameters.to', 'Recipient email is required and should be valid').isEmail(),
  check('parameters.subject', 'Subject is required').not().isEmpty(),
  check('parameters.body', 'Email body is required').not().isEmpty(),
  check('schedule.type', 'Schedule type is required').isIn(['one-time', 'recurring']),
  check('schedule.startTime', 'Start time is required').not().isEmpty(),
  check('schedule.recurrence.interval', 'Interval is required for recurring jobs').optional().isIn(['hourly', 'daily', 'weekly']),
];

// Find job by ID
const findJobById = async (jobId) => {
  return Job.findById(jobId);
};

// Find job parameters by job ID
const findJobParametersByJobId = async (jobId) => {
  return JobParameter.find({ job_id: jobId });
};

// Find job schedule by job ID
const findJobScheduleByJobId = async (jobId) => {
  return JobSchedule.findOne({ job_id: jobId });
};

// Update job parameters by job ID
const updateJobParameters = async (jobId, parameters) => {
  for (const key in parameters) {
    await JobParameter.updateOne(
      { job_id: jobId, param_key: key },
      { param_value: parameters[key] },
      { upsert: true }
    );
  }
};

// Update job schedule by job ID
const updateJobSchedule = async (jobId, schedule) => {
  const jobSchedule = await findJobScheduleByJobId(jobId);
  if (schedule.type) jobSchedule.schedule_type = schedule.type;
  if (schedule.startTime) jobSchedule.start_time = schedule.startTime;
  if (schedule.recurrence) {
    if (schedule.recurrence.interval) jobSchedule.interval = schedule.recurrence.interval;
    if (schedule.recurrence.endTime) jobSchedule.end_time = schedule.recurrence.endTime;
  }
  await jobSchedule.save();
};

// Delete a job by its ID
const deleteJobById = async (jobId) => {
    return await Job.findByIdAndDelete(jobId);
};

// Delete schedules associated with a job ID
const deleteSchedulesByJobId = async (jobId) => {
    return await JobSchedule.deleteMany({ job_id: jobId });
  };
  
  // Delete parameters associated with a job ID
  const deleteParametersByJobId = async (jobId) => {
    return await JobParameter.deleteMany({ job_id: jobId });
  };
  
  // find all the jobs based the status if filter is applied else return all the jobs based on authorisation
  const findAllJobs = async (query) => {
    return await Job.find(query).populate('schedule').populate('parameters');
  };

module.exports = {jobValidate, 
    findJobById,
    findJobParametersByJobId,
    findJobScheduleByJobId,
    updateJobParameters,
    updateJobSchedule,deleteJobById,deleteSchedulesByJobId,deleteParametersByJobId,findAllJobs};
