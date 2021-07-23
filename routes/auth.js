const express = require("express");
const {
  register,
  login,
  sendEmail,
  verifyEmail,
  getUser,
} = require("../controllers/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/email", sendEmail);
router.post("/verify", verifyEmail);
router.post("/me", getUser);

module.exports = router;
