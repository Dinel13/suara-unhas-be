const path = require("path");
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
const {
  removeImage,
  removeNotDefaultImage,
  checkRemoveImage,
} = require("../middleware/file-remove");

exports.create = async (req, res, next) => {
  const { titleBlog, bodyBlog, categoryBlog, hastagsBlog } = req.body;
  if (!titleBlog || !categoryBlog || !hastagsBlog) {
    removeImage(req.file);
    return next(new HttpError("Judul, kategori, hastag harus diisi", 422));
  }

  if (bodyBlog.length <= 150) {
    removeImage(req.file);
    return next(
      new HttpError(
        "Isi tulisan tidak boleh kosong dan minimal 150 karakter",
        422
      )
    );
  }
  const arrayHastags = hastagsBlog.split(",");
  let image;
  !req.file ? (image = "uploads/images/default.jpg") : (image = req.file.path);
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
    .populate("postedBy", "nickName publicId")
    .select("title slug excerpt category comment image postedBy createdAt")
    .sort({ createdAt: -1 })
    .limit(18)
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
      "_id title body slug category comment image hastags postedBy createdAt"
    )
    .exec((err, data) => {
      if (err) {
        return next(new HttpError(err, 400));
      }
      res.json(data);
    });
};

exports.remove = async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  let tulisan;
  try {
    tulisan = await Blog.findOne({ slug }).populate("postedBy").exec();
  } catch (error) {
    return next(new HttpError("Tidak bisa mencari tulisan", 500));
  }

  if (!tulisan) {
    return next(new HttpError("Tulisan tidak ditemukan", 404));
  }

  if (tulisan.postedBy._id.toString() !== req.userData.userId) {
    return next(
      new HttpError("Kamu tidak diizinkan untuk mengapus tulisan ini", 401)
    );
  }

  removeNotDefaultImage(tulisan.image, "uploads/images/default.jpg");
  // const sess = await moongose.startSession();
  // sess.startTransaction();
  // await place.remove({ session: sess });
  // place.creator.place.pull(place); // pull adalah metode mongose
  // await place.creator.save({ session: sess });
  // await sess.commitTransaction();

  try {
    tulisan.postedBy.blog.pull(tulisan);
    await tulisan.postedBy.save();
    await Blog.deleteOne({ slug }).exec();
    res.status(204).json({ message: "berhasil" });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Tidak bisa menghapus tulisan", 500));
  }
};

exports.update = async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  const { titleBlog, bodyBlog, categoryBlog, hastagsBlog } = req.body;
  if (!titleBlog || !categoryBlog || !hastagsBlog) {
    removeImage(req.file);
    return next(new HttpError("Judul, kategori, hastag harus diisi", 422));
  }

  if (bodyBlog.length <= 150) {
    removeImage(req.file);
    return next(
      new HttpError(
        "Isi tulisan tidak boleh kosong dan minimal 150 karakter",
        422
      )
    );
  }
  const arrayHastags = hastagsBlog.split(",");

  let tulisan;
  try {
    tulisan = await Blog.findOne({ slug }).populate("postedBy").exec();
  } catch (error) {
    removeImage(req.file);
    return next(new HttpError("Tidak bisa mencari tulisan", 500));
  }

  if (!tulisan) {
    removeImage(req.file);
    return next(new HttpError("Tulisan tidak ditemukan", 404));
  }

  if (tulisan.postedBy._id.toString() !== req.userData.userId) {
    removeImage(req.file);
    return next(
      new HttpError("Kamu tidak diizinkan untuk mengapus tulisan ini", 401)
    );
  }

  // cek image emty now, emty coming, or default
  const image = checkRemoveImage(
    tulisan.image,
    req.file,
    "uploads/images/default.jpg"
  );

  tulisan.title = titleBlog;
  tulisan.body = bodyBlog;
  tulisan.excerpt = smartTrim(bodyBlog, 140, " ", " ...");
  tulisan.slug =
    slugify(titleBlog).toLowerCase() + "-" + req.userData.name.split(" ")[0];
  // tulisan.postedBy = req.userData.userId;
  tulisan.image = image;
  tulisan.category = categoryBlog;
  tulisan.hastags = arrayHastags;

  try {
    const newTulisan = await tulisan.save();
    res.status(200).json({ slug: newTulisan.slug });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Tidak bisa mengupdate Tulisan", 500));
  }
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
    removeImage(req.file);
    console.log(error);
    return next(
      new HttpError("tidak bisa menyimpan komen, coba lagi nanti", 500)
    );
  }
};

exports.populer = async (req, res, next) => {
  try {
    const blog = await Blog.find()
      .populate("postedBy", "nickName publicId")
      .select("category title image excerpt slug comment postedBy")
      .sort({ comment: -1 })
      .limit(6);
    res.status(200).json({ blog: blog });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal meload populer blog", 500));
  }
};

exports.newest = async (req, res, next) => {
  try {
    const blog = await Blog.find()
      .populate("postedBy", "nickName publicId")
      .select("category title image excerpt slug comment postedBy")
      .sort({ createdAt: -1 })
      .limit(6);
    res.status(200).json({ blog: blog });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal meload populer blog", 500));
  }
};

exports.category = async (req, res, next) => {
  const category = req.params.category;
  try {
    const blog = await Blog.find({ category })
      .populate("postedBy", "nickName")
      .select("category title image excerpt slug comment postedBy")
      .sort({ createdAt: -1 });
    // .limit(16);
    res.status(200).json({ blog: blog });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal meload blog", 500));
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
exports.listSearch = async (req, res, next) => {
  console.log(req.query);
  const { search } = req.query;
  if (search) {
    try {
      const blog = await Blog.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      })
        .populate("postedBy", "nickName")
        .select("category title image excerpt slug comment postedBy")
        .sort({ createdAt: -1 })
        .limit(16);
      res.status(200).json({ blog: blog });
    } catch (error) {
      console.log(error);
      return next(new HttpError("Tidak bisa mecari tulisan", 500));
    }
  } else {
    return next(new HttpError("Tidak ada kata kunci", 404));
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
