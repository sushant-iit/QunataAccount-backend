const express = require('express');

const authController = require('../controllers/authController');

const userRouter = express.Router();

//User Authentications and SignUp--------------------------------------------------------------------------------------------------------

userRouter.route('/signup').post(authController.signup);

module.exports = userRouter;
