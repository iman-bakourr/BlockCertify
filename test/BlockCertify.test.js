const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockCertify", function () {
  let blockCertify;
  let owner, university2, employer;

  beforeEach(async function () {
    [owner, university2, employer] = await ethers.getSigners();
    const BlockCertify = await ethers.getContractFactory("BlockCertify");
    blockCertify = await BlockCertify.deploy();
    await blockCertify.waitForDeployment();
  });

  it("sets the deployer as the owner and an authorized issuer", async function () {
    expect(await blockCertify.owner()).to.equal(owner.address);
    expect(await blockCertify.authorizedIssuers(owner.address)).to.equal(true);
  });

  it("allows the owner to authorize a new university admin", async function () {
    await blockCertify.authorizeIssuer(university2.address);
    expect(await blockCertify.authorizedIssuers(university2.address)).to.equal(true);
  });

  it("prevents non-owners from authorizing issuers", async function () {
    await expect(
      blockCertify.connect(university2).authorizeIssuer(employer.address)
    ).to.be.revertedWith("BlockCertify: caller is not the owner");
  });

  it("issues a certificate and stores its hash", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("STU2024001|Computer Science|John Doe"));

    await expect(
      blockCertify.issueCertificate(
        "John Doe",
        "STU2024001",
        "Computer Science",
        "Bachelor",
        "University of Technology",
        "Dean of Academic Affairs",
        certHash
      )
    )
      .to.emit(blockCertify, "CertificateIssued")
      .withArgs(certHash, "STU2024001", owner.address, await getBlockTimestamp());

    expect(await blockCertify.getTotalCertificates()).to.equal(1n);
  });

  it("rejects issuance from unauthorized addresses", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
    await expect(
      blockCertify
        .connect(university2)
        .issueCertificate("Jane", "STU002", "IT", "Bachelor", "Uni", "Dean", certHash)
    ).to.be.revertedWith("BlockCertify: caller is not an authorized university admin");
  });

  it("prevents duplicate certificate hashes", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("dup"));
    await blockCertify.issueCertificate("Jane", "STU002", "IT", "Bachelor", "Uni", "Dean", certHash);

    await expect(
      blockCertify.issueCertificate("Jane", "STU002", "IT", "Bachelor", "Uni", "Dean", certHash)
    ).to.be.revertedWith("BlockCertify: certificate already exists");
  });

  it("verifies an existing certificate as valid", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("valid-cert"));
    await blockCertify.issueCertificate("Jane", "STU003", "IT", "Bachelor", "Uni", "Dean", certHash);

    const [isValid] = await blockCertify.checkCertificate(certHash);
    expect(isValid).to.equal(true);
  });

  it("verifies a non-existent certificate as invalid", async function () {
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("does-not-exist"));
    const [isValid] = await blockCertify.checkCertificate(fakeHash);
    expect(isValid).to.equal(false);
  });

  it("emits InvalidCertificateAlert for non-existent certs via verifyCertificate", async function () {
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("not-real"));
    await expect(blockCertify.connect(employer).verifyCertificate(fakeHash))
      .to.emit(blockCertify, "InvalidCertificateAlert")
      .withArgs(fakeHash, employer.address);
  });

  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 1; // next block timestamp (approx)
  }
});
