const { ethers } = require("ethers");
const { loadContractInfo } = require("./contractInfo");

const { address, abi } = loadContractInfo();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

// Backend "relayer" wallet - used for read calls and, if the deployment
// wants the backend to pay gas on behalf of universities, for sending
// transactions too. Students/employers normally use MetaMask directly
// from the frontend instead.
const wallet = process.env.PRIVATE_KEY
  ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  : null;

const readContract = new ethers.Contract(address, abi, provider);
const writeContract = wallet ? new ethers.Contract(address, abi, wallet) : null;

/**
 * Computes the keccak256 hash of a certificate's canonical data string.
 * This MUST match exactly how the frontend computes the hash before
 * sending it to the smart contract, so that verification later matches.
 */
function computeCertificateHash({ studentId, studentName, courseName, dateIssued }) {
  const payload = `${studentId}|${studentName}|${courseName}|${dateIssued}`;
  return ethers.keccak256(ethers.toUtf8Bytes(payload));
}

/**
 * Issues a certificate on-chain using the backend relayer wallet.
 * (Alternative to the frontend signing the tx directly via MetaMask.)
 */
async function issueCertificateOnChain(cert) {
  if (!writeContract) {
    throw new Error("Backend write wallet not configured (set PRIVATE_KEY in .env)");
  }

  const certHash = computeCertificateHash(cert);

  const tx = await writeContract.issueCertificate(
    cert.studentName,
    cert.studentId,
    cert.courseName,
    cert.degreeType || "",
    cert.university || "",
    cert.issuedBy || "",
    certHash
  );
  const receipt = await tx.wait();

  return { certHash, txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Reads certificate validity + on-chain data for a given hash (read-only, no gas).
 */
async function checkCertificateOnChain(certHash) {
  const result = await readContract.checkCertificate(certHash);
  return {
    isValid: result[0],
    studentName: result[1],
    studentId: result[2],
    courseName: result[3],
    degreeType: result[4],
    university: result[5],
    issuedBy: result[6],
    dateIssued: result[7].toString(),
  };
}

async function getTotalCertificates() {
  const total = await readContract.getTotalCertificates();
  return total.toString();
}

async function getLastIssuedHash() {
  return await readContract.getLastIssuedHash();
}

async function getBlockchainStatus() {
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    return {
      connected: true,
      chainId: network.chainId.toString(),
      blockNumber,
      contractAddress: address,
    };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = {
  provider,
  readContract,
  writeContract,
  computeCertificateHash,
  issueCertificateOnChain,
  checkCertificateOnChain,
  getTotalCertificates,
  getLastIssuedHash,
  getBlockchainStatus,
};
