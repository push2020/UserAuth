import express from "express";
import {
  signupValidation,
  loginValidation,
} from "../Middlewares/AuthValidation.js";
import {
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../Middlewares/PasswordResetValidation.js";
import { sendOtpValidation } from "../Middlewares/OtpValidation.js";
import { login, signup } from "../Controllers/AuthController.js";
import {
  forgotPassword,
  resetPassword,
} from "../Controllers/PasswordResetController.js";
import { sendOtp } from "../Controllers/OtpController.js";

const router = express.Router();

router.post("/login", loginValidation, login);
router.post("/signup", signupValidation, signup);
router.post("/send-otp", sendOtpValidation, sendOtp);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);

export default router;
