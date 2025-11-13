const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TapLive Smart Contracts...");

  // Get the contract factories
  const TapLiveEscrow = await ethers.getContractFactory("TapLiveEscrow");
  const StreamingNFT = await ethers.getContractFactory("StreamingNFT");

  // Deploy contracts
  console.log("📦 Deploying TapLiveEscrow...");
  const escrow = await TapLiveEscrow.deploy("0x6c3ea903640685200629e0c4c4c4c4c4c4c4c4c4"); // PYUSD address
  await escrow.waitForDeployment();
  console.log("✅ TapLiveEscrow deployed to:", await escrow.getAddress());

  console.log("🎨 Deploying StreamingNFT...");
  const nft = await StreamingNFT.deploy();
  await nft.waitForDeployment();
  console.log("✅ StreamingNFT deployed to:", await nft.getAddress());

  // Create deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contracts: {
      escrow: await escrow.getAddress(),
      nft: await nft.getAddress()
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Chain ID: ${deploymentInfo.chainId}`);
  console.log(`Escrow Contract: ${deploymentInfo.contracts.escrow}`);
  console.log(`NFT Contract: ${deploymentInfo.contracts.nft}`);

  // Save deployment info
  const fs = require('fs');
  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log("\n🎉 All contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
