const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModels');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name should be a maximum of 40 character'],
      minlength: [10, 'A tour name should be a minimum of 10 character'],
      // validate: [validator.isAlpha, 'Tour Name must only constine characters'],
    },
    slug: {
      type: String,
    },
    rating: { type: Number, default: 4.5 },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : eay, medium, difficult',
      },
      // enum is for strings only
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5.0, 'A tour rating should be a maximum of 5.0'],
      min: [1.0, 'A tour name should be a minimum of 1.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //can use arrays in the following object too
      validate: {
        validator: function (val) {
          //this only points to the current document
          return val < this.price;
        },
        message: 'Discount price {VALUE} must be lower than the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a Summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    secretTour: { type: Boolean, default: false },

    imageCover: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a cover string'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      //geolocation
      type: {
        type: String,
        //the 2 below enforce the fact the type can only be point
        default: 'Point',
        enum: ['Point'],
      },
      // coordiate means an array of
      coordinates: [Number],
      address: String,
      description: String,
    },
    // to create an embeded document u need to ennclose it in an array
    locations: [
      {
        //geolocation
        type: {
          type: String,
          //the 2 below enforce the fact the type can only be point
          default: 'Point',
          enum: ['Point'],
        },
        // coordiate means an array of
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // guides: Array,
    //User will be derived from user model- 'User' doesnt not even need
    //to b connected

    // from guides field we pass a refrence of the guide on the  user schema
    // this can be populated virtually in two ways- populate on the actual
    // find quey or the middleware ebwlow which is used
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    // reviews: [{ type: mongoose.Schema.ObjectId, ref: 'Review' }],
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1 }, { ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// special index, this is for geospitaila data
// 2d is used for otehr 2 dimensional plates
tourSchema.index({ startLocation: '2dsphere' });

// document creationmiddlware
// virtaul propertzy, business logic extension, the above options have to activate to use it
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// points to the Review Schema and matches the foreign field
// the match is generated virtually, that match is used to populate
// the match bbrings over all the child fields that is why we needed to
//turn off tour- stoping it from showing up in the review query and
// here at the tour query
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// middleware runs before save and create
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// this only workd on save and shows why embeding is prolematic
// the guide fields may have some tweaks in which sense you would need to
// create another function to  update

///EMBEEDING TOUR GUIDES
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// QUERY MILLdWARE- supposedly activated by the event ,
// done when query, hooked on querying routes
//this is the query at the hook postion

// works only all instances of find a tour, one or many
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now(); //new date needs some parameters

  next();
});

// virtual populate
//this will also show up in queries that ^find(Tour)
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   // docs parameter (paraneter at that postion needed to use next()
//   // even the 'pre' middlware doesnt work without it

//   // this.find({ secretTour: { $ne: true } });
//   // runing this will redo the find but on a slightly differntly doc

//   console.log(
//     ` ${Date.now() - this.start} millseconds between pre & post middlware`,
//   ); //new date needs some parameters
//   next();
// });

//AGGREGATE MIDDLEWARE -it comes before the aggregate events in the tourModel
// tourSchema.pre('aggregate', function (next) {
//   console.log(this.pipeline());
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

// Notes to create reference parent or child
// create a reference field as guides above
//use the middlwerare that has the populate methos aboves
