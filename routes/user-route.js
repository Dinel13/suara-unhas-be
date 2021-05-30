const express = require("express");

const userController = require("../controllers/users-controller");

const router = express.Router();

router.post("/user/login", userController.login);

router.post("/user/signup", userController.signup);

router.get("/users/populer", userController.populer);

module.exports = router;
