const express = require('express');
const userController = require('./../controllers/userControllers');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

//// REVIEWS

// the routes can have acessed independetly or via touroute mounting

const router = express.Router({ mergeParams: true });
//mergeparams allows this route to take advantage on the route it has been
//mounted on-

// router
//   .route('/createReview')
//   .post(authController.protect, reviewController.createReview);
// router.route('/').get(authController.protect, reviewController.getMyReviews);
// router.route('/:id').get(authController.protect, reviewController.getReview);
router.use(authController.protect);

// BUG:  tour/tourID/rteviews/ still returns all reviiews
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );
// id has to be in lowercase-??
router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(authController.restrictTo('user'), reviewController.updateReview);
module.exports = router;
