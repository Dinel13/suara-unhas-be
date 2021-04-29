const User = require('../models/user');
const Blog = require('../models/blog');
const jwt = require('jsonwebtoken');

const HttpError = require("../models/http-error");

exports.authMiddleware = (req, res, next) => {
    try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
      if(!token) {
          throw new Error("Anda tidak dikenali!")
      }
      const decodedToken = jwt.decodedToken(token, process.env.JWT_KEY)
      req.userData = {userId : decodedToken.userId}
      next()
    } catch (error) {
        return next(new HttpError("Anda tidak dikenali!" , 401))
    }
};

exports.canUpdateDeleteBlog = (req, res, next) => {
    const slug = req.params.slug.toLowerCase();
    Blog.findOne({ slug }).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();
        if (!authorizedUser) {
            return res.status(400).json({
                error: 'You are not authorized'
            });
        }
        next();
    });
};
