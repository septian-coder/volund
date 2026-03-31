const hre = require("hardhat");

async function main() {
  const VolundVouch = await hre.ethers.getContractFactory("VolundVouch");
  console.log("Deploying VolundVouch...");
  
  const vouch = await VolundVouch.deploy();
  await vouch.waitForDeployment();
  
  const address = await vouch.getAddress();
  console.log(`VolundVouch deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
