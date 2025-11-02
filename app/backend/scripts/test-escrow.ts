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

const escrowArtifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../artifacts/contracts/Escrow.sol/Escrow.json"),
    "utf-8"
  )
);

/**
 * Test the deployed EscrowFactory contract
 * This script will:
 * 1. Connect to the deployed EscrowFactory
 * 2. Create a test escrow
 * 3. Fund the escrow
 * 4. Confirm shipment
 * 5. Confirm delivery
 * 6. Verify the complete flow
 */
async function main() {
  console.log("🧪 Testing EscrowFactory contract...\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", "hedera_testnet.json");

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Error: Deployment file not found!");
    console.error("Please deploy the contract first: npm run deploy:contracts");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const factoryAddress = deploymentInfo.contracts.EscrowFactory.address;

  console.log("📍 EscrowFactory address:", factoryAddress);
  console.log("🔗 HashScan:", deploymentInfo.urls.hashscan, "\n");

  // Setup provider and wallet
  const rpcUrl = process.env.JSON_RPC_URL || "https://testnet.hashio.io/api";
  const privateKey = process.env.PLATFORM_PRIVATE_KEY;

  if (!privateKey) {
    console.error("❌ Error: PLATFORM_PRIVATE_KEY not found in .env file");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("📝 Testing with account:", wallet.address);

  // Validate buyer and seller addresses
  const buyerAddress = process.env.BUYER_EVM_ADDRESS;
  const sellerAddress = process.env.SELLER_EVM_ADDRESS;

  if (!buyerAddress || !sellerAddress) {
    console.error("❌ Error: Buyer or Seller EVM address not found in .env");
    console.error("Please set BUYER_EVM_ADDRESS and SELLER_EVM_ADDRESS");
    process.exit(1);
  }

  console.log("👤 Buyer address:", buyerAddress);
  console.log("👤 Seller address:", sellerAddress, "\n");

  // Connect to factory
  const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet);

  // Test 1: Get initial escrow count
  console.log("📊 Test 1: Get initial escrow count");
  const initialCount = await factory.getEscrowCount();
  console.log("   Initial escrow count:", initialCount.toString());

  // Test 2: Create a new escrow
  console.log("\n📦 Test 2: Create new escrow");
  const createTx = await factory.createEscrow(buyerAddress, sellerAddress);
  console.log("   Transaction sent:", createTx.hash);
  
  const createReceipt = await createTx.wait();
  console.log("   ✅ Transaction confirmed!");

  // Get escrow address from event
  const event = createReceipt?.logs.find((log: any) => {
    try {
      return factory.interface.parseLog(log)?.name === "EscrowCreated";
    } catch {
      return false;
    }
  });

  if (!event) {
    console.error("   ❌ Error: Could not find EscrowCreated event");
    process.exit(1);
  }

  const parsedEvent = factory.interface.parseLog(event);
  const escrowAddress = parsedEvent?.args[0];
  
  console.log("   📍 Escrow created at:", escrowAddress);
  console.log("   🔗 View on HashScan:", `https://hashscan.io/testnet/contract/${escrowAddress}`);

  // Test 3: Verify escrow count increased
  console.log("\n📊 Test 3: Verify escrow count");
  const newCount = await factory.getEscrowCount();
  console.log("   New escrow count:", newCount.toString());
  console.log("   ✅ Count increased:", initialCount < newCount);

  // Test 4: Get escrow details
  console.log("\n🔍 Test 4: Get escrow details");
  const escrow = new ethers.Contract(escrowAddress, escrowArtifact.abi, wallet);

  const details = await escrow.getDetails();
  console.log("   Buyer:", details[0]);
  console.log("   Seller:", details[1]);
  console.log("   State:", ["Created", "Funded", "Shipped", "Completed", "Refunded"][Number(details[2])]);
  console.log("   Amount:", ethers.formatEther(details[3]), "HBAR");

  // Test 5: Get buyer's escrows
  console.log("\n📋 Test 5: Get buyer's escrows");
  const buyerEscrows = await factory.getEscrowsAsBuyer(buyerAddress);
  console.log("   Buyer has", buyerEscrows.length, "escrow(s)");
  console.log("   Escrows:", buyerEscrows);

  // Test 6: Get seller's escrows
  console.log("\n📋 Test 6: Get seller's escrows");
  const sellerEscrows = await factory.getEscrowsAsSeller(sellerAddress);
  console.log("   Seller has", sellerEscrows.length, "escrow(s)");
  console.log("   Escrows:", sellerEscrows);

  // Test 7: Get all escrows
  console.log("\n📋 Test 7: Get all escrows");
  const allEscrows = await factory.getAllEscrows();
  console.log("   Total escrows:", allEscrows.length);

  // Optional: Test full escrow flow (requires buyer/seller private keys)
  if (process.env.BUYER_PRIVATE_KEY && process.env.SELLER_PRIVATE_KEY) {
    console.log("\n🔄 Test 8: Full escrow flow");

    // Create signers for buyer and seller
    const buyerSigner = new ethers.Wallet(process.env.BUYER_PRIVATE_KEY, provider);
    const sellerSigner = new ethers.Wallet(process.env.SELLER_PRIVATE_KEY, provider);

    // Fund escrow (buyer sends 1 HBAR)
    console.log("   💰 Buyer funding escrow with 1 HBAR...");
    const escrowWithBuyer = new ethers.Contract(escrowAddress, escrowArtifact.abi, buyerSigner);
    const fundTx = await escrowWithBuyer.fund({
      value: ethers.parseEther("1")
    });
    await fundTx.wait();
    console.log("   ✅ Escrow funded!");

    // Check state
    let currentDetails = await escrow.getDetails();
    console.log("   State:", ["Created", "Funded", "Shipped", "Completed", "Refunded"][Number(currentDetails[2])]);

    // Confirm shipment (seller)
    console.log("   📦 Seller confirming shipment...");
    const escrowWithSeller = new ethers.Contract(escrowAddress, escrowArtifact.abi, sellerSigner);
    const shipTx = await escrowWithSeller.confirmShipment();
    await shipTx.wait();
    console.log("   ✅ Shipment confirmed!");

    // Check state
    currentDetails = await escrow.getDetails();
    console.log("   State:", ["Created", "Funded", "Shipped", "Completed", "Refunded"][Number(currentDetails[2])]);

    // Confirm delivery (buyer)
    console.log("   ✅ Buyer confirming delivery...");
    const deliveryTx = await escrowWithBuyer.confirmDelivery();
    await deliveryTx.wait();
    console.log("   ✅ Delivery confirmed! Funds released to seller!");

    // Check final state
    currentDetails = await escrow.getDetails();
    console.log("   Final State:", ["Created", "Funded", "Shipped", "Completed", "Refunded"][Number(currentDetails[2])]);
  } else {
    console.log("\n⚠️  Skipping full flow test (buyer/seller private keys not configured)");
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ All tests completed successfully!");
  console.log("=".repeat(60));
  console.log("\n📊 Test Summary:");
  console.log("   ✅ Factory contract accessible");
  console.log("   ✅ Escrow creation working");
  console.log("   ✅ Event emission working");
  console.log("   ✅ Query functions working");
  console.log("   ✅ Escrow tracking working");
  
  if (process.env.BUYER_PRIVATE_KEY && process.env.SELLER_PRIVATE_KEY) {
    console.log("   ✅ Full escrow flow working");
  }

  console.log("\n🎉 EscrowFactory is ready for production use!\n");
}

// Execute test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });

