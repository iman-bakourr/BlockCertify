import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";

export default function EmployerPortal() {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState("hash"); // 'hash' | 'details'
  const [certHash, setCertHash] = useState(searchParams.get("hash") || "");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hashParam = searchParams.get("hash");
    if (hashParam) {
      setCertHash(hashParam);
      setMethod("hash");
    }
  }, [searchParams]);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const payload =
        method === "hash" ? { method: "hash", certHash: certHash.trim() } : { method: "details", studentId: studentId.trim(), studentName: studentName.trim() };

      const data = await api.verifyCertificate(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-page">
      <div className="portal-header">
        <div>
          <h2>Employer Verification Portal</h2>
          <div className="subtitle">Verify certificate authenticity</div>
        </div>
        <div className="header-actions">
          <Link to="/" className="btn btn-ghost">
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="panel">
        <h3>Verify Certificate</h3>
        <p className="panel-desc">Choose a verification method to check certificate authenticity on the blockchain.</p>

        <div className="toggle-row">
          <button className={method === "hash" ? "active" : ""} onClick={() => setMethod("hash")} type="button">
            # By Hash
          </button>
          <button className={method === "details" ? "active" : ""} onClick={() => setMethod("details")} type="button">
            👤 By Details
          </button>
        </div>

        {error && <div className="alert-banner error">{error}</div>}

        <form onSubmit={handleVerify}>
          {method === "hash" ? (
            <div className="field">
              <label htmlFor="certHash">Certificate Hash</label>
              <input
                id="certHash"
                placeholder="Enter the certificate hash"
                value={certHash}
                onChange={(e) => setCertHash(e.target.value)}
                style={{ fontFamily: "var(--font-mono)" }}
                required
              />
              <div className="field-hint">
                The hash is a unique identifier generated when the certificate was issued.
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="field">
                <label htmlFor="studentId">Student ID</label>
                <input
                  id="studentId"
                  placeholder="e.g., STU2024001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="studentName">Student Name</label>
                <input
                  id="studentName"
                  placeholder="e.g., John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-violet btn-block" disabled={loading} style={{ marginTop: "0.75rem" }}>
            {loading ? "Verifying…" : "🔍 Verify Certificate"}
          </button>
        </form>

        {result && (
          <div className={`verify-result ${result.isValid ? "valid" : "invalid"}`}>
            <div className="verify-result-title">
              {result.isValid ? "✅ Certificate Valid" : "❌ Certificate Invalid"}
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{result.message}</p>

            {result.isValid && result.certificate && (
              <dl className="cert-detail-grid">
                <div>
                  <dt>Student Name</dt>
                  <dd>{result.certificate.studentName}</dd>
                </div>
                <div>
                  <dt>Student ID</dt>
                  <dd>{result.certificate.studentId}</dd>
                </div>
                <div>
                  <dt>Course</dt>
                  <dd>{result.certificate.courseName}</dd>
                </div>
                <div>
                  <dt>Degree</dt>
                  <dd>{result.certificate.degreeType}</dd>
                </div>
                <div>
                  <dt>University</dt>
                  <dd>{result.certificate.university}</dd>
                </div>
                <div>
                  <dt>Issued By</dt>
                  <dd>{result.certificate.issuedBy}</dd>
                </div>
                {result.certificate.gpa && (
                  <div>
                    <dt>GPA</dt>
                    <dd>{result.certificate.gpa}</dd>
                  </div>
                )}
              </dl>
            )}

            {result.certHash && (
              <div style={{ marginTop: "0.75rem" }}>
                <span className="hash-pill">{result.certHash}</span>
              </div>
            )}
          </div>
        )}

        <div className="info-callout">
          <strong>Verification Methods</strong>
          <ul>
            <li><strong>By Hash:</strong> Use the unique certificate hash provided by the candidate</li>
            <li><strong>By Details:</strong> Search using Student ID and Name</li>
            <li>All verifications are performed directly against the blockchain ledger</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
