const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("periksa data anda", 422);
  }
  const { name, email, password } = req.body;

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
      { userId: createuser.id, email: createuser.email },
      "rahasia",
      { expiresIn: "1h" }
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
      { userId: existingUser.id, email: existingUser.email },
      "rahasia",
      { expiresIn: "1h" }
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

exports.login = login;
exports.signup = signup;
