import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.studentLogin(email, password);
      sessionStorage.setItem("blockcertify_role", "student");
      navigate("/student/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="portal-icon student" style={{ margin: "0 auto 0.75rem" }}>
            🎓
          </div>
          <h2>Student Portal</h2>
          <p>Sign in to access your certificates</p>
        </div>

        {error && <div className="alert-banner error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-green btn-block" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <p className="auth-footer-hint">Demo: Use any email and password to login</p>
        <div style={{ textAlign: "center" }}>
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
