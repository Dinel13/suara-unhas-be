const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const User = require("../models/user");
const HttpError = require("../models/http-error");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("periksa data anda", 422);
  }
  const { name, email, password } = req.body;
  console.log(name, email, password);

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Gagal mendaftar, coba lagi nanti", 500));
  }

  if (existingUser) {
    return next(new HttpError("User sudah ada, silahkan masuk", 422));
  }

  let HasPassword;
  try {
    HasPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Gagal mendaftar, coba lagi nati", 500);
    return next(error);
  }

  const createuser = new User({
    name,
    email,
    password: HasPassword,
  });

  let result;
  try {
    result = await createuser.save();
  } catch (err) {
    return next(new HttpError("Gagal mendaftar, coba lagi nanti", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createuser.id, email: createuser.email, name: createuser.name },
      process.env.JWT_KEY,
      { expiresIn: "10d" }
    );
  } catch (error) {
    return next(new HttpError("Gagal mendaftar, coba lagi nanti", 500));
  }

  res
    .status(201)
    .json({ userId: createuser.id, name: createuser.name, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email, password);
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Gagal masuk, coba lagi nanti.", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Credentials tidak cocok.", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    console.log(err);
    const error = new HttpError("Tidak bisa masuk, coba lagi nanti.", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Tidak bisa masuk, Pastikan password kamu betul.",
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
      },
      process.env.JWT_KEY,
      { expiresIn: "10d" }
    );
  } catch (err) {
    const error = new HttpError("Tidak bisa masuk, coba lagi nanti.", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    name: existingUser.name,
    token: token,
  });
};

const forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "User with that email does not exist",
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "1h",
    });

    // email
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password reset link`,
      html: `
          <p>Kamu telah meminta untuk mereset password</p>
          <p>KLik tautan ini <a href="http://localhost:3000/reset/${token}">link</a> untuk membuat password baru.</p>
      `,
    };
    // populating the db > user > resetPasswordLink
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.json({ error: errorHandler(err) });
      } else {
        sgMail.send(emailData).then((sent) => {
          return res.json({
            message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10min.`,
          });
        });
      }
    });
  });
};

const resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: "Expired link. Try again",
          });
        }
        User.findOne({ resetPasswordLink }, (err, user) => {
          if (err || !user) {
            return res.status(401).json({
              error: "Something went wrong. Try later",
            });
          }
          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };

          user = _.extend(user, updatedFields);

          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: errorHandler(err),
              });
            }
            res.json({
              message: `Great! Now you can login with your new password`,
            });
          });
        });
      }
    );
  }
};

exports.populer = async (req, res, next) => {
  try {
    const data = await User.find().sort({ blog: -1 }).limit(3);
    res.status(200).json({ user: data });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Gagal mendapatkan penulis populer", 500));
  }
};

exports.getUserData = async (req, res, next) => {
  const id = req.params.id
  console.log(id);
  try {
    const data = await User.findById(id).exec();
    res.status(200).json({ user: data });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal mendapatkan data penulis", 500));
  }
};

exports.login = login;
exports.signup = signup;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
