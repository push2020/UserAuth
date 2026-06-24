import crypto from "crypto";
import bcrypt from "bcrypt";
import UserModel from "../Models/user.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Accepts an email address, generates a secure reset token, persists a hashed
 * copy on the user document, and emails the raw token as a link.
 * Always responds with 200 regardless of whether the email exists to prevent
 * user enumeration.
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(200).json({
        code: 200,
        message: "If that email is registered, a reset link has been sent.",
        success: true,
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // Best-effort email — token is already saved so the link still works.
    let emailFailed = false;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (_emailErr) {
      emailFailed = true;
    }

    const isDev = process.env.NODE_ENV !== "production";

    res.status(200).json({
      code: 200,
      message: emailFailed
        ? "Could not send email — check your EMAIL_PASS in .env."
        : "If that email is registered, a reset link has been sent.",
      success: true,
      // Only expose the reset URL in dev when email failed, so the flow stays testable.
      ...(isDev && emailFailed && { devResetUrl: resetUrl }),
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

/**
 * Accepts the raw reset token and a new password. Verifies the token hash
 * matches a non-expired record, then replaces the stored password hash and
 * clears the reset fields.
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: "Reset link is invalid or has expired.",
        success: false,
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      code: 200,
      message: "Password reset successful. You can now sign in.",
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
