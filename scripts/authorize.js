const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const address = process.env.ISSUER || "0x7ae06CA054eBA5B7bd4902eA258bD620323C80b1";
  console.log("Authorizing address:", address);

  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "BlockCertify.json"), "utf-8")
  );

  const contract = await hre.ethers.getContractAt("BlockCertify", deployment.address);
  console.log("Authorizing", address, "as issuer on contract", deployment.address);
  const tx = await contract.authorizeIssuer(address);
  await tx.wait();
  console.log("Done! Tx:", tx.hash);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
