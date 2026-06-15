import jwt from "jsonwebtoken";
import Joi from "joi";
import UserModel from "../Models/user.js";

export const userAuthentication = async (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token) {
    return res
      .status(403)
      .json({ code: 403, message: "No token, authorization denied" });
  }

  try {
    //verify token
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await UserModel.findById(decode._id).select("-password");
    if (!req.user) {
      return res
        .status(403)
        .json({ code: 403, message: "User not found or unauthorized" });
    }

    next();
  } catch (e) {
    console.log("Auth error:", e);
    return res.status(403).json({
      code: e.name === "TokenExpiredError" ? 419 : 403,
      message: "Token is not valid",
      errormessage: e.message,
    });
  }
};

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
