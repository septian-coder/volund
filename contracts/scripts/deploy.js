const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(
    await ethers.provider.getBalance(deployer.address)
  ), "ETH");

  // 1. Deploy Registry
  console.log("\nDeploying VolundRegistry...");
  const Registry = await ethers.getContractFactory("VolundRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("VolundRegistry:", registryAddr);

  // 2. Deploy Badge
  console.log("\nDeploying VolundBadge...");
  const Badge = await ethers.getContractFactory("VolundBadge");
  const badge = await Badge.deploy();
  await badge.waitForDeployment();
  const badgeAddr = await badge.getAddress();
  console.log("VolundBadge:", badgeAddr);

  // 3. Deploy Score Oracle
  console.log("\nDeploying VolundScoreOracle...");
  const Oracle = await ethers.getContractFactory("VolundScoreOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log("VolundScoreOracle:", oracleAddr);

  // 4. Deploy Access Gate
  console.log("\nDeploying VolundAccessGate...");
  const Gate = await ethers.getContractFactory("VolundAccessGate");
  const gate = await Gate.deploy(oracleAddr, badgeAddr);
  await gate.waitForDeployment();
  const gateAddr = await gate.getAddress();
  console.log("VolundAccessGate:", gateAddr);

  // Save addresses to frontend constants
  const addresses = {
    VOLUND_REGISTRY:     registryAddr,
    VOLUND_BADGE:        badgeAddr,
    VOLUND_SCORE_ORACLE: oracleAddr,
    VOLUND_ACCESS_GATE:  gateAddr,
    CHAIN_ID:            84532,
    NETWORK:             "baseSepolia",
    DEPLOYED_AT:         new Date().toISOString()
  };

  // Save to frontend
  const outputPath = path.join(__dirname, "../../src/constants/contracts.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to src/constants/contracts.json");
  console.log("\nAll contracts deployed successfully!");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
