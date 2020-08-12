const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = mongoose.Schema({
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
    select: false,
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
    select: false,
  },
  userActivationToken: {
    type: String,
    default: null,
    select: false,
  },
});

//Encrypting Passwords-------------------------------------------------------------------------------------------------------------------
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
