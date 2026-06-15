// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockCertify {

    address public owner;

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

    mapping(bytes32 => Certificate) private certificates;
    bytes32[] private allCertHashes;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => uint256) private verificationCount;
    mapping(address => uint256) private verificationWindowStart;

    event CertificateIssued(bytes32 indexed certHash, string studentId, address indexed issuer, uint256 dateIssued);
    event CertificateVerified(bytes32 indexed certHash, address indexed verifier, bool isValid, uint256 timestamp);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event InvalidCertificateAlert(bytes32 indexed certHash, address indexed verifier);
    event UnauthorizedAccessAlert(address indexed caller, string action);
    event MultipleFailedVerificationAlert(address indexed verifier, uint256 attempts);

    modifier onlyOwner() {
        require(msg.sender == owner, "BlockCertify: caller is not the owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        if (!authorizedIssuers[msg.sender]) {
            emit UnauthorizedAccessAlert(msg.sender, "issueCertificate");
            revert("BlockCertify: caller is not an authorized university admin");
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    function authorizeIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "BlockCertify: zero address");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }

    function revokeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "BlockCertify: not an issuer");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    function issueCertificate(
        string calldata _studentName,
        string calldata _studentId,
        string calldata _courseName,
        string calldata _degreeType,
        string calldata _university,
        string calldata _issuedBy,
        bytes32 _certHash
    ) external onlyAuthorizedIssuer {
        require(_certHash != bytes32(0), "BlockCertify: invalid hash");
        require(!certificates[_certHash].exists, "BlockCertify: certificate already exists");
        require(bytes(_studentId).length > 0, "BlockCertify: studentId required");

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

        emit CertificateIssued(_certHash, _studentId, msg.sender, block.timestamp);
    }

    function verifyCertificate(bytes32 _certHash) external returns (bool isValid) {
        if (block.timestamp > verificationWindowStart[msg.sender] + VERIFICATION_WINDOW) {
            verificationWindowStart[msg.sender] = block.timestamp;
            verificationCount[msg.sender] = 0;
        }
        require(
            verificationCount[msg.sender] < MAX_VERIFICATIONS_PER_WINDOW,
            "BlockCertify: verification limit exceeded, try again later"
        );

        verificationCount[msg.sender] += 1;
        isValid = certificates[_certHash].exists;

        if (!isValid) {
            if (verificationCount[msg.sender] >= MAX_VERIFICATIONS_PER_WINDOW - 2) {
                emit MultipleFailedVerificationAlert(msg.sender, verificationCount[msg.sender]);
            }
            emit InvalidCertificateAlert(_certHash, msg.sender);
        }

        emit CertificateVerified(_certHash, msg.sender, isValid, block.timestamp);
        return isValid;
    }

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

    function getTotalCertificates() external view returns (uint256) {
        return allCertHashes.length;
    }

    function getLastIssuedHash() external view returns (bytes32) {
        if (allCertHashes.length == 0) return bytes32(0);
        return allCertHashes[allCertHashes.length - 1];
    }

    function getAllCertificateHashes() external view returns (bytes32[] memory) {
        return allCertHashes;
    }
}
