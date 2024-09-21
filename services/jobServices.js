
const Job = require("../Models/JobsModel");
const JobSchedule = require("../Models/JobScheduleModel");
const JobParameter = require("../Models/JobParameterModel");
const { findJobById,
    findJobParametersByJobId,
    findJobScheduleByJobId,
    updateJobParameters,
    updateJobSchedule, deleteJobById, deleteSchedulesByJobId, deleteParametersByJobId,findAllJobs } = require("../Utils/jobUtils")

    const createJob = async (jobInfo, userId) => {
        const { type, parameters, schedule } = jobInfo;
    
        try {
            const job = new Job({
                type,
                status: 'pending',
                created_at: Date.now(),
                updated_at: Date.now(),
                created_by: userId
            });
            await job.save();
    
            // Save job parameters
            const parameterIds = [];
            if (parameters) {
                for (const [key, value] of Object.entries(parameters)) {
                    const param = new JobParameter({
                        job_id: job._id,
                        param_key: key,
                        param_value: value
                    });
                    await param.save();
                    parameterIds.push(param._id); // Store the parameter ID
                }
            }
    
            // Save scheduling information
            let jobScheduleId;
            if (schedule) {
                const jobSchedule = new JobSchedule({
                    job_id: job._id,
                    schedule_type: schedule.type,
                    start_time: new Date(schedule.startTime),
                    interval: schedule.recurrence ? schedule.recurrence.interval : null,
                    end_time: schedule.recurrence ? new Date(schedule.recurrence.endTime) : null,
                });
                await jobSchedule.save();
                jobScheduleId = jobSchedule._id; // Get the schedule ID
            }
    
            // Update job with parameter and schedule references
            job.parameters = parameterIds; // Assign parameters to the job
            job.schedule = jobScheduleId; // Assign schedule to the job
            await job.save(); // Save the updated job
    
            return job._id; // Return the job ID
        } catch (error) {
            console.error('Error creating job:', error);
            throw new Error('Failed to create job'); // Rethrow or handle the error as needed
        }
    };
    

// Get job details
const getJobDetails = async (jobId, userId, userRole) => {
    try {
        const job = await findJobById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        // Authorization check (only job creator or admin can view)
        if (job.created_by.toString() !== userId.toString() && userRole !== 'admin') {
            throw new Error('Access denied');
        }

        const jobParameters = await findJobParametersByJobId(jobId);
        const jobSchedule = await findJobScheduleByJobId(jobId);

        const jobDetails = {
            jobId: job._id,
            type: job.type,
            status: job.status,
            retryCount: job.retry_count,
            maxRetries: job.max_retries,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
            parameters: jobParameters.reduce((params, param) => {
                params[param.param_key] = param.param_value;
                return params;
            }, {}),
            schedule: {
                type: jobSchedule.schedule_type,
                startTime: jobSchedule.start_time,
                recurrence: {
                    interval: jobSchedule.interval,
                    endTime: jobSchedule.end_time
                }
            }
        };

        return jobDetails;
    } catch (error) {
        throw error;
    }
};

// Update a job
const updateJob = async (jobId, userId, userRole, jobData) => {
    const { type, parameters, schedule } = jobData;

    try {
        const job = await findJobById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        // Authorization check (only job creator or admin can update)
        if (job.created_by.toString() !== userId.toString() && userRole !== 'admin') {
            throw new Error('Access denied');
        }

        // Update job details (type, parameters, schedule)
        if (type) job.type = type;
        if (parameters) await updateJobParameters(jobId, parameters);
        if (schedule) await updateJobSchedule(jobId, schedule);

        job.updated_at = Date.now();
        await job.save();

        return { message: 'Job updated successfully' };
    } catch (error) {
        throw error;
    }
};

const cancelJob = async (jobId, userId, userRole) => {
    try {
        const job = await findJobById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        // Authorization check (only job creator or admin can delete the job)
        if (job.created_by.toString() !== userId.toString() && userRole !== 'admin') {
            throw new Error('Access denied');
        }

        // Proceed to delete the job
        await deleteJobById(jobId);

        // Delete associated schedules and parameters
        await deleteSchedulesByJobId(jobId);
        await deleteParametersByJobId(jobId);

        return { message: 'Job cancelled successfully' };
    } catch (error) {
        throw error;
    }
};

const getAllJobs = async (userId, userRole, status) => {
    try {
      let query = {};
  
      // Admin can see all jobs, while users can only see their own jobs
      if (userRole !== 'admin') {
        query.created_by = userId;
      }
  
      // Filter by status if provided
      if (status) {
        query.status = status;
      }
  
      // Fetch the jobs from the database
      const jobs = await findAllJobs(query);
      return jobs;
    } catch (error) {
      throw error;
    }
  };

module.exports = { createJob, getJobDetails, updateJob, cancelJob,getAllJobs };