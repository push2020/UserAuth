import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/ResetPassword.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";
import { useToast } from "../context/ToastContext.jsx";

const MIN_PASSWORD_LENGTH = 6;

/** Password visibility toggle icons. */
const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </svg>
);

/**
 * Full-page password reset form. Reads the reset token from the `?token=`
 * query param, submits it alongside the new password, and redirects the user
 * to sign in on success.
 */
export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token");

  // Submits the new password to the backend after local validation.
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!token) {
      showToast({
        title: "Invalid link",
        body: "This reset link is missing a token. Please request a new one.",
        type: "error",
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      showToast({
        title: "Password too short",
        body: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        title: "Passwords don't match",
        body: "Make sure both fields contain the same password.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    apiService.postRequest(
      AppConstants.Api_Domain + "auth/reset-password",
      { "Content-Type": "application/json" },
      JSON.stringify({ token, password }),
      (res) => {
        setIsSubmitting(false);
        setIsSuccess(true);
        showToast({ title: "Password updated", body: res.message });
      },
      (error) => {
        setIsSubmitting(false);
        showToast({
          title: "Reset failed",
          body: error?.message || "The link may be invalid or expired.",
          type: "error",
        });
      },
    );
  };

  return (
    <div className="reset-pw">
      <div className="reset-pw__bg" aria-hidden="true">
        <span className="reset-pw__orb reset-pw__orb--a" />
        <span className="reset-pw__orb reset-pw__orb--b" />
      </div>

      <div className="reset-pw__card">
        {isSuccess ? (
          <div className="reset-pw__success">
            <div className="reset-pw__success-icon" aria-hidden="true">✓</div>
            <h1 className="reset-pw__title">Password updated!</h1>
            <p className="reset-pw__sub">
              Your password has been reset. You can now sign in with your new
              credentials.
            </p>
            <Link to="/" className="reset-pw__back-link">
              Go to home &amp; sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="reset-pw__header">
              <p className="reset-pw__eyebrow">Account security</p>
              <h1 className="reset-pw__title">Set a new password</h1>
              <p className="reset-pw__sub">
                Choose a strong password you haven&rsquo;t used before.
              </p>
            </div>

            <form
              className="reset-pw__form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="reset-pw__field">
                <label htmlFor="rp-password">New password</label>
                <div className="reset-pw__field-wrap">
                  <input
                    id="rp-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="reset-pw__eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="reset-pw__field">
                <label htmlFor="rp-confirm">Confirm password</label>
                <input
                  id="rp-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                />
              </div>

              <button
                type="submit"
                className="reset-pw__submit"
                disabled={isSubmitting || !token}
              >
                {isSubmitting ? (
                  <span className="reset-pw__spinner" aria-hidden="true" />
                ) : (
                  <span>Reset password</span>
                )}
              </button>
            </form>

            <p className="reset-pw__footer">
              <Link to="/" className="reset-pw__footer-link">
                Back to home
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
