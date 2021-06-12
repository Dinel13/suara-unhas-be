const express = require("express");
const router = express.Router();

const {
  create,
  list,
  read,
  remove,
  update,
  comment,
  listRelated,
  listSearch,
  listByUser,
  populer,
  newest,
  category,
} = require("../controllers/blog-controller");
const { authMiddleware } = require("../middleware/auth");
const fileUpload = require("../middleware/file-upload");
const HttpError = require("../models/http-error");

router.get("/blogs", list);
router.get("/blogs/populer", populer);
router.get("/blogs/newest", newest);
router.get("/blog/:slug", read);
router.post("/blogs/related", listRelated);
router.get("/blogs/search", listSearch);
router.get("/blogs/:category", category);

router.post("/blog", authMiddleware, fileUpload.single("imageBlog"), create);
router.delete("/blog/:slug", authMiddleware, remove);
router.put("/blog/:slug", authMiddleware, update);
router.post("/blog/:slug/comment", authMiddleware, comment);
router.post("/user/blog", authMiddleware, create);
router.get("/:username/blogs", authMiddleware, listByUser);
router.put("/user/blog/:slug", authMiddleware, update);

module.exports = router;
