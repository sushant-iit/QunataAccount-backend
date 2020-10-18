const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const util = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utility/catchAsync');
const Email = require('../utility/email');
const AppError = require('../utility/appError');

//Helping Functions----------------------------------------------------------------------------------------------------------------------
const createSendToken = (user, req, res) => {
  let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  //Sending token as a cookie:
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000 + 19800000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  //Don't need token as a body response in production
  if (process.env.NODE_ENV === 'production') token = null;
  res.status(200).json({
    status: 'success',
    token,
    data: user,
  });
};

const isPasswordChangedAfter = (JwtTimeStamp, passwordChangedAt) => {
  if (passwordChangedAt) {
    const passwordChangedAtComparable = passwordChangedAt.getTime() / 1000;
    return passwordChangedAtComparable > JwtTimeStamp;
  }
  return false;
};

const createResetToken = (user) => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //Conversion to GMT to IST and setting the limit of 10 minutes:
  user.passwordResetExpiresAt = Date.now() + 19800000 + 10 * 60 * 1000;
  return resetToken;
};

const IsCorrect = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Main Functions-------------------------------------------------------------------------------------------------------------------------

exports.signup = catchAsync(async (req, res, next) => {
  //1)Generating the token and encrypting it:
  const userActivationToken = crypto.randomBytes(32).toString('hex');
  const userActivationTokenEncrypted = crypto
    .createHash('sha256')
    .update(userActivationToken)
    .digest('hex');

  //2)Creating new user and saving the encrypted token to the database:
  const newuser = await User.create({
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    //Added for Coverting from GMT to IST
    accountCreatedAt: Date.now() + 19800000,
    userActivationToken: userActivationTokenEncrypted,
    userActivationTokenExpiryTime:
      Date.now() +
      19800000 +
      process.env.USER_ACTIVATION_TOKEN_EXPIRES_IN * 60 * 60 * 1000,
  });

  try {
    //3) Generating the url and sending it to the user as an Email:
    const url = `${req.protocol}://${req.get(
      'host'
    )}/api/users/activate/${userActivationToken}`;
    await new Email(newuser, url).sendActivationEmail();
  } catch (err) {
    await User.findByIdAndDelete(newuser._id);
    return next(
      new AppError(
        'There was problem sending activation email. So, the user was not created.',
        500
      )
    );
  }

  //4)Sending back the response:
  newuser.password = undefined;
  newuser.userActivationToken = undefined;
  newuser.userActivationTokenCreationTime = undefined;
  res.status(200).json({
    status: 200,
    data: newuser,
  });
});

exports.activateUser = catchAsync(async (req, res, next) => {
  //Creating hash of received token and finding the user based on that:
  const tokenReceivedEncrypted = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    userActivationToken: tokenReceivedEncrypted,
    userActivationTokenExpiryTime: { $gt: Date.now() + 19800000 },
    isActive: false,
  });

  if (!user) {
    return next(new AppError('The token was invalid or has expired.', 400));
  }

  //Removing the activationToken and setting active status to true:
  await User.findByIdAndUpdate(
    { _id: user._id },
    {
      isActive: true,
      userActivationToken: undefined,
      userActivationTokenExpiryTime: undefined,
    }
  );

  res.status(200).send('Soon to be Implemented!!');
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1)Checking if email and password exist:
  if (!email || !password) {
    return next(
      new AppError('Please provide a valid email address and a password!', 400)
    );
  }

  //2) Checking if the user exists and isActive in the database and the password is correct:
  const user = await User.findOne({ email, isActive: true }).select(
    '+password'
  );
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Email or Password is incorrect', 401));
  }

  //3) If everything is correct, issuing JsonWebToken to the user:
  createSendToken(user, req, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Getting the user based on the posted email:
  const currentUser = await User.findOne({ email: req.body.email });
  if (!currentUser) {
    return next(new AppError('There is no user with this email address.', 404));
  }

  //2) Generating the password reset token:
  const resetToken = createResetToken(currentUser);
  await currentUser.save({ validateBeforeSave: false });

  //3)Generating the passwordResetUrl and sending it to the user's email:
  const resetURL = `${req.protocol}//:${req.get(
    'host'
  )}/resetPassword/${resetToken}`;
  try {
    await new Email(currentUser, resetURL).sendPasswordResetEmail();
    res.status(200).json({
      status: 'success',
      message: 'Your password reset token is sent to your email.',
    });
  } catch (err) {
    currentUser.passwordResetToken = null;
    currentUser.passwordResetExpiresAt = null;
    await currentUser.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was a problem sending you the email... Please try again.',
        500
      )
    );
  }
});

//It is for protecting the routes which require log-in to access:
exports.protect = catchAsync(async (req, res, next) => {
  //1) Checking if there is token:
  if (!req.headers.cookie) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401)
    );
  }
  const JsonTokenReceived = req.headers.cookie.split('=')[1];
  if (JsonTokenReceived) {
    const decoded = await util.promisify(jwt.verify)(
      JsonTokenReceived,
      process.env.JWT_SECRET
    );

    //2)Checking if the user has not deleted his account after issuing the JsonWebToken:
    const currentuser = await User.findById(decoded.id);
    if (!currentuser) {
      return next(
        new AppError('The user beloging to this token no longer exists.', 401)
      );
    }

    //3)Checking if the user has not changed his password after the issuing of the JsonWebToken
    const changed = isPasswordChangedAfter(
      decoded.iat,
      currentuser.passwordChangedAt
    );
    if (changed) {
      return next(
        'Your Password has been changed. Please log-in again to get access.',
        401
      );
    }

    //There is a logged in user
    req.user = currentuser;
    res.locals.user = currentuser;
    return next();
  }
});

//It is for rendered pages with no error:-(Means we don't throw error of user is not logged in.)
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  try {
    //1) Checking if there is token:
    const JsonTokenReceived = req.headers.cookie.split('=')[1];
    if (JsonTokenReceived) {
      const decoded = await util.promisify(jwt.verify)(
        JsonTokenReceived,
        process.env.JWT_SECRET
      );

      //2)Checking if the user has not deleted his account after issuing the JsonWebToken:
      const currentuser = await User.findById(decoded.id);
      if (!currentuser) {
        return next();
      }

      //3)Checking if the user has not changed his password after the issuing of the JsonWebToken
      const changed = isPasswordChangedAfter(
        decoded.iat,
        currentuser.passwordChangedAt
      );
      if (changed) {
        return next();
      }

      //There is a logged in user
      res.locals.user = currentuser;
      return next();
    }
  } catch (err) {
    return next();
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token:
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: Date.now() + 19800000 },
  });

  //2)Checking if there is a user and token has not expired
  if (!user) {
    return next(new AppError('Token is invalid or has expired...', 400));
  }

  //3)Updating the password:
  user.passwordResetExpiresAt = null;
  user.passwordResetToken = null;
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) Log the user in:
  createSendToken(user, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get the user from the database:
  const user = await User.findById(req.user.id).select('+password');
  //2) Checking if the password is correct:
  const correct = await IsCorrect(req.body.passwordCurrent, user.password);
  if (!correct) {
    return next(new AppError('Please provide the correct password', 401));
  }
  //3) If so, update the password and send back the response:
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //Log the user back in again:
  createSendToken(user, req, res);
});
