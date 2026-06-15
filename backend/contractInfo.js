const fs = require("fs");
const path = require("path");

/**
 * Loads the BlockCertify contract ABI + address.
 *
 * Priority:
 *  1. ../deployments/BlockCertify.json  (written by scripts/deploy.js)
 *  2. CONTRACT_ADDRESS env var + bundled ABI fallback below
 */
function loadContractInfo() {
  const deploymentPath = path.join(__dirname, "..", "..", "deployments", "BlockCertify.json");

  if (fs.existsSync(deploymentPath)) {
    const data = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    return { address: data.address, abi: data.abi };
  }

  // Fallback minimal ABI (kept in sync with contracts/BlockCertify.sol)
  const abi = [
    "function owner() view returns (address)",
    "function authorizedIssuers(address) view returns (bool)",
    "function authorizeIssuer(address _issuer) external",
    "function revokeIssuer(address _issuer) external",
    "function issueCertificate(string _studentName, string _studentId, string _courseName, string _degreeType, string _university, string _issuedBy, bytes32 _certHash) external",
    "function verifyCertificate(bytes32 _certHash) external returns (bool)",
    "function checkCertificate(bytes32 _certHash) view returns (bool isValid, string studentName, string studentId, string courseName, string degreeType, string university, string issuedBy, uint256 dateIssued)",
    "function getTotalCertificates() view returns (uint256)",
    "function getLastIssuedHash() view returns (bytes32)",
    "function getAllCertificateHashes() view returns (bytes32[])",
    "event CertificateIssued(bytes32 indexed certHash, string studentId, address indexed issuer, uint256 dateIssued)",
    "event CertificateVerified(bytes32 indexed certHash, address indexed verifier, bool isValid, uint256 timestamp)",
    "event InvalidCertificateAlert(bytes32 indexed certHash, address indexed verifier)",
  ];

  return { address: process.env.CONTRACT_ADDRESS, abi };
}

module.exports = { loadContractInfo };
