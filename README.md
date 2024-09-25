# JobScheduler

This project is a distributed job scheduling and management system built with Express.js, MongoDB, Redis, BullMQ, and Node-Cron. It provides functionality to handle one-time and recurring jobs with job submission, monitoring, retries, and logging capabilities. 

## Key Features

### User Authentication and Management
- **Register user:** create new user with name,email and password.
- **Login user:** authenticate the user with username and password
- **view profile:** view user profile of logged in user
- **logout user:** log out the logged in user


### User Authentication and Management

- **Job Submission:** Supports both one-time and recurring jobs.
- **Job Processing:** Efficient job queueing and processing using Redis.
- **Job Logs and Monitoring:** Logs are stored in MongoDB for each job execution.
- **Retry Mechanism:** Failed jobs can automatically retry up to a specified maximum number of attempts.
- **Job Metadata Management:** MongoDB stores job details, parameters, schedules, and logs.
- **Failure Notification:** Failure Notification: Users are notified via email if their job fails after all retry attempts.

## System Components

### Backend Framework

- **Express.js:** Handles the API routing, middleware, and user authentication.

### Job Queuing and Scheduling

- **in-memory queue:** Jobs are placed into an in-memory queue and processed sequentially.
- **Redis:** Redis is used to lock jobs and prevent concurrent executions of the same job.

### Database

- **MongoDB:** Stores job metadata, job parameters, schedules, and logs.

### Authentication

- **JWT (JSON Web Tokens):** Used for secure user authentication.

## Database Design

- **Jobs**
  - `job_id`: Unique identifier for the job.
  - `type`: The type of job (e.g., "email", "data processing").
  - `status`: The current status of the job (e.g., pending, completed).
  - `retry_count`: Number of retries attempted for the job.
  - `max_retries`: Maximum number of retries allowed.
  - `created_at`: Job creation timestamp.
  - `updated_at`: Last update timestamp.
  
- **JobParameters**
  - `parameter_id`: Unique identifier for the job parameters.
  - `job_id`: Foreign key to the `Jobs` table.
  - `param_key`: Key for the parameter (e.g., "to", "subject").
  - `param_value`: Value for the parameter.
  
- **JobSchedules**
  - `schedule_id`: Unique identifier for the schedule.
  - `job_id`: Foreign key to the `Jobs` table.
  - `schedule_type`: Type of schedule ("one-time" or "recurring").
  - `start_time`: Scheduled start time.
  - `interval`: Interval for recurring jobs.
  - `end_time`: End time for recurring jobs.
  
- **Logs**
  - `log_id`: Unique identifier for the log entry.
  - `job_id`: Foreign key to the `Jobs` table.
  - `timestamp`: Time of the log entry.
  - `status`: Status of the job at the time of logging.
  - `message`: Log message.
  - `error`: Error details if applicable.

- **Users**
  - `user_id`: Unique identifier for the user.
  - `username`: Username of the user.
  - `email`: Email address of the user.
  - `hashed_password`: Encrypted user password.
  - `created_at`: Timestamp when the user was created.
  - `updated_at`: Last update timestamp for the user record.


  ## Installation

1. Clone the repository:

git clone   https://github.com/AirtribeProjects/JobScheduler.git

2. Navigate to the project directory:

cd JobScheduler

3. Install dependencies:

npm init

npm install express mongoose bcryptjs jsonwebtoken dotenv redis nodemailer express-validator

4. Environment Setup: Create a .env file in the root directory with the following variables:
SECRET_KEY = <your key>
MONGO_DB_URI= <your mongdb url>
SENDER_EMAIL_ID = <sender email id>
SENDER_APP_PASSWORD = <app password>


## Usage

1. Start the server:

node index.js

2. Use Postman or any HTTP client to interact with the API.

## Key APIs

### 1. Job Creation

Submit a one-time or recurring job.

- **Endpoint:** `POST /api/jobs`
- **Request Body:**
```json

  {
  "type": "string",  // Type of job (e.g., "email", "data processing")
  "parameters": {    // Job-specific parameters
    "to": "string",
    "subject": "string",
    "body": "string"
  },
  "schedule": {      // Scheduling information
    "type": "string", // "one-time" or "recurring"
    "startTime": "ISODate", // For one-time jobs
    "recurrence": {  // For recurring jobs
      "interval": "string", // e.g., "hourly", "daily", "weekly"
      "endTime": "ISODate"  // Optional end date for recurrence
    }
  }
  }
```
- **Response:**

```json
{
  "jobId": "string", // Unique identifier for the job
  "message": "Job created successfully"
}
```

### 2. Get Job Details

Retrieves details about a specific job.[only admins and creator will be able to view the job details]
- **Endpoint:** `GET /api/jobs/:jobId`

- **Response:**

```json
{
  "jobId": "string",
  "type": "string",
  "status": "string",
  "retryCount": "number",
  "maxRetries": "number",
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "parameters": {
    "to": "string",
    "subject": "string",
    "body": "string"
  },
  "schedule": {
    "type": "string",
    "startTime": "ISODate",
    "recurrence": {
      "interval": "string",
      "endTime": "ISODate"
    }
  }
}
```

### 3.Update Job

Updates details of an existing job (e.g., rescheduling, changing parameters).

- **Endpoint:** `GET /api/jobs/:jobId`

- **Request Body:**
Endpoint: PUT /api/jobs/:jobId

Request Body:
json
Copy code
{
  "type": "string",           // Type of job (if changed)
  "parameters": {             // Updated job-specific parameters
    "to": "string",
    "subject": "string",
    "body": "string"
  },
  "schedule": {               // Updated scheduling information
    "type": "string",         // "one-time" or "recurring"
    "startTime": "ISODate",   // For one-time jobs
    "recurrence": {           // For recurring jobs
      "interval": "string",   // e.g., "hourly", "daily", "weekly"
      "endTime": "ISODate"    // Optional end date for recurrence
    }
  }
}
Response:
json
Copy code
{
  "message": "Job updated successfully"
}
4. Cancel Job
Deletes the specific job.

- **Endpoint:** `GET /api/jobs/:jobId`

- **Request Body:**

Endpoint: DELETE /api/jobs/:jobId
Response:
json
Copy code
{
  "message": "Job cancelled successfully"
}

### 5. Get All Jobs
Retrieves a list of all jobs with optional filtering based on status or user.

- **Endpoint:** `GET /api/jobs`

- **Request parameter:**

```json
{
  "status": "string",  // Optional filter by job status
  "userId": "string"   // Optional filter by user
}
```
- **Response:**

```json
[
  {
    "jobId": "string",
    "type": "string",
    "status": "string",
    "retryCount": "number",
    "maxRetries": "number",
    "createdAt": "ISODate",
    "updatedAt": "ISODate"
  }
]
```
### 6. Get Job Logs
Retrieves logs for a specific job.

- **Endpoint:** `GET /api/jobs/:jobId/logs`
- **Response:**
```json
[
  {
    "logId": "string",
    "timestamp": "ISODate",
    "status": "string",
    "message": "string"
  }
]
```

## Error Handling

- Proper error handling is implemented for invalid requests.
- Input validation is performed for task creation and updates.







