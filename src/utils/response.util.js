const successResponse = (res, status = 200, message = 'Operation successful', data = null) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

const errorResponse = (res, status = 500, message = 'Error occurred') => {
  return res.status(status).json({ success: false, message });
};

module.exports = { successResponse, errorResponse };
