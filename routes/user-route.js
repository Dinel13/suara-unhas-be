const express = require("express");

const {
  login,
  signup,
  populer,
  getUserData,
  resetPassword,
  forgotPassword,
  updateUser,
  getUserById,
  getAllUserData,
} = require("../controllers/users-controller");
const { authMiddleware } = require("../middleware/auth");
const fileUpload = require("../middleware/user-img-upload");

const router = express.Router();

router.post("/user/login", login);

router.post("/user/signup", signup);

router.get("/users/populer", populer);

router.post("/user/forgot-password", forgotPassword);

router.put("/user/reset-password/:token", resetPassword);

router.get("/user/:id", getUserData); //use public id
router.get("/userData/:id", getUserById); //use id biasa
router.get("/allUserData/:id", getAllUserData); //use id biasa

router.put(
  "/user/update/:id",
  authMiddleware,
  fileUpload.single("image"),
  updateUser
);

module.exports = router;
