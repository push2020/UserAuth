import Joi from "joi";

/** Validates that the request body contains only a valid email address. */
export const sendOtpValidation = (req, res, next) => {
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
