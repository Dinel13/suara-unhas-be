const mongoose = require("mongoose");
const user = require("./user");
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      min: 3,
      max: 160,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    body: {
      type: {},
      required: true,
      min: 200,
      max: 2000000,
    },
    image: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      max: 1000,
    },
    category: {
      type : String,
      required : true
    },
    hastags: [{ type: String, required: true }],
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    comment : [{type : Object, required : false }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
