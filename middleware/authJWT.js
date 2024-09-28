const jwt = require('jsonwebtoken');
const redisClient = require('../cache/redisClient').client;

/**
 * Middleware to verify the JWT token and ensure the user is authenticated.
 * It checks if the token exists, validates the token, and verifies it against the Redis store.
 * If the token is valid, user details are attached to the request object.
 */
const verifyToken = async (req, res, next) => {
  // Retrieve the token from the Authorization header
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' }); // Return 401 if token is missing
  }

  try {
    // Verify the token using the secret key and extract user details
    const userDetails = jwt.verify(token, process.env.SECRET_KEY);

    // Fetch the token stored in Redis using the userId
    const redisToken = await redisClient.get(`userToken:${userDetails.userId}`);
    
    // Check if the token from Redis matches the one in the request
    if (!redisToken || redisToken !== token) {
      return res.status(401).json({ message: 'Invalid token or session expired. Please log in again.' }); // Return 401 for expired or invalid tokens
    }

    // Attach the decoded user details (e.g., userId, role) to the request object for use in subsequent middleware/routes
    req.user = userDetails;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle invalid token errors
    return res.status(401).json({ message: 'Token is not valid' }); // Return 401 for invalid tokens
  }
};

module.exports = verifyToken; // Export the token verification middleware
