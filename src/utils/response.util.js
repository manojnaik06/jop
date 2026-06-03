const successResponse = (res, status = 200, message = 'Operation successful', data = null) => {
  if (typeof status === 'string') {
    data = message;
    message = status;
    status = 200;
  }
  const payload = { success: true, message };
  if (data !== null) {
    if (data.pagination) {
      payload.page = data.pagination.page;
      payload.limit = data.pagination.limit;
      payload.total = data.pagination.total;
      payload.totalPages = data.pagination.totalPages;
      const listKey = Object.keys(data).find(key => key !== 'pagination');
      payload.data = data[listKey] || [];
    } else {
      payload.data = data;
    }
  }
  return res.status(status).json(payload);
};

const errorResponse = (res, status = 500, message = 'Error occurred') => {
  return res.status(status).json({ success: false, message });
};

module.exports = { successResponse, errorResponse };
