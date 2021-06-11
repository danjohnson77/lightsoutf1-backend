const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");
const User = require("../models/User");

// @desc Register User
// @route POST /auth/register
// @access Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    //   Create user
    await User.create({
      name,
      email,
      password,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});

// @desc Login User
// @route POST /auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
  const { name, password } = req.body;

  // Validate email and password
  if (!name || !password) {
    return next(
      errorHandler(
        { message: "Please Provide an Email and Password", statusCode: 400 },
        req,
        res,
        next
      )
    );
  }

  try {
    const user = await User.findOne({ name }).select("+password");

    if (!user) {
      return next(
        errorHandler(
          { message: "Invalid Credentials", statusCode: 401 },
          req,
          res,
          next
        )
      );
    }
    //   //   Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(
        errorHandler(
          { message: "Invalid Credential", statusCode: 401 },
          req,
          res,
          next
        )
      );
    }

    res.status(200).send({
      success: true,
      user: { name: user.name, email: user.email, id: user._id },
    });
  } catch (error) {
    return next(errorHandler(error, req, res, next));
  }
});
