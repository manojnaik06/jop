const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/response.util');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return errorResponse(res, 401, 'Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'placement_secret_key_12345');

    // Get user from the token and attach to request
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return errorResponse(res, 401, 'User not found');
    }

    next();
  } catch (err) {
    return errorResponse(res, 401, 'Not authorized to access this route');
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
