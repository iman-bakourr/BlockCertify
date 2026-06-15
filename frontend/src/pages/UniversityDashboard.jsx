import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useWeb3 } from "../useWeb3";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  studentName: "",
  studentId: "",
  courseName: "",
  degreeType: "",
  graduationDate: "",
  university: "",
  gpa: "",
  issuedBy: "",
};

export default function UniversityDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("issue"); // 'issue' | 'all'
  const [dashboard, setDashboard] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success, message }
  const { account, connecting, error: web3Error, connectWallet, issueCertificateOnChain } = useWeb3();

  useEffect(() => {
    if (sessionStorage.getItem("blockcertify_role") !== "university") {
      navigate("/university/login");
      return;
    }
    loadDashboard();
    loadCertificates();
  }, [navigate]);

  async function loadDashboard() {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (err) {
      setDashboard({ error: err.message });
    }
  }

  async function loadCertificates() {
    try {
      const data = await api.getAllCertificates();
      setCertificates(data.certificates || []);
    } catch (err) {
      // non-fatal
    }
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        ...form,
        graduationDate: form.graduationDate || today(),
      };
      const data = await api.issueCertificate(payload);
      setResult({ success: true, message: data.message, certHash: data.certificate.certHash });
      resetFormKeepResult();
      loadDashboard();
      loadCertificates();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function resetFormKeepResult() {
    setForm(emptyForm);
  }

  async function handleSignWithMetaMask() {
    setSubmitting(true);
    setResult(null);
    try {
      if (!account) await connectWallet();
      const payload = { ...form, graduationDate: form.graduationDate || today() };
      const onChain = await issueCertificateOnChain(payload);
      setResult({
        success: true,
        message: `Certificate issued on-chain via MetaMask (tx ${onChain.txHash.slice(0, 10)}…)`,
        certHash: onChain.certHash,
      });
      resetFormKeepResult();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("blockcertify_role");
    navigate("/");
  }

  return (
    <main className="portal-page">
      <div className="portal-header">
        <div>
          <h2>University Admin Portal</h2>
          <div className="subtitle">Welcome, University Admin</div>
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

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span>Total Certificates</span>
          </div>
          <div className="stat-value">{dashboard?.totalCertificates ?? "—"}</div>
          <div className="stat-sub">Stored on blockchain</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>Last Issued</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.1rem" }}>
            {dashboard?.lastIssued ?? "N/A"}
          </div>
          <div className="stat-sub">Most recent certificate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>Blockchain Status</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.1rem" }}>
            <span className={`status-dot ${dashboard?.blockchainStatus !== "Active" ? "offline" : ""}`} />
            {dashboard?.blockchainStatus ?? "Checking…"}
          </div>
          <div className="stat-sub">All systems operational</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "issue" ? "active" : ""}`} onClick={() => setTab("issue")}>
          + Issue Certificate
        </button>
        <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
          📄 View All
        </button>
      </div>

      {tab === "issue" && (
        <div className="panel">
          <h3>Issue New Certificate</h3>
          <p className="panel-desc">Fill in the student details to issue a new certificate on the blockchain.</p>

          {result && (
            <div className={`alert-banner ${result.success ? "success" : "error"}`}>
              {result.message}
              {result.certHash && (
                <div style={{ marginTop: "0.4rem" }}>
                  Certificate hash: <span className="hash-pill">{result.certHash}</span>
                </div>
              )}
            </div>
          )}
          {web3Error && <div className="alert-banner error">{web3Error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="studentName">Student Name *</label>
                <input
                  id="studentName"
                  placeholder="John Doe"
                  value={form.studentName}
                  onChange={(e) => updateField("studentName", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="studentId">Student ID *</label>
                <input
                  id="studentId"
                  placeholder="STU2024001"
                  value={form.studentId}
                  onChange={(e) => updateField("studentId", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="courseName">Course Name *</label>
                <input
                  id="courseName"
                  placeholder="Computer Science"
                  value={form.courseName}
                  onChange={(e) => updateField("courseName", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="degreeType">Degree Type *</label>
                <select
                  id="degreeType"
                  value={form.degreeType}
                  onChange={(e) => updateField("degreeType", e.target.value)}
                  required
                >
                  <option value="">Select degree type</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="graduationDate">Graduation Date *</label>
                <input
                  id="graduationDate"
                  type="date"
                  value={form.graduationDate}
                  onChange={(e) => updateField("graduationDate", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="university">University *</label>
                <input
                  id="university"
                  placeholder="University of Technology"
                  value={form.university}
                  onChange={(e) => updateField("university", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="gpa">GPA (Optional)</label>
                <input
                  id="gpa"
                  placeholder="3.75"
                  value={form.gpa}
                  onChange={(e) => updateField("gpa", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="issuedBy">Issued By *</label>
                <input
                  id="issuedBy"
                  placeholder="Dean of Academic Affairs"
                  value={form.issuedBy}
                  onChange={(e) => updateField("issuedBy", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Reset Form
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleSignWithMetaMask}
                disabled={submitting || connecting}
              >
                {account ? "Sign with MetaMask" : connecting ? "Connecting…" : "Connect & Sign (MetaMask)"}
              </button>
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Issuing…" : "Issue Certificate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "all" && (
        <div className="panel">
          <h3>Issued Certificates</h3>
          <p className="panel-desc">All certificates recorded on the blockchain by this university.</p>

          {certificates.length === 0 ? (
            <div className="empty-state">No certificates issued yet. Use “Issue Certificate” to create one.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Degree</th>
                    <th>Date Issued</th>
                    <th>Certificate Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.certHash}>
                      <td>{c.studentName}</td>
                      <td>{c.studentId}</td>
                      <td>{c.courseName}</td>
                      <td>{c.degreeType}</td>
                      <td>{c.dateIssued}</td>
                      <td>
                        <span className="hash-pill">
                          {c.certHash.slice(0, 10)}…{c.certHash.slice(-6)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
