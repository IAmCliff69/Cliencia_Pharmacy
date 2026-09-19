import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/Logo.svg";
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
      const message =
        err?.response?.data?.detail ?? "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <ThemeToggle />
      <section className="login-shell" aria-label="Cliencia Pharmacy login">

        {/* LEFT — full-brightness photo + wavy boundary */}
        <div className="login-art" aria-hidden="true">
          <div className="login-art-bg" />

          <svg
            className="login-art-wave"
            viewBox="0 0 130 900"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M130,0 L130,900 L70,900 C70,900 10,780 50,630 C90,480 15,390 55,240 C85,120 70,0 70,0 Z" />
          </svg>

          <div className="login-brand">
            <img src={logo} alt="Cliencia Pharmacy" className="auth-logo" />
            <span>CLIENCIA<br /><strong>PHARMACY</strong></span>
          </div>
          <div className="art-caption">
            A simpler way to manage<br />every prescription.
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="login-panel">
          <div className="login-panel-inner">
            <p className="login-eyebrow">Welcome back</p>
            <h1>Login</h1>
            <p className="login-subtitle">
              Sign in to continue to your pharmacy workspace.
            </p>

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

              <div className="login-options login-options-end">
                <button type="button" className="forgot-link" onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </button>
              </div>

              {error && (
                <p className="login-error" role="alert">{error}</p>
              )}

              <button type="submit" disabled={isSubmitting} className="login-submit">
                {isSubmitting ? "Signing in..." : "Login to Pharmacy"}
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <p className="register-prompt">
              Don&apos;t have an account?{" "}
              <Link to="/register">Register now</Link>
            </p>
          </div>
          <p className="login-footer">Secure access for authorized pharmacy staff</p>
        </div>
      </section>
    </main>
  );
}

export default Login;