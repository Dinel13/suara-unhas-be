const express = require("express");

const {
  login,
  signup,
  populer,
  getUserData,
} = require("../controllers/users-controller");

const router = express.Router();

router.post("/user/login", login);

router.post("/user/signup", signup);

router.get("/users/populer", populer);

router.get("/user/:id", getUserData);

module.exports = router;
