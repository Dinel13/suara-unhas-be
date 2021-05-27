const fs = require("fs");

const moongose = require("mongoose");
const formidable = require("formidable");
const slugify = require("slugify");
const stripHtml = require("string-strip-html");

require("dotenv").config();

const Blog = require("../models/blog");
const Category = require("../models/category");
const Tag = require("../models/tag");
const User = require("../models/user");
const { smartTrim } = require("../helpers/blog");
const HttpError = require("../models/http-error");

exports.create = async (req, res, next) => {
  const { titleBlog, bodyBlog, categoryBlog, hastagsBlog } = req.body;
   
  const createBlog = new Blog({
    title : titleBlog,
    body : bodyBlog,
    excerpt: smartTrim(bodyBlog, 320, " ", " ..."),
    slug: slugify(titleBlog).toLowerCase(),
    postedBy: req.userData.userId,
    image: req.file.path,
    category: categoryBlog,
    hastags: hastagsBlog,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    console.log(err);
    return next(new HttpError("gagal membuat blog, tidak ada user", 500));
  }

  if (!user) {
    return next(new HttpError("tidak dapat user ", 404));
  }

  try {
    //can't use session because not set replica in mongodb
    // const sess = await moongose.startSession();
    // sess.startTransaction();
    // await createBlog.save({ session: sess });
    // user.blog.push(createBlog);
    // await user.save({ session: sess });
    // await sess.commitTransaction();
    const savedBlog = await createBlog.save();
    user.blog.push(createBlog);
    await user.save();
    res.status(201).send(savedBlog)
  } catch (err) {
    console.log(err);
    const errr = new HttpError("tidak bisa buat blog", 500);
    return next(errr);
  }
}

  // let form = new formidable.IncomingForm();
  // form.keepExtensions = true;
  // form.parse(req, (err, fields, files) => {
  //   const { title, body, categories, tags } = fields;
  //   console.log(title, body, categories, tags);
  //   if (!title || !title.length) {
  //     return next(new HttpError("Judul harus ada", 400));
  //   }

  //   if (!body || body.length < 100) {
  //     return next(new HttpError("Isi terlalu sedikit", 400));
  //   }

  //   if (!categories || categories.length === 0) {
  //     return next(new HttpError("Minimal harus ada satu kategori", 400));
  //   }

  //   if (!tags || tags.length === 0) {
  //     return next(new HttpError("Minimal harus ada satu tag", 400));
  //   }

  //   let blog = new Blog();
  //   blog.title = title;
  //   blog.body = body;
  //   blog.excerpt = smartTrim(body, 320, " ", " ...");
  //   blog.slug = slugify(title).toLowerCase();
  //   blog.postedBy = req.userData.userId;
  //   blog.image = req.file.path;
  //   // categories and tags
  //   let arrayOfCategories = categories && categories.split(",");
  //   let arrayOfTags = tags && tags.split(",");

  //   blog.save((err, result) => {
  //     if (err) {
  //       console.log(err);
  //       return next(new HttpError(err, 400));
  //     }
  //     Blog.findByIdAndUpdate(
  //       result._id,
  //       { $push: { categories: arrayOfCategories } },
  //       { new: true }
  //     ).exec((err, result) => {
  //       if (err) {
  //         console.log(err);
  //         return next(new HttpError(err, 400));
  //       } else {
  //         Blog.findByIdAndUpdate(
  //           result._id,
  //           { $push: { tags: arrayOfTags } },
  //           { new: true }
  //         ).exec((err, result) => {
  //           if (err) {
  //             console.log(err);
  //             return next(new HttpError(err, 400));
  //           } else {
  //             res.status(201).json(result);
  //           }
  //         });
  //       }
  //     });
  //   });
  // });


// list, listAllBlogsCategoriesTags, read, remove, update

exports.list = (req, res, next) => {
  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return next(new HttpError(err, 400));
      }
      res.json(data);
    });
};

exports.listAllBlogsCategoriesTags = (req, res, next) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  let blogs;
  let categories;
  let tags;

  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username profile")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return next(new HttpError(err, 400));
      }
      blogs = data; // blogs
      // get all categories
      Category.find({}).exec((err, c) => {
        if (err) {
          return next(new HttpError(err, 400));
        }
        categories = c; // categories
        // get all tags
        Tag.find({}).exec((err, t) => {
          if (err) {
            return next(new HttpError(err, 400));
          }
          tags = t;
          // return all blogs categories tags
          res.json({ blogs, categories, tags, size: blogs.length });
        });
      });
    });
};

exports.read = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug })
    // .select("-photo")
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return next(new HttpError(err, 400));
      }
      res.json(data);
    });
};

exports.remove = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    res.json({
      message: "Blog deleted successfully",
    });
  });
};

exports.update = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOne({ slug }).exec((err, oldBlog) => {
    if (err) {
      return next(new HttpError(err, 400));
    }
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
      if (err) {
        return next(new HttpError(err, 400));
      }

      let slugBeforeMerge = oldBlog.slug;
      oldBlog = _.merge(oldBlog, fields);
      oldBlog.slug = slugBeforeMerge;

      const { body, desc, categories, tags } = fields;

      if (body) {
        oldBlog.excerpt = smartTrim(body, 320, " ", " ...");
        oldBlog.desc = stripHtml(body.substring(0, 160));
      }

      if (categories) {
        oldBlog.categories = categories.split(",");
      }

      if (tags) {
        oldBlog.tags = tags.split(",");
      }

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res.status(400).json({
            error: "Image should be less then 1mb in size",
          });
        }
        oldBlog.photo.data = fs.readFileSync(files.photo.path);
        oldBlog.photo.contentType = files.photo.type;
      }

      oldBlog.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        // result.photo = undefined;
        res.json(result);
      });
    });
  });
};

exports.photo = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug })
    .select("photo")
    .exec((err, blog) => {
      if (err || !blog) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.set("Content-Type", blog.photo.contentType);
      return res.send(blog.photo.data);
    });
};

exports.listRelated = (req, res) => {
  // console.log(req.body.blog);
  let limit = req.body.limit ? parseInt(req.body.limit) : 3;
  const { _id, categories } = req.body.blog;

  Blog.find({ _id: { $ne: _id }, categories: { $in: categories } })
    .limit(limit)
    .populate("postedBy", "_id name username profile")
    .select("title slug excerpt postedBy createdAt updatedAt")
    .exec((err, blogs) => {
      if (err) {
        return res.status(400).json({
          error: "Blogs not found",
        });
      }
      res.json(blogs);
    });
};

//
exports.listSearch = (req, res) => {
  console.log(req.query);
  const { search } = req.query;
  if (search) {
    Blog.find(
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      },
      (err, blogs) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(blogs);
      }
    ).select("-photo -body");
  }
};

exports.listByUser = (req, res) => {
  User.findOne({ username: req.params.username }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    let userId = user._id;
    Blog.find({ postedBy: userId })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name username")
      .select("_id title slug postedBy createdAt updatedAt")
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(data);
      });
  });
};
