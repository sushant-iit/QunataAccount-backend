const Customer = require('../models/customerModels');
const factory = require('./handlerFactory');

//Setting automatically the userId(shopkeeper) to their customers: (Parent referencing)
exports.setUserId = (req, res, next) => {
  req.body.user = req.user.id;
  next();
};

//Functions from factory handler:
exports.createCustomer = factory.createOne(Customer);
exports.getCustomer = factory.getOne(Customer);
