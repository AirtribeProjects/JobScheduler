const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const userDetails = jwt.verify(token, process.env.SECRET_KEY);
    req.user = userDetails; // Attach the decoded user info (userId, role, etc.) to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = verifyToken;
