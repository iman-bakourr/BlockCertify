const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const blockchain = require("../blockchain");
const db = require("../db");

/**
 * POST /api/employer/verify
 * Verifies certificate authenticity (Figure 8 "Verify Certificate").
 *
 * Supports two verification methods as shown in the UI:
 *  - "By Hash": body = { method: "hash", certHash: "0x..." }
 *  - "By Details": body = { method: "details", studentId, studentName }
 *
 * All verifications are performed directly against the blockchain ledger.
 */
router.post("/verify", async (req, res) => {
  try {
    const { method, certHash, studentId, studentName } = req.body;

    let hashToCheck;

    if (method === "hash") {
      if (!certHash) {
        return res.status(400).json({ error: "certHash is required for hash verification" });
      }
      hashToCheck = certHash;
    } else if (method === "details") {
      if (!studentId || !studentName) {
        return res
          .status(400)
          .json({ error: "studentId and studentName are required for details verification" });
      }
      // Look up the certificate's hash from off-chain metadata by student details,
      // then confirm it on-chain.
      const matches = db.getCertificatesByStudentId(studentId).filter(
        (c) => c.studentName.toLowerCase() === studentName.toLowerCase()
      );
      if (matches.length === 0) {
        db.addAuditEntry("EMPLOYER_VERIFICATION_NOT_FOUND", { studentId, studentName });
        return res.json({ isValid: false, message: "No matching certificate found" });
      }
      hashToCheck = matches[0].certHash;
    } else {
      return res.status(400).json({ error: "method must be 'hash' or 'details'" });
    }

    // Normalize hash format
    if (!hashToCheck.startsWith("0x")) {
      hashToCheck = "0x" + hashToCheck;
    }
    if (!ethers.isHexString(hashToCheck, 32)) {
      return res.status(400).json({ error: "Invalid certificate hash format" });
    }

    // --- Blockchain verification (Hash Matching Threshold, 3.1c) ---
    const onChain = await blockchain.checkCertificateOnChain(hashToCheck);

    db.addAuditEntry("EMPLOYER_VERIFICATION", {
      certHash: hashToCheck,
      result: onChain.isValid ? "VALID" : "INVALID",
    });

    if (!onChain.isValid) {
      return res.json({
        isValid: false,
        message: "Certificate not found on blockchain. It may be fake or altered.",
        certHash: hashToCheck,
      });
    }

    // Optionally enrich with off-chain metadata (e.g. GPA) if available
    const offChain = db.getCertificateByHash(hashToCheck);

    return res.json({
      isValid: true,
      message: "Certificate verified successfully against the blockchain ledger.",
      certHash: hashToCheck,
      certificate: {
        studentName: onChain.studentName,
        studentId: onChain.studentId,
        courseName: onChain.courseName,
        degreeType: onChain.degreeType,
        university: onChain.university,
        issuedBy: onChain.issuedBy,
        dateIssued: onChain.dateIssued,
        gpa: offChain ? offChain.gpa : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
