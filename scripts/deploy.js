const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const BlockCertify = await hre.ethers.getContractFactory("BlockCertify");
  const blockCertify = await BlockCertify.deploy();
  await blockCertify.waitForDeployment();

  const address = await blockCertify.getAddress();
  console.log("BlockCertify deployed to:", address);

  // Save the address + ABI so the backend and frontend can pick it up.
  const artifact = await hre.artifacts.readArtifact("BlockCertify");

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "BlockCertify.json"),
    JSON.stringify(
      {
        address,
        abi: artifact.abi,
        network: hre.network.name,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log(`Deployment info written to deployments/BlockCertify.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
