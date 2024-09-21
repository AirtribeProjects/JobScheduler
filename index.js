const express = require('express');
const connectToDB = require('./DB/db');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/JobRoutes');
const Job = require('./Models/JobsModel'); // Job model
const Scheduler = require('./services/scheduleTriggerServices'); // Scheduler service

const app = express();

// Connect to Database
connectToDB();

app.use(bodyParser.json());

// Routes for user APIs
app.use('/users', userRoutes);

// Routes for Jobs APIs
app.use('/jobs', jobRoutes);

const port = 3000;

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  // Initialize and start the scheduler
  const scheduler = new Scheduler(Job);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Stopping scheduler and shutting down the server...');
    scheduler.stop(); // Stop the scheduler before exiting
    process.exit(0); // Gracefully exit
  });
});
