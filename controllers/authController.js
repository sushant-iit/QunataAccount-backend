const User = require('../models/userModel');
const catchAsync = require('../utility/catchAsync');
const Email = require('../utility/email');

exports.signup = catchAsync(async (req, res, next) => {
  const newuser = await User.create({
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    //Added for Coverting from GMT to IST
    accountCreatedAt: Date.now() + 19800000,
  });

  await new Email(
    newuser,
    'https://www.google.com/',
    '127.0.0.1:3000/'
  ).sendActivationEmail();

  res.status(200).json({
    status: 200,
    data: newuser,
  });
});
