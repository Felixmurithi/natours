const Tour = require('../models/tourModel');
const User = require('./../models/userModels');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
  ///get tour data from collection
  const tours = await Tour.find();

  // the name overview gets rcognized automaticatl y when we  use the
  //render function
  //render also allows variables to be sent to the template
  res.status(200).render('overview', {
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1.get the data for the requested tour(including reviews and guides)

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) next(new AppError('That tour doesnt exist ', 404));

  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
    // )
    .render('tour', {
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // find all bookings

  // will return  bokings wuth the user id
  const bookings = await Booking.find({ user: req.user.id });

  // find tours with the returned IDs

  // pick up all the tour Ids from the  bookings9( each individual booking
  // has a tour ID)
  const tourIds = bookings.map((el) => el.tour);
  // find them on the tour model
  const tours = await Tour.find({ _id: { $in: tourIds } });
  // TO-Do - do theat with virtual populate

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    status: 'success',
    title: 'Your Account',
    user: updatedUser,
  });
});
