import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function StudentPortal() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [certificates, setCertificates] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("certichain_role") !== "student") {
      navigate("/student/login");
    }
  }, [navigate]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!studentId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStudentCertificates(studentId.trim());
      setCertificates(data.certificates || []);
    } catch (err) {
      setError(err.message);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(cert) {
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${cert.studentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyHash(hash) {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  }

  function handleCopyLink(hash) {
    const link = `${window.location.origin}/employer?hash=${hash}`;
    navigator.clipboard.writeText(link);
    setCopiedHash(hash + "-link");
    setTimeout(() => setCopiedHash(null), 1500);
  }

  function handleLogout() {
    sessionStorage.removeItem("certichain_role");
    navigate("/");
  }

  return (
    <main className="portal-page">
      <div className="portal-header">
        <div>
          <h2>Student Portal</h2>
          <div className="subtitle">Welcome, Student</div>
        </div>
        <div className="header-actions">
          <Link to="/" className="btn btn-ghost">
            ← Back to Home
          </Link>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3>Your Certificates</h3>
        <p className="panel-desc">Enter your Student ID to view certificates.</p>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.6rem" }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              placeholder="e.g., STU2024001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="submit" className="btn btn-green" disabled={loading}>
              {loading ? "Searching…" : "🔍 Search"}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-banner error">{error}</div>}

      {certificates === null && (
        <div className="info-callout">
          <strong>How to use this portal</strong>
          <ul>
            <li>Your certificates are automatically loaded based on your account</li>
            <li>Download certificates for your records</li>
            <li>Share your certificate hash or verification link with employers</li>
          </ul>
        </div>
      )}

      {certificates !== null && certificates.length === 0 && !loading && (
        <div className="empty-state">No certificates found for this Student ID.</div>
      )}

      {certificates && certificates.length > 0 && (
        <div className="panel">
          <h3>Issued Certificates</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Degree</th>
                  <th>University</th>
                  <th>Date Issued</th>
                  <th>Certificate Hash</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.certHash}>
                    <td>{c.courseName}</td>
                    <td>{c.degreeType}</td>
                    <td>{c.university}</td>
                    <td>{c.dateIssued}</td>
                    <td>
                      <span className="hash-pill">
                        {c.certHash.slice(0, 10)}…{c.certHash.slice(-6)}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: "0.4rem" }}>
                      <button className="muted-link" onClick={() => handleDownload(c)}>
                        Download
                      </button>
                      <button className="muted-link" onClick={() => handleCopyHash(c.certHash)}>
                        {copiedHash === c.certHash ? "Copied!" : "Copy hash"}
                      </button>
                      <button className="muted-link" onClick={() => handleCopyLink(c.certHash)}>
                        {copiedHash === c.certHash + "-link" ? "Copied!" : "Copy link"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
