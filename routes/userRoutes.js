const express = require('express');

const authController = require('../controllers/authController');

const userRouter = express.Router();

//User Authentications and SignUp--------------------------------------------------------------------------------------------------------

userRouter.route('/signup').post(authController.signup);
userRouter.route('/activate/:token').get(authController.activateUser);
userRouter.route('/login').post(authController.login);
userRouter.route('/forgotPassword').post(authController.forgotPassword);
userRouter.route('/resetPassword/:token').post(authController.resetPassword);
userRouter
  .route('/updateMyPassword')
  .post(authController.protect, authController.updatePassword);

module.exports = userRouter;
