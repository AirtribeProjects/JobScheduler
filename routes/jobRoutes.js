const express = require('express');
const router = express.Router();
const authJWT = require("../middleware/authJWT");
const jobController = require("../Controller/jobController");
const jobValidate = require("../Utils/jobUtils");

router.post("/", authJWT,jobValidate.jobValidate,jobController.createJob);

router.get('/:jobId', authJWT, jobController.getJobDetails);

router.put('/:jobId', authJWT, jobController.updateJob);

// Cancel a specific job
router.delete('/:jobId', authJWT, jobController.cancelJob);

//get all jobs
router.get('/', authJWT, jobController.getAllJobs);



module.exports = router;