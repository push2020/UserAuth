import Joi from "joi";

/** Validates that the request body contains a properly-formatted email address. */
export const forgotPasswordValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Email must be a valid email address",
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      code: 400,
      message: "Invalid request data.",
      errormessage: error.message,
      success: false,
    });
  }
  next();
};

/** Validates the reset token (64-char hex) and the new password. */
export const resetPasswordValidation = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().hex().length(64).required().messages({
      "string.empty": "Reset token is required",
      "string.hex": "Reset token is invalid",
      "string.length": "Reset token is invalid",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      code: 400,
      message: "Invalid request data.",
      errormessage: error.message,
      success: false,
    });
  }
  next();
};
