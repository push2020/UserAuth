import jwt from "jsonwebtoken";
import UserModel from "../Models/user.js";

export const MenuValidation = async (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res
        .status(403)
        .json({ code: 403, message: "No token, authorization denied" });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decode._id).select("-password");
    if (!req.user) {
      return res
        .status(403)
        .json({ code: 403, message: "User not found or unauthorized" });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      code: e.name === "TokenExpiredError" ? 419 : 403,
      message: "Token is not valid",
      errormessage: error.message,
    });
  }
};
