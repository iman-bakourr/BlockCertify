const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * POST /api/student/login
 * Demo authentication for students (Figure 6).
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  db.addAuditEntry("STUDENT_LOGIN", { email });
  return res.json({
    success: true,
    token: "demo-student-token",
    user: { email, role: "student" },
  });
});

/**
 * GET /api/student/certificates?studentId=STU2024001
 * Returns certificates belonging to a student (Figure 7 "Your Certificates").
 * The student does not interact with the smart contract directly; the
 * backend retrieves data from its database and the certificate's
 * existence on the blockchain is confirmed via the certHash.
 */
router.get("/certificates", (req, res) => {
  const { studentId } = req.query;
  if (!studentId) {
    return res.status(400).json({ error: "studentId query parameter is required" });
  }

  const certs = db.getCertificatesByStudentId(studentId);
  res.json({ certificates: certs });
});

/**
 * GET /api/student/certificates/:certHash/download
 * Returns a downloadable JSON representation of a certificate
 * ("Download certificate details" feature).
 */
router.get("/certificates/:certHash/download", (req, res) => {
  const cert = db.getCertificateByHash(req.params.certHash);
  if (!cert) {
    return res.status(404).json({ error: "Certificate not found" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="certificate-${cert.studentId}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(cert, null, 2));
});

module.exports = router;
