const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // if (process.env.NODE_ENV === 'production ') cookieOptions.secure = true;
  // if (req.secure|| req.headers('x-forwarded-proto'==='https')) cookieOptions.secure = true;
  user.password = user.active = undefined;
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
  res.status(statusCode).json({
    Request_Time: req.requestTime,
    status: 'success',
    token,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  // the code allows for only regular, admin will get a new Schema

  const newUser = await User.create({
    role: req.body.role,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //get is getter function here
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // why was this used not the whole thing??

  // stop active iser from being returned??

  // const token = signToken(newUser._id);

  res.status(200).json({
    Request_Time: req.requestTime,
    status: 'success',
    // token,
    data: { newUser },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //destructuring object- u have to use objects on either side of the assignment
  //from there u can get them ot

  //check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password'));
  }

  // thr '+' added before password allows one to select fields set to false
  const user = await User.findOne({ email }).select('+password');

  //check if user exists && password exists
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // if everything is okay , send token to client
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   Request_Time: req.requestTime,
  //   status: 'success',
  //   token,
  //   data: user,
  // });
});

//how to delete a cookie that shows the user is logget outs
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// this fucntion just checks wether one has logged in-
// is a middleware after logg in which returns its token and user ID
exports.protect = catchAsync(async (req, res, next) => {
  //getting the Token and check if its there- this means that you have to be logged in first

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token) {
    return next(
      new AppError('You are not logged in, please login to get acess.', 401),
    );
  }

  //verification tokenn- also returns the user ID and the time
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //check if user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does not longer exist',
        401,
      ),
    );
  }
  // check if user changed password
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again'),
    );
  }

  req.user = currentUser; //current user id and decoded times added to the request body-
  res.locals.user = currentUser;

  next();
});
exports.isLoggenIn = async (req, res, next) => {
  try {
    //getting the Token and check if its there- this means that you have to be logged in first

    if (req.cookies.jwt) {
      //verification tokenn- also returns the user ID and the time
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      //check if user exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // check if user changed password
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // locals passes data to pug
      res.locals.user = currentUser;
      return next();
    }
    next();
  } catch (error) {
    return next();
  }
};

//questioon
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // '.' is executed before not
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You dont have the permission to complete this action',
          401,
        ),
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email adress'), 401);
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'sucecss',
      message: 'token sent to email',
    });
  } catch (err) {
    user.PasswordResetToken = undefined;
    user.PasswordResetTokenExpireIn = undefined;
    await user.save({ validateBeforeSave: false });
    // console.log(err);
    return next(new AppError('There is no email adress'), 401);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1.Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpireIn: { $gt: Date.now() },
  });

  //2 if token has not expired
  if (!user) {
    // how to remove token after expiry ??
    // user.passwordResetToken = undefined;
    // user.passwordResetTokenExpireIn = undefined;
    return next(new AppError('Token is Invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpireIn = undefined;

  await user.save();

  // const token = signToken(user._id);
  res.status(200).json({
    Request_Time: req.requestTime,
    status: 'success',
    // token,
    data: user,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { renterPassword, newPassword, newPasswordConfirm } = req.body;

  //1 check if userb exists
  const user = await User.findById(req.user.id).select('+password');
  ///findBYIDAndUPsate would not work- because the validation function for
  // passwordConfirm wouldnt work- why because moongose does keep the
  // current object in memory and the validate moongose middlweare woldnt
  //work -why??

  // console.log(user.password);

  //check if user exists && password exists
  if (!user || !(await user.correctPassword(renterPassword, user.password))) {
    return next(new AppError('renter you password', 401));
  }

  //update password
  if (!(newPassword === newPasswordConfirm))
    next(new AppError('Confirm your new password', 401));

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  //sign token
  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   Request_Time: req.requestTime,
  //   status: 'success',
  //   token,
  //   data: user,
  // });
});
