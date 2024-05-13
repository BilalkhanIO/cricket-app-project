// backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import JWT_SECRET from '../config.js';

const authenticate = (req, res, next) => {
  // Extract the token from the Authorization header
  const token = req.headers.authorization.split(' ')[1];
  
  try {
    // Verify the token using the JWT_SECRET
    const decodedToken = jwt.verify(token,JWT_SECRET);
    
    // Attach user data to the request object
    req.userData = { userId: decodedToken.userId, email: decodedToken.email };
    
    // Call next middleware or route handler
    next();
  } catch (error) {
    // Return authentication failed error if token is invalid
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export default authenticate;
