import Joi from "joi";

export const userValidation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/) // Indian phone format: starts 6-9, total 10 digits
      .required()
      .messages({
        "string.empty": "Phone number is required",
        "string.pattern.base":
          "Phone number must be a valid 10-digit Indian mobile number",
      }),
    avatar: Joi.string(),
    address: Joi.string(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: "Bad Request",
      errormessage: error.message,
    });
  }

  next();
};
