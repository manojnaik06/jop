const { errorResponse } = require('../utils/response.util');

const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, 'Route not found');
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  return errorResponse(res, status, message);
};

module.exports = { notFoundHandler, errorHandler };
