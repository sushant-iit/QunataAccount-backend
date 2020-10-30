const mongoose = require('mongoose');
const validator = require('validator');

const CustomerSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "The customer's name can't be empty"],
  },
  mobile: {
    type: Number,
    required: [true, "The customer's mobile number can't be empty."],
  },
  email: {
    type: String,
    lowerCase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  //Here, user is the shop owner or shop keeper:
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A customer must belong to a shopkeeper'],
  },
  address: {
    type: String,
  },
});

//Disallowing duplicate customers within the same shop:
CustomerSchema.index({ mobile: 1, user: 1 }, { unique: true });

const Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
