import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "../api/auth";
import ThemeToggle from "../components/ThemeToggle";
import "./Login.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(token ? null : "This password reset link is missing its token.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(token, password);
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. You can now sign in." },
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Unable to reset your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-simple-page">
      <ThemeToggle />
      <section className="auth-simple-panel" aria-label="Reset password">
        <p className="login-eyebrow">Account recovery</p>
        <h1>Set a new password</h1>
        <p className="login-subtitle">
          Choose a new password with at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
            />
          </div>
          <div className="login-field">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting || !token} className="login-submit">
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="register-prompt">
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;
