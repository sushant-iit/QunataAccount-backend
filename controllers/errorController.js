const AppError = require('../utility/appError');

//Helping Functions----------------------------------------------------------------------------------------------------------------------
const handleDuplicateFieldsErrorDB = (err) => {
  const key = Object.keys(err.keyPattern)[0];
  const value = err.keyValue[key];
  const message = `Duplicate ${key.toLocaleUpperCase()}:${value}`;

  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const error = Object.values(err.errors)
    .map((el) => el.message)
    .join('\n');
  const message = `Validation Error: ${error}`;

  return new AppError(message, 400);
};

//Main Functions-----------------------------------------------------------------------------------------------------------------------
const sendErrDev = (err, req, res) => {
  console.log('\nError!!! ⚡⚡\n', err, '\n');

  res.status(err.statusCode).json({
    status: err.status,
    messge: err.message,
    error: err,
  });
};

const sendErrProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.log('\nError!!! ⚡⚡\n', err, '\n');

  res.status(500).json({
    status: 'fail',
    message:
      'Someting went wrong!\nThe team will look into it!\nPlease, try again later.',
  });
};

//Main Export--------------------------------------------------------------------------------------------------------------------------
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (err.code === 11000) error = handleDuplicateFieldsErrorDB(err);
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

    sendErrProd(error, req, res);
  }
};
