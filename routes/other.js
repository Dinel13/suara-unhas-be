const { Router } = require("express");

const {
  feedback,
  subNewsletter,
  bantuan,
} = require("../controllers/other-controller");

const router = Router();

router.post("/other/feedback", feedback);
router.post("/other/newsletter", subNewsletter);
router.post("/other/help", bantuan);

module.exports = router;
