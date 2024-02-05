// const { mongoose  = require('mongoose');- doesnt work
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'a review must have a summary'] },
    rating: {
      type: Number,
      required: true,
      max: [5, 'A tour rating should be a maximum of 5.0'],
      min: [1, 'A tour name should be a minimum of 1.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'a review must have a tour'],
      },
    ],
    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'a review must belong to a user'],
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
  //allows calculations to be returned ??
);
//check if tworks tomorrow
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/// QUERY MIDDLEWARE
//chain populate- whenever a populate of a certain model gets called, the query return s all fields incluing vrtual fields?? ask reddirts
//Populate is another way of referencing data- here the populate

// when tour populate is turned of we only gets its ID
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: ' tour',
  //     select: 'name',
  //   })
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// the function will be called on the schema every time the document is saved
// the function is caleld using  the constructor using the the findOne
// method that allwos this function acess to the courrent documen
//including its constrctor which calls this function immediately

// calling this function on the constructor is importnat because it allows

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
      //match tour and call it tour ID

      //how are teh aggregates calculated
    },

    //group by takes the tour used when the document is being created/
    // because a review being created includes a tour ID, the group by
    // this function is called post save and using the tour ID passed
    // the group query creates a sum and average rating of that specific
    // tour, persists that info into the Tour model
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  // stats will produce an error when the last one is deleted because
  // the agregate code above will be empty
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
/// ^find are only available on the query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  //r is the whole document
  // console.log(this.r);
  next();
});

//post doesnt get acess to next()
// the function is called 'post' because post is still middleware
// if u called the doc after post it will be something different ??
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed

  await this.r.constructor.calcAverageRatings(this.r.tour);
});

//??? the difference between a query and document
/// ^find are only available on the query

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
