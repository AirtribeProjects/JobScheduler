const { validationResult } = require('express-validator');
const { createJob, getJobDetails, updateJob, cancelJob, getAllJobs } = require("../services/jobServices");
const Logs = require('../Models/LoggerModel');

const jobController = {

    createJob: async (req, res) => {
        // Validate request body for any errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }); // Return 400 if validation fails
        }
        const userId = req.user.userId; // Extract userId from authenticated user (JWT token)

        try {
            const jobId = await createJob(req.body, userId); // Call the createJob service with job data
            return res.status(201).json({
                jobId: jobId,
                message: 'Job created successfully', // Respond with success message and jobId
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error occured while job creation' + error }); // Handle any server errors
        }
    },

    // Get job details by jobId
    getJobDetails: async (req, res) => {
        const { jobId } = req.params; // Extract jobId from request params
        const userId = req.user.userId; // Extract userId from authenticated user
        const userRole = req.user.role; // Extract userRole from authenticated user

        try {
            const jobDetails = await getJobDetails(jobId, userId, userRole); // Call getJobDetails service with jobId, userId, and role
            return res.status(200).json(jobDetails); // Return the job details in the response
        } catch (error) {
            if (error.message === 'Job not found') {
                return res.status(404).json({ message: 'Job not found' }); // Return 404 if job is not found
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({ message: 'Access denied' }); // Return 403 if user is unauthorized to access the job
            }
            console.error('Error fetching job details:', error.message);
            return res.status(500).json({ message: 'Error fetching job details' + error.message }); // Handle other errors
        }
    },

    // Update a job
    updateJob: async (req, res) => {
        const { jobId } = req.params; // Extract jobId from request params
        const userId = req.user.userId; // Extract userId from authenticated user
        const userRole = req.user.role; // Extract userRole from authenticated user

        // Check for validation errors in the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }); // Return 400 if validation fails
        }

        try {
            const result = await updateJob(jobId, userId, userRole, req.body); // Call the updateJob service with the job data
            return res.status(200).json(result); // Respond with the updated job details
        } catch (error) {
            if (error.message === 'Job not found') {
                return res.status(404).json({ message: 'Job not found' }); // Return 404 if job is not found
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({ message: 'Access denied' }); // Return 403 if user is unauthorized to update the job
            }
            console.error('Error updating job:', error.message);
            return res.status(500).json({ message: 'Error updating job' }); // Handle other errors
        }
    },

    // Cancel a job
    cancelJob: async (req, res) => {
        const { jobId } = req.params; // Extract jobId from request params
        const userId = req.user.userId; // Extract userId from authenticated user
        const userRole = req.user.role; // Extract userRole from authenticated user

        try {
            const result = await cancelJob(jobId, userId, userRole); // Call cancelJob service to cancel the job
            return res.status(200).json(result); // Return success response
        } catch (error) {
            if (error.message === 'Job not found') {
                return res.status(404).json({ message: 'Job not found' }); // Return 404 if job is not found
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({ message: 'Access denied' }); // Return 403 if user is unauthorized to cancel the job
            }
            console.error('Error cancelling job:', error.message);
            return res.status(500).json({ message: 'Internal server error' }); // Handle other server errors
        }
    },

    // Get all jobs (optionally filtered by status)
    getAllJobs: async (req, res) => {
        const userId = req.user.userId; // Extract userId from authenticated user
        const userRole = req.user.role; // Extract userRole from authenticated user
        const { status } = req.query; // Optionally filter jobs by status via query parameters

        try {
            const jobs = await getAllJobs(userId, userRole, status); // Call getAllJobs service with filtering
            return res.status(200).json(jobs); // Return the list of jobs
        } catch (error) {
            console.error('Error fetching jobs:', error.message);
            return res.status(500).json({ message: 'Internal server error' }); // Handle any server errors
        }
    },

    /**
     * Get logs for a specific job
     */
    getJobLogs: async (req, res) => {
        try {
            const { jobId } = req.params;  // Extract jobId from request params

            // Fetch logs for the specified jobId from the Logs collection
            const logs = await Logs.find({ job_id: jobId });

            if (!logs || logs.length === 0) {
                return res.status(404).json({ message: 'No logs found for this job' }); // Return 404 if no logs are found
            }

            // Return the logs in the response
            res.status(200).json(logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Error fetching logs' }); // Handle any server errors
        }
    }
};

// Properly export the jobController object
module.exports = jobController;
