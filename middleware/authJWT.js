const jwt = require('jsonwebtoken');
const redisClient = require('../cache/redisClient').client;


const verifyToken = async(req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const userDetails = jwt.verify(token, process.env.SECRET_KEY);

    const redisToken = await redisClient.get(`userToken:${userDetails.userId}`);
    if (!redisToken || redisToken !== token) {
        return res.status(401).json({ message: 'Invalid token or session expired. Please log in again.' });
    }
    req.user = userDetails; // Attach the decoded user info (userId, role, etc.) to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = verifyToken;
