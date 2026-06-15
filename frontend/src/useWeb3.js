import { useCallback, useState } from "react";
import { ethers } from "ethers";

// These are populated after `npm run deploy:local` (see deployments/BlockCertify.json)
// and copied here, or read from an env var at build time.
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa";

const CONTRACT_ABI = [
  "function issueCertificate(string _studentName, string _studentId, string _courseName, string _degreeType, string _university, string _issuedBy, bytes32 _certHash) external",
  "function checkCertificate(bytes32 _certHash) view returns (bool isValid, string studentName, string studentId, string courseName, string degreeType, string university, string issuedBy, uint256 dateIssued)",
  "function authorizedIssuers(address) view returns (bool)",
];

/**
 * useWeb3 connects the frontend directly to MetaMask, so university admins
 * can sign the issueCertificate transaction themselves (Web3.js / MetaMask
 * as described in proposal section 4.1).
 *
 * The backend remains responsible for off-chain metadata storage and for
 * read-only verification queries used by the Employer portal.
 */
export function useWeb3() {
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it to issue certificates on-chain.");
      return null;
    }
    try {
      setConnecting(true);
      setError(null);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      return provider;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const getContract = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, []);

  const issueCertificateOnChain = useCallback(
    async ({ studentName, studentId, courseName, degreeType, university, issuedBy, dateIssued }) => {
      const contract = await getContract();
      const payload = `${studentId}|${studentName}|${courseName}|${dateIssued}`;
      const certHash = ethers.keccak256(ethers.toUtf8Bytes(payload));

      const tx = await contract.issueCertificate(
        studentName,
        studentId,
        courseName,
        degreeType || "",
        university || "",
        issuedBy || "",
        certHash
      );
      const receipt = await tx.wait();
      return { certHash, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    },
    [getContract]
  );

  return { account, connecting, error, connectWallet, getContract, issueCertificateOnChain, CONTRACT_ADDRESS };
}
