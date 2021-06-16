const express = require("express");
const {
  register,
  login,
  sendEmail,
  verifyEmail,
} = require("../controllers/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/email", sendEmail);
router.post("/verify", verifyEmail);

module.exports = router;
