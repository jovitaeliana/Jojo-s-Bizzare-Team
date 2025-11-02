import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Load contract artifacts
const factoryArtifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../artifacts/contracts/EscrowFactory.sol/EscrowFactory.json"),
    "utf-8"
  )
);

/**
 * Deploy EscrowFactory contract to Hedera testnet
 * This script will:
 * 1. Deploy the EscrowFactory contract
 * 2. Verify the deployment
 * 3. Save the contract address to a file
 * 4. Display deployment information
 */
async function main() {
  console.log("🚀 Starting EscrowFactory deployment to Hedera testnet...\n");

  // Setup provider and wallet
  const rpcUrl = process.env.JSON_RPC_URL || "https://testnet.hashio.io/api";
  const privateKey = process.env.PLATFORM_PRIVATE_KEY;

  if (!privateKey) {
    console.error("❌ Error: PLATFORM_PRIVATE_KEY not found in .env file");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("📝 Deploying contracts with account:", wallet.address);

  // Get account balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no HBAR balance!");
    console.error("Please fund your account at: https://portal.hedera.com/faucet");
    process.exit(1);
  }

  // Deploy EscrowFactory
  console.log("📦 Deploying EscrowFactory contract...");
  const factory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );

  const escrowFactory = await factory.deploy();
  await escrowFactory.waitForDeployment();
  const factoryAddress = await escrowFactory.getAddress();

  console.log("✅ EscrowFactory deployed successfully!");
  console.log("📍 Contract address:", factoryAddress);
  console.log("🔗 View on HashScan:", `https://hashscan.io/testnet/contract/${factoryAddress}\n`);

  // Verify deployment by calling a view function
  console.log("🔍 Verifying deployment...");
  const escrowCount = await escrowFactory.getEscrowCount();
  console.log("✅ Verification successful! Initial escrow count:", escrowCount.toString());

  // Save deployment information
  const deploymentInfo = {
    network: "hedera_testnet",
    chainId: 296,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {
      EscrowFactory: {
        address: factoryAddress,
        transactionHash: escrowFactory.deploymentTransaction()?.hash,
      },
    },
    urls: {
      hashscan: `https://hashscan.io/testnet/contract/${factoryAddress}`,
      mirrorNode: `https://testnet.mirrornode.hedera.com/api/v1/contracts/${factoryAddress}`,
    },
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "hedera_testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Update .env file with contract address
  console.log("\n📝 Add this to your .env file:");
  console.log(`ESCROW_FACTORY_ADDRESS=${factoryAddress}`);

  // Display next steps
  console.log("\n✨ Deployment complete! Next steps:");
  console.log("1. Add the contract address to your .env file");
  console.log("2. Verify the contract on HashScan");
  console.log("3. Test creating an escrow with the factory");
  console.log("4. Update your backend services to use the deployed contract\n");

  // Example: Create a test escrow (optional)
  if (process.env.BUYER_EVM_ADDRESS && process.env.SELLER_EVM_ADDRESS) {
    console.log("🧪 Creating a test escrow...");
    const tx = await escrowFactory.createEscrow(
      process.env.BUYER_EVM_ADDRESS,
      process.env.SELLER_EVM_ADDRESS
    );
    const receipt = await tx.wait();
    
    // Get the escrow address from the event
    const event = receipt?.logs.find((log: any) => {
      try {
        return escrowFactory.interface.parseLog(log)?.name === "EscrowCreated";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsedEvent = escrowFactory.interface.parseLog(event);
      const escrowAddress = parsedEvent?.args[0];
      console.log("✅ Test escrow created at:", escrowAddress);
      console.log("🔗 View on HashScan:", `https://hashscan.io/testnet/contract/${escrowAddress}\n`);
    }
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

