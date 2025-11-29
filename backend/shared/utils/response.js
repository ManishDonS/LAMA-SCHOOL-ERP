const successResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const errorResponse = (res, statusCode, error, message = 'Error') => {
  res.status(statusCode).json({
    status: 'error',
    message,
    error: error instanceof Error ? error.message : error,
  });
};

const paginatedResponse = (res, statusCode, data, pagination, message = 'Success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
    pagination,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
