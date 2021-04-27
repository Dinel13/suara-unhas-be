const Category = require("../models/category");
const Blog = require("../models/blog");
const slugify = require("slugify");
const HttpError = require("../models/http-error");

exports.create = (req, res, next) => {
  const { name } = req.body;
  let slug = slugify(name).toLowerCase();

  let category = new Category({ name, slug });

  category.save((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json(data);
  });
};

exports.list = (req, res, next) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json(data);
  });
};

exports.read = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  Category.findOne({ slug }).exec((err, category) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    // res.json(category);
    Blog.find({ categories: category })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name")
      .select(
        "_id title slug excerpt categories postedBy tags createdAt updatedAt"
      )
      .exec((err, data) => {
        if (err) {
          return next(new HttpError(err, 400));
        }
        res.json({ category: category, blogs: data });
      });
  });
};

exports.remove = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json({
      message: "Category deleted successfully",
    });
  });
};
