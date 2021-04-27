const Tag = require("../models/tag");
const Blog = require("../models/blog");
const slugify = require("slugify");
const HttpError = require("../models/http-error");

exports.create = (req, res, next) => {
  const { name } = req.body;
  let slug = slugify(name).toLowerCase();

  let tag = new Tag({ name, slug });

  tag.save((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json(data); // dont do this res.json({ tag: data });
  });
};

exports.list = (req, res, next) => {
  Tag.find({}).exec((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json(data);
  });
};

exports.read = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  Tag.findOne({ slug }).exec((err, tag) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    // res.json(tag);
    Blog.find({ tags: tag })
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
        res.json({ tag: tag, blogs: data });
      });
  });
};

exports.remove = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  Tag.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json({
      message: "Tag deleted successfully",
    });
  });
};