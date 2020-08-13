const express = require('express');

const authController = require('../controllers/authController');

const userRouter = express.Router();

//User Authentications and SignUp--------------------------------------------------------------------------------------------------------

userRouter.route('/signup').post(authController.signup);
userRouter.route('/activate/:token').get(authController.activateUser);

module.exports = userRouter;
