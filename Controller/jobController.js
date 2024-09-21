const { validationResult } = require('express-validator');
const { createJob,getJobDetails, updateJob,cancelJob,getAllJobs } = require("../services/jobServices");


const jobController = {

    createJob: async (req, res) => {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.userId; 

        try {

            const jobId = await createJob(req.body, userId);
            return res.status(201).json({
                jobId: jobId,
                message: 'Job created successfully',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error occured while job creation' + error });
        }
    },

    // Get job details by jobId
    getJobDetails: async (req, res) => {
        const { jobId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        try {
            const jobDetails = await getJobDetails(jobId, userId, userRole);
            return res.status(200).json(jobDetails);
        } catch (error) {
            if (error.message === 'Job not found') {
                return res.status(404).json({ message: 'Job not found' }); // Return 404 for missing job
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({ message: 'Access denied' }); // Return 403 for unauthorized access
            }
            console.error('Error fetching job details:', error.message);
            return res.status(500).json({ message: 'Error fetching job details' + error.message});
        }
    },

    // Update a job
    updateJob: async (req, res) => {
        const { jobId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const result = await updateJob(jobId, userId, userRole, req.body);
            return res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Job not found') {
                return res.status(404).json({ message: 'Job not found' }); // Return 404 for missing job
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({ message: 'Access denied' }); // Return 403 for unauthorized access
            }
            console.error('Error updating job:', error.message);
            return res.status(500).json({ message: 'Error updating job'});
        }
    },

    // delete a job
    cancelJob: async (req, res) => {
        const { jobId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
      
        try {
          const result = await cancelJob(jobId, userId, userRole);
          return res.status(200).json(result); // Success
        } catch (error) {
          if (error.message === 'Job not found') {
            return res.status(404).json({ message: 'Job not found' }); // Job not found
          }
          if (error.message === 'Access denied') {
            return res.status(403).json({ message: 'Access denied' }); // Unauthorized access
          }
          console.error('Error cancelling job:', error.message);
          return res.status(500).json({ message: 'Internal server error' }); // Internal error
        }
      },

      getAllJobs: async (req, res) => {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { status } = req.query;
      
        try {
          const jobs = await getAllJobs(userId, userRole, status);
          return res.status(200).json(jobs); // Return the list of jobs
        } catch (error) {
          console.error('Error fetching jobs:', error.message);
          return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = jobController;
