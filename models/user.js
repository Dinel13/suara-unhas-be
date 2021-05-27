const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
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
  blog: [{type: mongoose.Types.ObjectId, required : true , ref : 'blog'}]

});
module.exports = mongoose.model("User", userSchema);
