const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const CertiChain = await hre.ethers.getContractFactory("CertiChain");
  const certiChain = await CertiChain.deploy();
  await certiChain.waitForDeployment();

  const address = await certiChain.getAddress();
  console.log("CertiChain deployed to:", address);

  // Save the address + ABI so the backend and frontend can pick it up.
  const artifact = await hre.artifacts.readArtifact("CertiChain");

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "CertiChain.json"),
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

  console.log(`Deployment info written to deployments/CertiChain.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
