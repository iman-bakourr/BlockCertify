/**
 * Simple in-memory "database" for off-chain certificate metadata.
 *
 * Per the proposal (Section 3.2c Privacy Protection Rules), only the
 * certificate HASH is stored on the blockchain. Full personal details
 * (student name, course, etc.) are kept in the backend's database and
 * linked to the on-chain hash, so sensitive student information is not
 * exposed publicly on the immutable ledger.
 *
 * In production this would be a real database (e.g. MongoDB/PostgreSQL).
 */

const certificates = new Map(); // certHash -> certificate record
const auditLog = []; // simple audit trail (section 3.2f)

function addAuditEntry(action, details) {
  auditLog.push({
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

function saveCertificate(certHash, record) {
  certificates.set(certHash, record);
  addAuditEntry("CERTIFICATE_ISSUED", { certHash, studentId: record.studentId });
}

function getCertificateByHash(certHash) {
  return certificates.get(certHash) || null;
}

function getCertificatesByStudentId(studentId) {
  return Array.from(certificates.values()).filter(
    (c) => c.studentId.toLowerCase() === studentId.toLowerCase()
  );
}

function getAllCertificates() {
  return Array.from(certificates.values());
}

function getAuditLog() {
  return auditLog;
}

module.exports = {
  saveCertificate,
  getCertificateByHash,
  getCertificatesByStudentId,
  getAllCertificates,
  addAuditEntry,
  getAuditLog,
};
