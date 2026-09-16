import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      // Registration succeeded but doesn't log the user in by itself
      // (your /auth/register endpoint just creates the account) —
      // so we immediately log in with the same credentials to take
      // them straight into the app instead of making them retype
      // everything on a separate login screen.
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
    <main className="login-page register-page">
      <section className="login-shell" aria-label="Create a Cliencia Pharmacy account">
        <div className="login-art" aria-hidden="true">
          <div className="login-brand">
            <span className="brand-mark">✚</span>
            <span>CLIENCIA<br /><strong>PHARMACY</strong></span>
          </div>
          <div className="art-caption">Join a better way to manage<br />every prescription.</div>
        </div>

        <div className="login-panel">
          <div className="login-panel-inner">
            <p className="login-eyebrow">Get started</p>
            <h1>Create account</h1>
            <p className="login-subtitle">Set up your staff account and start managing your pharmacy.</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="register-name-fields">
                <div className="login-field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="login-field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

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
                  placeholder="Create a password"
                />
              </div>

              {error && <p className="login-error" role="alert">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="login-submit">
                {isSubmitting ? "Creating account..." : "Create account"}
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <p className="register-prompt">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
          <p className="login-footer">Secure access for authorized pharmacy staff</p>
        </div>
      </section>
    </main>
  );
}

export default Register;