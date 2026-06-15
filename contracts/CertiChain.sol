// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertiChain
 * @notice Blockchain-based academic certificate verification system.
 *
 * Security notes (per Milestone 1-2 of the assignment):
 *  - Follows the Checks-Effects-Interactions (CEI) pattern: every function
 *    validates conditions first, updates state second, and only then
 *    performs any external interaction or event emission.
 *  - No Ether is ever transferred by this contract, so classic reentrancy
 *    on fund withdrawal does not apply, but CEI ordering is still followed
 *    for consistency, auditability, and to prevent state inconsistencies
 *    if interactions are added later.
 *  - Only addresses granted the "university admin" role can issue
 *    certificates (Certificate Upload Validation, see proposal section 3.1b).
 *  - Once stored, certificate data cannot be edited or deleted
 *    (Blockchain Immutability Enforcement, section 3.2e).
 */
contract CertiChain {
    address public owner;

    // --- Threshold mechanism: limit verification attempts (section 3.1a) ---
    uint256 public constant MAX_VERIFICATIONS_PER_WINDOW = 20;
    uint256 public constant VERIFICATION_WINDOW = 1 hours;

    struct Certificate {
        string studentName;
        string studentId;
        string courseName;
        string degreeType;
        string university;
        string issuedBy;
        uint256 dateIssued;
        bytes32 certHash;
        address issuer;
        bool exists;
    }

    // certHash => Certificate record (Blockchain Ledger)
    mapping(bytes32 => Certificate) private certificates;

    // List of all issued certificate hashes (for "View All" admin feature)
    bytes32[] private allCertHashes;

    // Authorized university admin addresses (Authentication Control, 3.2a)
    mapping(address => bool) public authorizedIssuers;

    // Rate limiting for verification (anti-spam / fraud detection)
    mapping(address => uint256) private verificationCount;
    mapping(address => uint256) private verificationWindowStart;

    // --- Events (Audit Trail / Activity Logging, section 3.2f) ---
    event CertificateIssued(
        bytes32 indexed certHash,
        string studentId,
        address indexed issuer,
        uint256 dateIssued
    );
    event CertificateVerified(
        bytes32 indexed certHash,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event InvalidCertificateAlert(bytes32 indexed certHash, address indexed verifier);
    event UnauthorizedAccessAlert(address indexed caller, string action);
    event MultipleFailedVerificationAlert(address indexed verifier, uint256 attempts);

    // --- Modifiers (Access Control) ---
    modifier onlyOwner() {
        require(msg.sender == owner, "CertiChain: caller is not the owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        if (!authorizedIssuers[msg.sender]) {
            emit UnauthorizedAccessAlert(msg.sender, "issueCertificate");
            revert("CertiChain: caller is not an authorized university admin");
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        // Deployer is authorized as the first university admin by default.
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    // ---------------------------------------------------------------
    // Admin management
    // ---------------------------------------------------------------

    /// @notice Grants university admin rights to a new address.
    function authorizeIssuer(address _issuer) external onlyOwner {
        // Checks
        require(_issuer != address(0), "CertiChain: zero address");
        // Effects
        authorizedIssuers[_issuer] = true;
        // Interaction
        emit IssuerAuthorized(_issuer);
    }

    /// @notice Revokes university admin rights from an address.
    function revokeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "CertiChain: not an issuer");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    // ---------------------------------------------------------------
    // Certificate issuance (University Admin -> Web App -> Blockchain)
    // ---------------------------------------------------------------

    /**
     * @notice Issues a new academic certificate and stores its hash on-chain.
     * @param _studentName Full name of the student.
     * @param _studentId University-assigned student ID.
     * @param _courseName Programme / course name.
     * @param _degreeType Degree type (e.g. Bachelor, Master).
     * @param _university Name of the issuing university.
     * @param _issuedBy Name/role of the issuing officer (e.g. "Dean of Academic Affairs").
     * @param _certHash Pre-computed keccak256 hash of the certificate data (Certificate Hash field).
     */
    function issueCertificate(
        string calldata _studentName,
        string calldata _studentId,
        string calldata _courseName,
        string calldata _degreeType,
        string calldata _university,
        string calldata _issuedBy,
        bytes32 _certHash
    ) external onlyAuthorizedIssuer {
        // --- Checks ---
        require(_certHash != bytes32(0), "CertiChain: invalid hash");
        require(!certificates[_certHash].exists, "CertiChain: certificate already exists");
        require(bytes(_studentId).length > 0, "CertiChain: studentId required");

        // --- Effects ---
        certificates[_certHash] = Certificate({
            studentName: _studentName,
            studentId: _studentId,
            courseName: _courseName,
            degreeType: _degreeType,
            university: _university,
            issuedBy: _issuedBy,
            dateIssued: block.timestamp,
            certHash: _certHash,
            issuer: msg.sender,
            exists: true
        });
        allCertHashes.push(_certHash);

        // --- Interaction (event emission) ---
        emit CertificateIssued(_certHash, _studentId, msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------
    // Certificate verification (Employer -> Web App -> Blockchain)
    // ---------------------------------------------------------------

    /**
     * @notice Verifies whether a certificate hash exists and is valid.
     * @dev Implements a simple per-address rate limit to mitigate
     *      verification spam (section 3.1a Verification Attempt Limit).
     */
    function verifyCertificate(bytes32 _certHash) external returns (bool isValid) {
        // --- Checks: rate limiting ---
        if (block.timestamp > verificationWindowStart[msg.sender] + VERIFICATION_WINDOW) {
            verificationWindowStart[msg.sender] = block.timestamp;
            verificationCount[msg.sender] = 0;
        }
        require(
            verificationCount[msg.sender] < MAX_VERIFICATIONS_PER_WINDOW,
            "CertiChain: verification limit exceeded, try again later"
        );

        // --- Effects ---
        verificationCount[msg.sender] += 1;
        isValid = certificates[_certHash].exists;

        if (!isValid) {
            if (verificationCount[msg.sender] >= MAX_VERIFICATIONS_PER_WINDOW - 2) {
                emit MultipleFailedVerificationAlert(msg.sender, verificationCount[msg.sender]);
            }
            emit InvalidCertificateAlert(_certHash, msg.sender);
        }

        // --- Interaction ---
        emit CertificateVerified(_certHash, msg.sender, isValid, block.timestamp);
        return isValid;
    }

    /**
     * @notice Read-only verification (no state change, no gas if called via `call`).
     *         Used by the frontend for instant "By Hash" checks.
     */
    function checkCertificate(bytes32 _certHash)
        external
        view
        returns (
            bool isValid,
            string memory studentName,
            string memory studentId,
            string memory courseName,
            string memory degreeType,
            string memory university,
            string memory issuedBy,
            uint256 dateIssued
        )
    {
        Certificate memory cert = certificates[_certHash];
        return (
            cert.exists,
            cert.studentName,
            cert.studentId,
            cert.courseName,
            cert.degreeType,
            cert.university,
            cert.issuedBy,
            cert.dateIssued
        );
    }

    // ---------------------------------------------------------------
    // Read helpers
    // ---------------------------------------------------------------

    /// @notice Returns the total number of certificates issued.
    function getTotalCertificates() external view returns (uint256) {
        return allCertHashes.length;
    }

    /// @notice Returns the hash of the most recently issued certificate.
    function getLastIssuedHash() external view returns (bytes32) {
        if (allCertHashes.length == 0) return bytes32(0);
        return allCertHashes[allCertHashes.length - 1];
    }

    /// @notice Returns all certificate hashes (for admin "View All").
    function getAllCertificateHashes() external view returns (bytes32[] memory) {
        return allCertHashes;
    }
}
