class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // to work with filters
  filter() {
    //1.filtering
    //?price=100& duartion=4
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //advanced filterin
    //?price[lte]=100

    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`),
    );
    //start to build the quey
    this.query = this.query.find(queryStr);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      //add the sort to the query
      this.query = this.query.sort(sortBy);
      // console.log(query); query is very absstracted
      //to sort descending sort=-item
    }
    // sort by 'createdAt' descending order by default
    else this.query = this.query.sort('-createdAt');

    return this;
  }

  limiting() {
    //Field Limiting
    // query will look lik ?fields= duration
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // logic to return page from ? page=
  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('THis page doesnt exist');
    // }
    return this;
  }
}

module.exports = APIFeatures;
