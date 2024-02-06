const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');
const cookieParse = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const cookieParser = require('cookie-parser');

/// start server app
const app = express();
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
// app.options('/api/v1/tours/:id', cors());

app.options();
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//MIDDLEWARE
// Set security HTTP headers
app.use(helmet({ contentSecurityPolicy: false })); // the downsides??

// console.log(process.env.NODE_ENV);
// Development logging

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP pp
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP please try again in 1 hour',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// app.use((request, response, next) => {
//   // console.log('Hello from teh middleware');
//   next();
// });

app.use(compression());
// app.use((request, response, next) => {
//   request.requestTime = new Date().toISOString();
//   // console.log(request.cookies); ??
//   next();
// });

//////NOTES
//route is the url and the http method to be applied
// u have to return a response in a middleware functions to work
// Express has make middle ware avaialble to you through, u can use
// the inbuilt functions or include you cutsom middlewaree in your route
// u cant define it for yourself
// one example of that middleware is the express.static() that allows u to serve
//static files directly

// api response to a url resource request
// app.get('/', (request, response) => {
//   response
//     .status(200)
//     .json({ mesage: 'Hello from the server side', app: 'Natours' });
// });
// // can replace 'json'above with 'send()' to send plain text
// // json() als includes the data format header automaticallys

///ROUTES
//client data request
// app.get('/api/v1/tours', getTours);
// the call back function is called a routing handler

// url parameters
// url paramters are inbuilt and the folow / & ':' and
// if their is url paramters a error comes up
// to avoid this put '?' before the parameter which make that parameter optional
// app.get('/api/v1/tours/:id/:x?', getTour);

// app.delete('/api/v1/tours/:id', deleteTour);

// routes simplified
// const tourRouter = express.Router();
// const userRouter = express.Router();
// the middleware function will only run if the response has not be
//completed

///ROUTES
// the two routers files are actually middleware, meaning the server
// have acess to them

//get i used to render pages,

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// this can only be after the main routes otherwise will interfer with the route handlings
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant find ${req.originalUrl} on this server`,
  // });
  // const err = new AppError(`Cant find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
  // next is passed error to move to the error handling middleware
});

app.use(globalErrorHandler);

// this is recognized as error handling middleware

//this middleware doessnt run here
// app.use((request, response, next) => {
//   request.requestTime = new Date().toISOString();
//   next();
// });

module.exports = app;
