const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");
const User = require("../models/User");

// @desc Register User
// @route POST /api/v1/auth/register
// @access Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    //   Create user
    await User.create({
      username,
      email,
      password,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});
