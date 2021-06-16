const { Router } = require("express");

const { feedback, subNewsletter } = require("../controllers/other-controller");

const router = Router();

router.post("/other/feedback", feedback);
router.post("/other/newsletter", subNewsletter);

module.exports = router;
