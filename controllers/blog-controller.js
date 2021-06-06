const fs = require("fs");

const moongose = require("mongoose");
const formidable = require("formidable");
const slugify = require("slugify");
const stripHtml = require("string-strip-html");

require("dotenv").config();

const Blog = require("../models/blog");
const User = require("../models/user");
const { smartTrim } = require("../helpers/blog");
const HttpError = require("../models/http-error");
const { populate } = require("../models/user");

exports.create = async (req, res, next) => {
  const { titleBlog, bodyBlog, categoryBlog, hastagsBlog } = req.body;
  if (!titleBlog || !bodyBlog || !categoryBlog || !hastagsBlog) {
    return next(new HttpError("Semua field harus terisi", 422));
  }
  const arrayHastags = hastagsBlog.split(",");
  let image;
  !req.file ? (image = null) : (image = req.file.path);
  const createBlog = new Blog({
    title: titleBlog,
    body: bodyBlog,
    excerpt: smartTrim(bodyBlog, 140, " ", " ..."),
    slug:
      slugify(titleBlog).toLowerCase() + "-" + req.userData.name.split(" ")[0],
    postedBy: req.userData.userId,
    image,
    category: categoryBlog,
    hastags: arrayHastags,
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
    res.status(201).send({ slug: savedBlog.slug });
  } catch (err) {
    console.log(err);
    const errr = new HttpError("tidak bisa buat blog", 500);
    return next(errr);
  }
};

// list, listAllBlogsCategoriesTags, read, remove, update

exports.list = (req, res, next) => {
  Blog.find({})
    .populate("postedBy", "_id name")
    .select(
      "_id title slug excerpt category comment image hastags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return next(new HttpError(err, 400));
      }
      res.json(data);
    });
};

exports.read = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug })
    .populate("postedBy", "publicId nickName")
    .select(
      "_id title slug excerpt category comment image hastags postedBy createdAt"
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

exports.comment = async (req, res, next) => {
  const { userId } = req.userData;
  const { comment, blogId } = req.body;
  let user;
  try {
    user = await User.findById(userId).exec();
  } catch (error) {
    return next(new HttpError("User tidak dicari, coba lagi nanti", 500));
  }
  if (!user) {
    return next(new HttpError("User tidak ditemukan, daftar dulu", 404));
  }
  const commentData = {
    publicId: user.publicId,
    nickName: user.nickName,
    comment,
  };

  try {
    const blog = await Blog.findById(blogId).exec();
    blog.comment = [...blog.comment, commentData];
    const newBlog = await blog.save();
    res.status(201).json({ comment: newBlog.comment });
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("tidak bisa menyimpan komen, coba lagi nanti", 500)
    );
  }
};

exports.populer = async (req, res, next) => {
  try {
    const blog = await Blog.find().sort({ comment: -1 }).limit(6);
    res.status(200).json({ blog: blog });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal meload populer blog", 500));
  }
};

exports.newest = async (req, res, next) => {
  try {
    const blog = await Blog.find().sort({ createdAt: -1 }).limit(6);
    res.status(200).json({ blog: blog });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal meload populer blog", 500));
  }
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
