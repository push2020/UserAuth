import nodemailer from "nodemailer";

/** Creates a nodemailer transporter from env-configured SMTP settings. */
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

/**
 * Sends a password-reset email to the given address.
 * @param {string} toEmail - Recipient email address.
 * @param {string} resetUrl - Full URL the user must visit to reset their password.
 */
/**
 * Sends a 4-digit OTP verification email for account creation.
 * @param {string} toEmail - Recipient email address.
 * @param {string} otp - The 4-digit code to include in the email.
 */
export const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || "Figgy";

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Figgy verification code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f6f4ef;border-radius:16px;">
        <h2 style="color:#ff6b35;margin:0 0 16px;">Verify your email</h2>
        <p style="color:#14141a;line-height:1.6;margin:0 0 24px;">
          Use the code below to complete your Figgy account creation.<br/>
          It expires in <strong>10 minutes</strong>.
        </p>
        <div style="display:inline-block;padding:18px 36px;background:#ff6b35;color:#fff;font-size:2rem;font-weight:700;border-radius:16px;letter-spacing:0.25em;">
          ${otp}
        </div>
        <p style="color:#6f6f7a;font-size:0.82rem;margin:24px 0 0;line-height:1.55;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || "Figgy";

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your Figgy password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f6f4ef;border-radius:16px;">
        <h2 style="color:#ff6b35;margin:0 0 16px;">Password Reset</h2>
        <p style="color:#14141a;line-height:1.6;margin:0 0 24px;">
          We received a request to reset your Figgy account password.<br/>
          Click the button below — this link is valid for <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#fff;font-weight:700;border-radius:999px;text-decoration:none;font-size:1rem;">
          Reset password
        </a>
        <p style="color:#6f6f7a;font-size:0.82rem;margin:24px 0 0;line-height:1.55;">
          If you didn't request this, you can safely ignore this email. Your password will not change.
        </p>
        <hr style="border:none;border-top:1px solid #e0ddd7;margin:24px 0;"/>
        <p style="color:#6f6f7a;font-size:0.75rem;margin:0;">
          If the button above doesn't work, paste this URL into your browser:<br/>
          <a href="${resetUrl}" style="color:#ff6b35;word-break:break-all;">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};
