import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect Routes - Check if user is logged in
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'You are not logged in' });
  }

  try {
    // 1) Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ status: 'fail', message: 'User belonging to this token no longer exists' });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  }
};

/**
 * Restrict to certain roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'You do not have permission' });
    }
    next();
  };
};
