const Log = require("../Models/LoggerModel");
const emailServices = require("./emailService");
const redis = require('redis');

// Create a Redis client
const redisClient = redis.createClient();
redisClient.on("error", (err) => console.error("Redis Client Error", err));

class Scheduler {
    constructor(jobModel) {
        this.jobModel = jobModel; // Job model for database interactions
        this.jobQueue = []; // Initialize a job queue
        this.isProcessing = false; // Flag to check if processing is ongoing
        this.interval = setInterval(() => this.run(), 1000); // Check every second

        // Connect to Redis
        redisClient.connect().catch(console.error);
    }

    async run() {
        const now = new Date();
        const jobs = await this.jobModel
            .find({ status: { $in: ['pending', 'in-progress'] } }) // Retrieve both pending and in-progress jobs
            .populate('schedule') // Populate the schedule reference
            .populate('parameters'); // Populate job parameters if necessary

        for (const job of jobs) {
            if (!job.schedule) {
                console.error(`Job ${job._id} does not have an associated schedule.`);
                continue; // Skip jobs without a schedule
            }

            if (this.shouldExecute(job, now)) {
                // Check if the job is already in the queue
                if (!this.jobQueue.find(j => j.id === job.id)) {
                    this.jobQueue.push(job); // Add the job to the queue if it's not already there
                }
            }
        }

        // Process the job queue
        await this.processJobQueue();
    }

    async processJobQueue() {
        // Prevent processing if already in progress
        if (this.isProcessing) return;

        // Set the isProcessing flag early to avoid overlap
        this.isProcessing = true;

        while (this.jobQueue.length > 0) {
            const jobToProcess = this.jobQueue.shift(); // Get the next job from the queue
            await this.executeJob(jobToProcess);
        }

        // Reset the flag when done
        this.isProcessing = false;
    }

    shouldExecute(job, now) {
        const nowTimestamp = new Date(now).getTime();
        // Check if the job's start time is in the past or now
        return nowTimestamp >= new Date(job.schedule.start_time).getTime();
    }

    async executeJob(job) {
        console.log(`Executing job: ${job.id} of type: ${job.type}`);

        // Lock the job in Redis to prevent concurrent execution
        const lockKey = `job:${job.id}:lock`;
        const isLocked = await redisClient.get(lockKey);

        if (isLocked) {
            console.log(`Job ${job.id} is already locked. Skipping...`);
            return; // Skip if already locked
        }

        // Set a lock with a timeout (e.g., 10 minutes)
        await redisClient.set(lockKey, 'true', 'EX', 600); // Lock for 10 minutes

        try {
            // Check if the job is already in progress
            if (job.status === 'in-progress') {
                console.log(`Job ${job.id} is already in progress. Skipping...`);
                return; // Skip if already in progress
            }

            // Set job status to in-progress
            job.status = 'in-progress';
            await job.save(); // Save the updated status

            // Execute the job based on its type
            switch (job.type) {
                case 'email':
                    if (!job.successEmailSent) {
                        await emailServices.sendEmail(job.parameters);
                        job.successEmailSent = true; // Set the flag to true
                    }
                    break;

                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }

            console.log(`Job ${job.id} executed successfully.`);
            await this.logJobResult(job, 'success');

            // Update job status to completed
            job.status = 'completed';
            job.retryCount = 0; // Reset retry count on success
            job.lastRun = new Date();
            await job.save(); // Save the updated job status
        } catch (error) {
            console.error(`Error executing job ${job.id}:`, error);

            // Increment the retry count
            job.retryCount += 1;

            // Log failure
            await this.logJobResult(job, 'failure', error.message);

            // Retry the job if it hasn't reached max retries
            if (job.retryCount <= job.maxRetries) {
                console.log(`Retrying job ${job.id} (${job.retryCount}/${job.maxRetries})...`);
                await this.scheduleRetry(job); // Schedule the retry
            } else {
                job.status = 'failed'; // Mark job as failed after max retries
                await job.save(); // Save the updated job status

                // Notify the user about the failure
                await emailServices.notifyUser(job);
            }
        } finally {
            // Release the lock in Redis
            await redisClient.del(lockKey);
        }
    }

    async scheduleRetry(job) {
        // Set status to pending before retry
        job.status = 'pending';
        await job.save();

        // Delay the retry by a certain interval (e.g., 30 seconds)
        setTimeout(async () => {
            console.log(`Retrying job ${job.id}...`);
            await this.executeJob(job); // Retry the job
        }, 30000); // 30 seconds delay
    }

    async logJobResult(job, status, message = '') {
        const logEntry = new Log({
            job_id: job.id,
            status,
            message: status === 'success' ? `Job executed successfully.` : `Job failed: ${message}`,
        });
        await logEntry.save();
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
