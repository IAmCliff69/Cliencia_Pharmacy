import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/auth";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/Logo.svg";
import "./Login.css";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profileImage) {
      setError("Please choose a profile image to create your account.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser(
        { first_name: firstName, last_name: lastName, email, password },
        profileImage
      );
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page register-page">
      <ThemeToggle />
      <section className="login-shell" aria-label="Create a Cliencia Pharmacy account">

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
            Join a better way to manage<br />every prescription.
          </div>
        </div>

        <div className="login-panel">
          {submitted ? (
            <div className="login-panel-inner" style={{ textAlign: "center", margin: "auto" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(47,201,244,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 26,
              }}>
                ⏳
              </div>
              <p className="login-eyebrow">Account created</p>
              <h1 style={{ fontSize: "clamp(28px,3.5vw,42px)", marginBottom: 12 }}>
                Pending approval
              </h1>
              <p className="login-subtitle" style={{ margin: "0 auto 24px" }}>
                Your account has been created and is waiting for an administrator
                to approve it. You'll be able to log in once approved.
              </p>
              <p className="register-prompt">
                Already approved? <Link to="/login">Sign in</Link>
              </p>
            </div>
          ) : (
            <div className="login-panel-inner">
              <p className="login-eyebrow">Get started</p>
              <h1>Create account</h1>
              <p className="login-subtitle">
                Set up your staff account. An admin will approve it before you can log in.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="register-name-fields">
                  <div className="login-field">
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName" type="text" required
                      value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="login-field">
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName" type="text" required
                      value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password" type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="profileImage">Profile image</label>
                  <input
                    id="profileImage" type="file" required
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setProfileImage(e.target.files?.[0] ?? null)}
                    className="register-file-input"
                  />
                  <span className="register-file-help">JPG, PNG, or WEBP up to 5 MB</span>
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
          )}
          <p className="login-footer">Secure access for authorized pharmacy staff</p>
        </div>
      </section>
    </main>
  );
}

export default Register;