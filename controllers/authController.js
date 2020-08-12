const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utility/catchAsync');
const Email = require('../utility/email');

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
  });

  //3) Generating the url and sending it to the user as an Email:
  const url = `${req.protocol}://${req.get(
    'host'
  )}/api/users/${userActivationToken}`;
  await new Email(newuser, url).sendActivationEmail();

  //4)Sending back the response
  newuser.password = undefined;
  newuser.userActivationToken = undefined;
  newuser.userActivationTokenCreationTime = undefined;
  res.status(200).json({
    status: 200,
    data: newuser,
  });
});
