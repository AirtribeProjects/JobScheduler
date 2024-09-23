
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
            const jobInstances = []; // To hold all created job instances
    
            // If the job is one-time, create a single instance
            if (schedule.type === 'one-time') {
                const job = new Job({
                    type,
                    status: 'pending',
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    created_by: userId,
                    lastRun: null // No last run yet
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
    
                // Save scheduling information for the one-time job
                const jobSchedule = new JobSchedule({
                    job_id: job._id,
                    schedule_type: 'one-time',
                    start_time: new Date(schedule.startTime),
                    interval: null, // No recurrence interval for one-time jobs
                    end_time: null, // No end time for one-time jobs
                });
                await jobSchedule.save();
    
                // Update job with parameter and schedule references
                job.parameters = parameterIds; // Assign parameters to the job
                job.schedule = jobSchedule._id; // Assign schedule to the job
                await job.save(); // Save the updated job
    
                jobInstances.push(job); // Keep track of the created job instance
            } else {
                // For recurring jobs, calculate occurrences and create multiple instances
                const occurrences = schedule.recurrence?.occurence || 1; // Default to 1 if not specified
                const startTime = new Date(schedule.startTime);
    
                for (let i = 0; i < occurrences; i++) {
                    const job = new Job({
                        type,
                        status: 'pending',
                        created_at: Date.now(),
                        updated_at: Date.now(),
                        created_by: userId,
                        lastRun: null // No last run yet
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
                    let instanceStartTime;
    
                    // Determine the start time for each instance
                    switch (schedule.recurrence.interval) {
                        case 'hourly':
                            instanceStartTime = new Date(startTime.getTime() + i * 60 * 60 * 1000); // Add hours
                            break;
                        case 'daily':
                            instanceStartTime = new Date(startTime.getTime() + i * 24 * 60 * 60 * 1000); // Add days
                            break;
                        case 'weekly':
                            instanceStartTime = new Date(startTime.getTime() + i * 7 * 24 * 60 * 60 * 1000); // Add weeks
                            break;
                        case 'monthly':
                            instanceStartTime = new Date(startTime);
                            instanceStartTime.setMonth(startTime.getMonth() + i); // Add months
                            break;
                        default:
                            instanceStartTime = new Date(startTime.getTime() + i * calculateInterval(schedule.recurrence.interval));
                    }
    
                    const jobSchedule = new JobSchedule({
                        job_id: job._id,
                        schedule_type: schedule.type,
                        start_time: instanceStartTime,
                        interval: schedule.recurrence.interval,
                        end_time: schedule.recurrence.endTime ? new Date(schedule.recurrence.endTime) : null,
                    });
                    await jobSchedule.save();
    
                    // Update job with parameter and schedule references
                    job.parameters = parameterIds; // Assign parameters to the job
                    job.schedule = jobSchedule._id; // Assign schedule to the job
                    await job.save(); // Save the updated job
    
                    jobInstances.push(job); // Keep track of all created job instances
                }
            }
    
            return jobInstances.map(job => job._id); // Return the IDs of all created jobs
        } catch (error) {
            console.error('Error creating job:', error);
            throw new Error('Failed to create job'); // Rethrow or handle the error as needed
        }
    };
    
    
    
    // Helper function to calculate the interval in milliseconds
    function calculateInterval(interval) {
        switch (interval) {
            case 'hourly':
                return 60 * 60 * 1000; // 1 hour in milliseconds
            case 'daily':
                return 24 * 60 * 60 * 1000; // 1 day in milliseconds
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000; // Approx. 1 month in milliseconds
            default:
                return 0; // No interval
        }
    }
    
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