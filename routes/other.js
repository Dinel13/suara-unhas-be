const { Router } = require("express");

const { feedback } = require("../controllers/other-controller");

const router = Router();

router.post("/other/feedback", feedback);

module.exports = router;
