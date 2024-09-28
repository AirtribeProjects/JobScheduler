const express = require('express');
const router = express.Router();
const authJWT = require("../middleware/authJWT");
const jobController = require("../Controller/jobController");
const jobValidate = require("../Utils/jobUtils");
// Route to create a new job
router.post("/", authJWT,jobValidate.jobValidate,jobController.createJob);

// Route to fetch details of a specific job by jobId
router.get('/:jobId', authJWT, jobController.getJobDetails);

// Route to update a specific job by jobId
router.put('/:jobId', authJWT, jobController.updateJob);

// Cancel a specific job
router.delete('/:jobId', authJWT, jobController.cancelJob);

//get all jobs
router.get('/', authJWT, jobController.getAllJobs);

//get log for specific job
router.get('/:jobId/logs', jobController.getJobLogs);



module.exports = router;
