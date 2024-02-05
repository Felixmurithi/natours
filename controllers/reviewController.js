const AppError = require('../utils/appError');
const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handleFactory');

// login- protected route,
//post a review
exports.setTourUserIds = (req, res, next) => {
  // this where merging params is seen clearly
  // console.log(req.params.tourId);
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.tour)
    return next(new AppError('A review must include a tour ID', 400));
  req.body.user = req.user.id;
  next();
};
exports.createReview = factory.createOne(Review);

// login- protected route,
// retrive a review by user
exports.getReview = factory.getOne(Review);

// login- protected route,
// retrive all reviews by user
exports.getAllReviews = factory.getAll(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

// update a review by user
