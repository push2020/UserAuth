import crypto from "crypto";
import OtpModel from "../Models/otp.js";
import UserModel from "../Models/user.js";
import { sendOtpEmail } from "../utils/emailService.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a 4-digit OTP, stores its SHA-256 hash against the email,
 * and sends the raw code to the user's inbox.
 * Rejects if the email is already registered.
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: "An account with this email already exists. Please sign in.",
        success: false,
      });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Replace any previous OTP for this email before saving the new one.
    await OtpModel.deleteMany({ email });
    await OtpModel.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    // Best-effort email send — OTP is already saved so signup can still proceed.
    let emailFailed = false;
    try {
      await sendOtpEmail(email, otp);
    } catch (_emailErr) {
      emailFailed = true;
    }

    const isDev = process.env.NODE_ENV !== "production";

    res.status(200).json({
      code: 200,
      message: emailFailed
        ? "Could not send email — check your EMAIL_PASS in .env."
        : "Verification code sent. Please check your inbox.",
      success: true,
      // Only expose OTP in dev when email failed, so the feature stays testable.
      ...(isDev && emailFailed && { devOtp: otp }),
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
