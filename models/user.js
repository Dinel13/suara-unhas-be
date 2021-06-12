const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    maxlength: 64,
  },
  email: {
    type: String,
    required: true,
    maxlength: 64,
  },
  password: {
    type: String,
    required: true,
    maxlength: 64,
  },
  name: {
    type: String,
    required: true,
    maxlength: 64,
  },
  nickName: {
    type: String,
    required: false,
    maxlength: 32,
  },
  bio: {
    type: String,
    required: false,
    maxlength: 300,
  },
  blog: [{ type: mongoose.Types.ObjectId, required: true, ref: "Blog" }],
  fakultas: {
    type: String,
    require: false,
    maxlength: 64,
  },
  image: {
    type: String,
    require: false,
    maxlength: 225,
  },
  motto: {
    type: String,
    require: false,
    maxlength: 100,
  },
  medsos: {
    type: String,
    require: false,
    maxlength: 225,
  },
  alamat: {
    type: String,
    require: false,
    max: 225,
  },
});
module.exports = mongoose.model("User", userSchema);
