const express = require('express');
const viewControllers = require('../controllers/viewControllers');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

// use??
router.use(viewControllers.alerts);

router.get(
  '/',
  // bookingController.createBookingCheckout,
  authController.isLoggenIn,
  viewControllers.getOverview,
);
router.get('/tour/:slug', authController.isLoggenIn, viewControllers.getTour);
router.get('/login', authController.isLoggenIn, viewControllers.getLoginForm);
router.get('/me', authController.protect, viewControllers.getAccount);
router.get('/my-tours', authController.protect, viewControllers.getMyTours);

module.exports = router;

//TO-Do
//remove jwt and include console.error in  send erro dev
