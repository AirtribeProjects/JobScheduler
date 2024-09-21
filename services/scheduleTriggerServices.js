const Log = require("../Models/LoggerModel")
const emailServices = require("./emailService");
class Scheduler {
  constructor(jobModel) {
    this.jobModel = jobModel; // Job model for database interactions
    this.interval = setInterval(() => this.run(), 1000); // Check every second
  }

  async run() {
    const now = new Date();
    const jobs = await this.jobModel
    .find({ status: 'pending' })
    .populate('schedule') // Populate the schedule reference
    .populate('parameters'); // Populate job parameters if necessary

    for (const job of jobs) {
      if (!job.schedule) {
        console.error(`Job ${job._id} does not have an associated schedule.`);
        continue; // Skip jobs without a schedule
      }
      if (this.shouldExecute(job, now)) {
        await this.executeJob(job);
      }
    }
  }

  shouldExecute(job, now) {
    if (job.schedule.schedule_type === 'one-time') {
      return now >= job.schedule.start_time;
    } else if (job.schedule.schedule_type === 'recurring') {
      const lastRun = job.lastRun || job.schedule.start_time;
      let nextRun;

      if (job.schedule.interval === 'hourly') {
        nextRun = new Date(lastRun).setHours(new Date(lastRun).getHours() + 1);
      } else if (job.schedule.interval === 'daily') {
        nextRun = new Date(lastRun).setDate(new Date(lastRun).getDate() + 1);
      } else if (job.schedule.interval === 'weekly') {
        nextRun = new Date(lastRun).setDate(new Date(lastRun).getDate() + 7);
      }

      return now >= nextRun;
    }
    return false;
  }

  async executeJob(job) {
    console.log(`Executing job: ${job.id} of type: ${job.type}`);
    try {
      switch (job.type) {
        case 'email':
          await emailServices.sendEmail(job.parameters);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
  
      console.log(`Job ${job.id} executed successfully.`);
  
      // Log success
      const logEntry = new Log({
        job_id: job.id,
        status: 'success',
        message: `Job executed successfully.`,
      });
      await logEntry.save();
  
      job.lastRun = new Date();
      job.retryCount = 0; // Reset retry count on success
      job.status = 'completed';
      await job.save();
    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error);
  
      // Increment the retry count
      job.retry_count += 1;
  
      // Log failure
      const logEntry = new Log({
        job_id: job.id,
        status: 'failure',
        message: error.message,
      });
      await logEntry.save();
  
      if (job.retry_count <= job.max_retries) {
        console.log(`Retrying job ${job.id} (${job.retry_count}/${job.maxRetries})...`);
        await this.scheduleRetry(job); // Schedule the retry
      } else {
        job.status = 'failed'; // Mark job as failed after max retries
        await job.save();
        await emailServices.notifyUser(job); // Notify the user about the failure
      }
    }
  }

  async scheduleRetry(job) {
    // Set status to pending before retry
    job.status = 'pending';
    await job.save();
  
    // Immediately retry the job by re-calling the executeJob function
    console.log(`Retrying job ${job.id} immediately...`);
    await this.executeJob(job);
  }

  // Stop the scheduler
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('Scheduler stopped');
    }
  }
}

// Properly export the Scheduler class
module.exports = Scheduler;
