const asyncHandler = require("../middleware/async");
const errorHandler = require("../middleware/error");
const sgMail = require("@sendgrid/mail");
const User = require("../models/User");

// @desc Register User
// @route POST /auth/register
// @access Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    //   Create user
    const user = await User.create({
      name,
      email,
      password,
    });
    const verifyToken = user.getVerifyToken();
    await user.save();
    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        verifyToken,
        id: user._id,
      },
    });
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

// @desc Send Email
// @route POST /auth/email
// @access Public
exports.sendEmail = asyncHandler(async (req, res, next) => {
  const { email, verifyToken, id } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const html = `<a href='http://localhost:3000/verify?token=${verifyToken}&id=${id}'>Click here</a> to verify your email`;

  const msg = {
    to: email,
    from: "noreply@lightsoutf1.racing",
    subject: "Verify your email",
    html,
  };

  try {
    await sgMail.send(msg);
    res.status(200).send({ success: true });
  } catch (error) {
    return next(
      errorHandler(
        { error: { message: error.response.body.errors.message, status: 500 } },
        req,
        res,
        next
      )
    );
  }
});

// @desc Verify Email
// @route POST /auth/verify
// @access Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token, id } = req.body;

  const user = await User.findById(id);

  const verified = user && user.checkToken(token);

  res.status(200).send({ success: verified });
});
