const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertiChain", function () {
  let certiChain;
  let owner, university2, employer;

  beforeEach(async function () {
    [owner, university2, employer] = await ethers.getSigners();
    const CertiChain = await ethers.getContractFactory("CertiChain");
    certiChain = await CertiChain.deploy();
    await certiChain.waitForDeployment();
  });

  it("sets the deployer as the owner and an authorized issuer", async function () {
    expect(await certiChain.owner()).to.equal(owner.address);
    expect(await certiChain.authorizedIssuers(owner.address)).to.equal(true);
  });

  it("allows the owner to authorize a new university admin", async function () {
    await certiChain.authorizeIssuer(university2.address);
    expect(await certiChain.authorizedIssuers(university2.address)).to.equal(true);
  });

  it("prevents non-owners from authorizing issuers", async function () {
    await expect(
      certiChain.connect(university2).authorizeIssuer(employer.address)
    ).to.be.revertedWith("CertiChain: caller is not the owner");
  });

  it("issues a certificate and stores its hash", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("STU2024001|Computer Science|John Doe"));

    await expect(
      certiChain.issueCertificate(
        "John Doe",
        "STU2024001",
        "Computer Science",
        "Bachelor",
        "University of Technology",
        "Dean of Academic Affairs",
        certHash
      )
    )
      .to.emit(certiChain, "CertificateIssued")
      .withArgs(certHash, "STU2024001", owner.address, await getBlockTimestamp());

    expect(await certiChain.getTotalCertificates()).to.equal(1n);
  });

  it("rejects issuance from unauthorized addresses", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
    await expect(
      certiChain
        .connect(university2)
        .issueCertificate("Jane", "STU002", "IT", "Bachelor", "Uni", "Dean", certHash)
    ).to.be.revertedWith("CertiChain: caller is not an authorized university admin");
  });

  it("prevents duplicate certificate hashes", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("dup"));
    await certiChain.issueCertificate("Jane", "STU002", "IT", "Bachelor", "Uni", "Dean", certHash);

    await expect(
      certiChain.issueCertificate("Jane", "STU002", "IT", "Bachelor", "Uni", "Dean", certHash)
    ).to.be.revertedWith("CertiChain: certificate already exists");
  });

  it("verifies an existing certificate as valid", async function () {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("valid-cert"));
    await certiChain.issueCertificate("Jane", "STU003", "IT", "Bachelor", "Uni", "Dean", certHash);

    const [isValid] = await certiChain.checkCertificate(certHash);
    expect(isValid).to.equal(true);
  });

  it("verifies a non-existent certificate as invalid", async function () {
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("does-not-exist"));
    const [isValid] = await certiChain.checkCertificate(fakeHash);
    expect(isValid).to.equal(false);
  });

  it("emits InvalidCertificateAlert for non-existent certs via verifyCertificate", async function () {
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("not-real"));
    await expect(certiChain.connect(employer).verifyCertificate(fakeHash))
      .to.emit(certiChain, "InvalidCertificateAlert")
      .withArgs(fakeHash, employer.address);
  });

  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 1; // next block timestamp (approx)
  }
});
