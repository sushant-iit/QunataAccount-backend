const express = require('express');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerConroller');

const customerRouter = express.Router();

//Protecting the customer routes--Only logged in users can access their customers:
customerRouter.use(authController.protect);

customerRouter
  .route('/')
  .post(customerController.setUserId, customerController.createCustomer);

customerRouter.route('/:id').get(customerController.getCustomer);

module.exports = customerRouter;
