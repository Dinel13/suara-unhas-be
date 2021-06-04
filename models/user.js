const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  publicId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  nickName: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  blog: [{ type: mongoose.Types.ObjectId, required: true, ref: "blog" }],
  fakultas: {
    type: String,
    require: false,
  },
  image: {
    type: String,
    require: false,
  },
  motto: {
    type: String,
    require: false,
  },
});
module.exports = mongoose.model("User", userSchema);
