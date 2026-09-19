import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import ThemeToggle from "../components/ThemeToggle";
import "./Login.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(email);
      if (response.reset_token) {
        navigate(`/reset-password?token=${encodeURIComponent(response.reset_token)}`);
        return;
      }
      setMessage(response.message);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Unable to request a password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-simple-page">
      <ThemeToggle />
      <section className="auth-simple-panel" aria-label="Request password reset">
        <p className="login-eyebrow">Account recovery</p>
        <h1>Forgot password?</h1>
        <p className="login-subtitle">
          Enter your account email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
            />
          </div>

          {message && <p className="login-help" role="status">{message}</p>}
          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="login-submit">
            {isSubmitting ? "Requesting..." : "Request reset link"}
          </button>
        </form>

        <p className="register-prompt">
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default ForgotPassword;
