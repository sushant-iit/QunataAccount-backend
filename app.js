const express = require('express');
const morgan = require('morgan');

const userRouter = require('./routes/userRoutes');
const customerRouter = require('./routes/customerRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

//GLOBAL MIDDLEWARES---------------------------------------------------------------------------------------------------------------------
//Serving Static Files
app.use(express.static(`${__dirname}/public`));

//For Passing Data into req.body:
app.use(express.json({ limit: '10kb' }));

//For Logging requests to the console in the development mode:
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//ROUTES---------------------------------------------------------------------------------------------------------------------------------
app.use('/api/users', userRouter);
app.use('/api/customers', customerRouter);

//Global ErrorHandler Middleware
app.use(globalErrorHandler);

module.exports = app;
