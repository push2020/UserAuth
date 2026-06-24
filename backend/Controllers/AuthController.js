import crypto from "crypto";
import UserModel from "../Models/user.js";
import OtpModel from "../Models/otp.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Creates a new user account after verifying the OTP sent to their email.
 * Deletes the OTP record on success so it cannot be reused.
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: "User already exist. Please login instead.",
        success: false,
      });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpRecord = await OtpModel.findOne({
      email,
      otpHash,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        code: 400,
        message: "Invalid or expired verification code.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ name, email, password: hashedPassword });
    await OtpModel.deleteMany({ email });

    res.status(201).json({
      code: 201,
      message: "User registered successfully.",
      success: true,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: e.message,
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(403).json({
        code: 404,
        message: "User not found. Please sign up first.",
        success: false,
      });
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      return res
        .status(403)
        .json({ code: 403, message: "Invalid Password.", success: false });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      code: 200,
      message: "Login successful",
      jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      success: true,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later",
      errormessage: e.message,
      success: false,
    });
  }
};
