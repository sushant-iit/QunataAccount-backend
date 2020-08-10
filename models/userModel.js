const mongoose = require('mongoose');
const validator = require('validator');

const UserScchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: true,
    lowerCase: true,
    unique: [
      true,
      'There is already an account registered with this email-id!',
    ],
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  mobile: {
    type: Number,
  },
  accountCreatedAt: {
    type: Date,
    //Added for converting from GMT to IST
    default: Date.now() + 19800000,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a confirmation password'],
    validate: {
      //This works on on .create() and .save()
      validator: function (el) {
        return el === this.password;
      },
      message: 'Both the passwords do not match',
    },
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model('User', UserScchema);

module.exports = User;
