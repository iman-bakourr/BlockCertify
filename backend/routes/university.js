const express = require("express");
const router = express.Router();
const blockchain = require("../blockchain");
const db = require("../db");

/**
 * POST /api/university/login
 * Demo authentication for university admins (Figure 4).
 * In production this would check hashed passwords against a real user table
 * and issue a JWT. Per the figure's note: "Demo: Use any email and password to login".
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  // Demo-only: accept any non-empty credentials.
  db.addAuditEntry("ADMIN_LOGIN", { email });
  return res.json({
    success: true,
    token: "demo-admin-token",
    user: { email, role: "university_admin" },
  });
});

/**
 * GET /api/university/dashboard
 * Returns summary stats for the admin dashboard (Figure 5):
 * Total Certificates, Last Issued, Blockchain Status.
 */
router.get("/dashboard", async (req, res) => {
  try {
    const total = await blockchain.getTotalCertificates();
    const lastHash = await blockchain.getLastIssuedHash();
    const status = await blockchain.getBlockchainStatus();

    let lastIssued = "N/A";
    if (lastHash && lastHash !== "0x" + "0".repeat(64)) {
      const cert = db.getCertificateByHash(lastHash);
      if (cert) lastIssued = cert.dateIssued;
    }

    res.json({
      totalCertificates: total,
      lastIssued,
      blockchainStatus: status.connected ? "Active" : "Offline",
      network: status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/university/certificates
 * Issues a new certificate (Figure 5 "Issue New Certificate" form).
 * Flow: front-end form -> backend computes hash -> backend (or relayer)
 * submits to smart contract -> store off-chain metadata -> return result.
 *
 * Body: { studentName, studentId, courseName, degreeType, graduationDate, university, gpa, issuedBy }
 */
router.post("/certificates", async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      courseName,
      degreeType,
      graduationDate,
      university,
      gpa,
      issuedBy,
    } = req.body;

    // --- Checks ---
    if (!studentName || !studentId || !courseName || !graduationDate || !university) {
      return res.status(400).json({ error: "Missing required certificate fields" });
    }

    const dateIssued = graduationDate;

    // Compute the hash the same way the contract/frontend would
    const certHash = blockchain.computeCertificateHash({
      studentId,
      studentName,
      courseName,
      dateIssued,
    });

    // --- On-chain interaction ---
    const onChainResult = await blockchain.issueCertificateOnChain({
      studentName,
      studentId,
      courseName,
      degreeType,
      university,
      issuedBy,
      dateIssued,
    });

    // --- Off-chain metadata storage (Privacy Protection Rules, 3.2c) ---
    const record = {
      studentName,
      studentId,
      courseName,
      degreeType: degreeType || "",
      university,
      gpa: gpa || null,
      issuedBy: issuedBy || "",
      dateIssued,
      certHash: onChainResult.certHash,
      txHash: onChainResult.txHash,
      blockNumber: onChainResult.blockNumber,
    };
    db.saveCertificate(onChainResult.certHash, record);

    res.status(201).json({
      success: true,
      message: "Certificate issued and recorded on the blockchain",
      certificate: record,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/university/certificates
 * Returns the list of all issued certificates ("View All" tab).
 */
router.get("/certificates", (req, res) => {
  res.json({ certificates: db.getAllCertificates() });
});

module.exports = router;
