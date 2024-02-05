const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');

// secret tours cannot be deleted ??
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    ///findByIDAndUP works the same as findByID, updates the implememnted by Mongoose
    // put methods works differently

    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No found with that ID', 404));
    }
    res.status(204).json({ status: 'success', data: null });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    ///findByIDAndUP works the same as findByID, updates the implememnted by Mongoose
    // put methods works differently
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: false,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //const newTour= new Tour({})
    //newTour.save
    // create merges these 2
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    ///findByID works the same as findOne in mongo but implememnted by Mongoose

    //NOTES- poupulate does create a new query which affects performance- new query??
    //select needs one string with the fields sperated by spaces
    // '-' used at select is similar to '+field
    const doc = await query;

    //PREDONE is the Model
    // .populate({
    //   path: 'guides',
    //   select: '-__v -passwordChangedAt',
    // });

    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (!req.body.tourId) filter = req.body.tourId;

    // console.log(req.query);
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limiting()
      .pagination();
    // const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
      Request_Time: req.requestTime,
      status: 'success',
      doc,
    });
  });
