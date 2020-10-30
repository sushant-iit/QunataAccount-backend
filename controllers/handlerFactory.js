const AppError = require('../utility/appError');
const catchAsync = require('../utility/catchAsync');

//1) CRUD Operations Creation:
exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: document,
    });
  });
};

exports.getOne = (Model, popOtions) => {
  return catchAsync(async (req, res, next) => {
    //Filtering the data for each user (shopkeeper):
    let query = Model.findOne({ _id: req.params.id, user: req.user.id });
    if (popOtions) query = query.populate(popOtions);
    const document = await query;
    if (!document) {
      return next(new AppError('No document with that ID.', 404));
    }
    res.status(200).json({
      status: 'success',
      data: document,
    });
  });
};
