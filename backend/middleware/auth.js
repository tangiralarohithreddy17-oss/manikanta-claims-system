const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'manikanta_secret_key_123!';

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(411).json({ message: 'No token, authorization denied' });
  }

  // Token is usually "Bearer TOKEN_STRING"
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
