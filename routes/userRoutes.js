const express = require('express');
const userController = require('./../controllers/userControllers');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const viewController = require('./../controllers/viewControllers');
const { route } = require('./reviewRoutes');
const User = require('../models/userModels');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

///AUTHENTICATION
//u have to be logged ito update
router.use(authController.protect);
//adding protect here stops the need to use it in the other routes

router.patch('/updatePassword', authController.updatePassword);
// will take the 'photo' from the route
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
// router.patch('/updateUser', viewController.updateUserData);
router.delete('/deleteMe', userController.deleteMe);

router.route('/').get(userController.getUsers).post(userController.createUser);
router.route('/me').get(userController.getMe, userController.getUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    userController.deleteUser,
  );

module.exports = router;
