const User = require("../Models/userModel");
const userUtils = require("../Utils/userUtils");
const jwt = require("jsonwebtoken");
const { registerUser, loginUser } = require('../services/userServices');
const redisClient = require('../cache/redisClient').client;

require('dotenv').config(); // Load environment variables from .env file

// Controller functions for user-related actions
const userController = {

    /**
     * Registers a new user with the provided username, email, and password.
     * Validates user details and checks for existing users before registration.
     */
    registerUser: async(req, res) => {
        try {
            const userInfo = req.body; // Extract user details from request body
            const { userName, emailId, password } = req.body;

            // Validate user details using utility function
            if (userUtils.validateUserDetails(userInfo).status == true) {
                // Check if the user already exists by email
                let existingUser = await User.findOne({ emailId });
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists' }); // Return error if user already exists
                }
                // Register new user
                await registerUser(userInfo);
                res.status(201).json({ message: 'User registered successfully' }); // Return success message after registration
            } else {
                // If validation fails, send an error message
                let message = userUtils.validateUserDetails(userInfo).message;
                return res.status(400).send(message);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error occurred while user creation' + error }); // Handle any server errors
        }
    },

    /**
     * Logs in a user with the provided username and password.
     * Validates credentials, generates JWT token, and stores the token in Redis.
     */
    loginUser: async(req, res) => {
        try {
            const { userName, password } = req.body; // Extract username and password from request body

            // Validate login details using utility function
            if (userUtils.validateLoginDetails(req.body).status == true) {
                const user = await User.findOne({ userName }); // Find the user by username
                if (!user) {
                    return res.status(401).json({ message: 'Invalid Username' }); // Return error if user is not found
                }
                // Validate password using login service
                const isPasswordValid = await loginUser(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Incorrect Password' }); // Return error if password is incorrect
                }

                // Create a JWT token with userId and role
                const payload = { userId: user.id, role: user.role };
                const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' }); // Set token to expire in 1 hour

                // Save the JWT token in Redis with a 1-hour expiration
                await redisClient.set(`userToken:${user.id}`, token, 'EX', 3600);

                // Return userId and token in response
                res.status(200).json({ userId: user.id, token });
            } else {
                // If validation fails, send an error message
                let message = userUtils.validateLoginDetails(req.body).message;
                return res.status(400).send(message);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error occurred while user login' + error }); // Handle any server errors
        }
    },

    /**
     * Fetches the profile of the logged-in user using the userId from JWT.
     */
    getProfile: async(req, res) => {
        try {
            const user = await getProfile(req.user.userId); // Fetch user profile using userId
            res.json(user); // Return the user profile
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error'); // Handle any server errors
        }
    },

    /**
     * Logs out the user by removing the JWT token from Redis.
     * Clears the token to invalidate the session.
     */
    logoutUser: async(req, res) => {
        try {
            // Extract the JWT token from the Authorization header
            const token = req.header('Authorization').replace('Bearer ', '');

            // Verify the token and extract user details
            const userDetails = jwt.verify(token, process.env.SECRET_KEY);

            // Remove the token from Redis using the userId
            await redisClient.del(`userToken:${userDetails.userId}`);

            res.status(200).json({ message: 'Logout successful' }); // Return success message on logout
        } catch (error) {
            console.error('Error during logout:', error);
            res.status(500).json({ message: 'Error occurred during logout' }); // Handle any server errors during logout
        }
    }
};

// Export the userController object
module.exports = userController;
