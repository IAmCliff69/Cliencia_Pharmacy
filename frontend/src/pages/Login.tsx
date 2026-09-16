import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      // Surface the backend's actual error message when available
      // (e.g. "Invalid email or password" or the deactivated-account
      // message from your /auth/login endpoint).
      const message =
        err?.response?.data?.detail ?? "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Cliencia Pharmacy login">
        <div className="login-art" aria-hidden="true">
          <div className="login-brand">
            <span className="brand-mark">✚</span>
            <span>CLIENCIA<br /><strong>PHARMACY</strong></span>
          </div>
          <div className="art-caption">A simpler way to manage<br />every prescription.</div>
        </div>

        <div className="login-panel">
          <div className="login-panel-inner">
            <p className="login-eyebrow">Welcome back</p>
            <h1>Login</h1>
            <p className="login-subtitle">Sign in to continue to your pharmacy workspace.</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="login-options">
                <label className="remember-option">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-link">Forgot password?</button>
              </div>

              {error && <p className="login-error" role="alert">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="login-submit">
                {isSubmitting ? "Signing in..." : "Login to Pharmacy"}
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <p className="register-prompt">
              Don&apos;t have an account? <Link to="/register">Register now</Link>
            </p>
          </div>
          <p className="login-footer">Secure access for authorized pharmacy staff</p>
        </div>
      </section>
    </main>
  );
}

export default Login;