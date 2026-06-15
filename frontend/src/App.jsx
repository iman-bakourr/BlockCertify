import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import UniversityLogin from "./pages/UniversityLogin.jsx";
import UniversityDashboard from "./pages/UniversityDashboard.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import EmployerPortal from "./pages/EmployerPortal.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">BC</span>
          BlockCertify
        </Link>
        <nav className="topbar-links">
          <Link to="/university/login">University</Link>
          <Link to="/student/login">Student</Link>
          <Link to="/employer">Employer</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/university/login" element={<UniversityLogin />} />
        <Route path="/university/dashboard" element={<UniversityDashboard />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/portal" element={<StudentPortal />} />
        <Route path="/employer" element={<EmployerPortal />} />
      </Routes>

      <footer className="site-footer">
        BlockCertify — Secure, Immutable, and Verifiable Academic Certificates on the Blockchain.
      </footer>
    </div>
  );
}
