/**
 * Register Buyer and Seller Agents on ERC-8004 Identity Registry
 * 
 * This script registers two agents on the Hedera testnet ERC-8004 registry:
 * 1. Buyer Agent - with purchase and negotiation capabilities
 * 2. Seller Agent - with sell, negotiate, and ship capabilities
 * 
 * The agent IDs will be saved to .env for future use
 */

import { erc8004Service } from "../src/services/erc8004";
import { AgentCapability } from "../src/types";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  console.log("🚀 Starting ERC-8004 Agent Registration\n");
  console.log("=" .repeat(60));
  console.log("📍 Network: Hedera Testnet");
  console.log(`📍 Registry: ${erc8004Service.getContractAddress()}`);
  console.log("=" .repeat(60));
  console.log();

  // Get credentials from environment
  const buyerPrivateKey = process.env.BUYER_PRIVATE_KEY;
  const buyerAddress = process.env.BUYER_EVM_ADDRESS;
  const sellerPrivateKey = process.env.SELLER_PRIVATE_KEY;
  const sellerAddress = process.env.SELLER_EVM_ADDRESS;

  if (!buyerPrivateKey || !buyerAddress || !sellerPrivateKey || !sellerAddress) {
    console.error("❌ Missing required environment variables:");
    console.error("   - BUYER_PRIVATE_KEY");
    console.error("   - BUYER_EVM_ADDRESS");
    console.error("   - SELLER_PRIVATE_KEY");
    console.error("   - SELLER_EVM_ADDRESS");
    process.exit(1);
  }

  try {
    // ========================================
    // Register Buyer Agent
    // ========================================
    console.log("👤 REGISTERING BUYER AGENT");
    console.log("-".repeat(60));
    
    const buyerCapabilities: AgentCapability[] = [
      {
        name: "purchase",
        description: "Discover and purchase items from marketplace",
        endpoint: "/api/buyer/purchase"
      },
      {
        name: "negotiate",
        description: "Negotiate prices with sellers",
        endpoint: "/api/buyer/negotiate"
      },
      {
        name: "confirm-delivery",
        description: "Confirm item delivery and release escrow",
        endpoint: "/api/buyer/confirm-delivery"
      }
    ];

    // Connect buyer wallet
    erc8004Service.connectWallet(buyerPrivateKey);

    const buyerAgentId = await erc8004Service.registerAgent(
      "MarketplaceBuyer",
      buyerAddress,
      buyerCapabilities,
      "https://marketplace.hedera.com/agents/buyer",
      [
        { key: "agentType", value: "buyer" },
        { key: "version", value: "1.0.0" }
      ]
    );

    console.log(`✅ Buyer Agent registered successfully!`);
    console.log(`   Agent ID: ${buyerAgentId}`);
    console.log(`   Owner: ${buyerAddress}`);
    console.log(`   Capabilities: ${buyerCapabilities.map(c => c.name).join(", ")}`);
    console.log();

    // ========================================
    // Register Seller Agent
    // ========================================
    console.log("🏪 REGISTERING SELLER AGENT");
    console.log("-".repeat(60));
    
    const sellerCapabilities: AgentCapability[] = [
      {
        name: "sell",
        description: "List and sell items on marketplace",
        endpoint: "/api/seller/sell"
      },
      {
        name: "negotiate",
        description: "Negotiate prices with buyers",
        endpoint: "/api/seller/negotiate"
      },
      {
        name: "ship",
        description: "Confirm shipment of items",
        endpoint: "/api/seller/ship"
      },
      {
        name: "instant-payment",
        description: "Accept HBAR payments via escrow",
        endpoint: "/api/seller/payment"
      }
    ];

    // Connect seller wallet
    erc8004Service.connectWallet(sellerPrivateKey);

    const sellerAgentId = await erc8004Service.registerAgent(
      "MarketplaceSeller",
      sellerAddress,
      sellerCapabilities,
      "https://marketplace.hedera.com/agents/seller",
      [
        { key: "agentType", value: "seller" },
        { key: "version", value: "1.0.0" }
      ]
    );

    console.log(`✅ Seller Agent registered successfully!`);
    console.log(`   Agent ID: ${sellerAgentId}`);
    console.log(`   Owner: ${sellerAddress}`);
    console.log(`   Capabilities: ${sellerCapabilities.map(c => c.name).join(", ")}`);
    console.log();

    // ========================================
    // Update .env file with agent IDs
    // ========================================
    console.log("💾 UPDATING .ENV FILE");
    console.log("-".repeat(60));

    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf-8");

    // Add or update agent IDs
    const buyerAgentIdLine = `BUYER_AGENT_ID=${buyerAgentId}`;
    const sellerAgentIdLine = `SELLER_AGENT_ID=${sellerAgentId}`;

    if (envContent.includes("BUYER_AGENT_ID=")) {
      envContent = envContent.replace(/BUYER_AGENT_ID=.*/, buyerAgentIdLine);
    } else {
      envContent += `\n# ERC-8004 Agent IDs\n${buyerAgentIdLine}\n`;
    }

    if (envContent.includes("SELLER_AGENT_ID=")) {
      envContent = envContent.replace(/SELLER_AGENT_ID=.*/, sellerAgentIdLine);
    } else {
      envContent += `${sellerAgentIdLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);

    console.log(`✅ .env file updated with agent IDs`);
    console.log();

    // ========================================
    // Verify Registration
    // ========================================
    console.log("🔍 VERIFYING REGISTRATION");
    console.log("-".repeat(60));

    const buyerInfo = await erc8004Service.getAgentInfo(buyerAgentId);
    const sellerInfo = await erc8004Service.getAgentInfo(sellerAgentId);

    console.log(`✅ Buyer Agent verified:`);
    console.log(`   Agent ID: ${buyerInfo.agentId}`);
    console.log(`   Owner: ${buyerInfo.owner}`);
    console.log(`   Token URI: ${buyerInfo.tokenURI}`);
    console.log(`   Name: ${buyerInfo.metadata.agentName}`);
    console.log(`   Type: ${buyerInfo.metadata.agentType}`);
    console.log();

    console.log(`✅ Seller Agent verified:`);
    console.log(`   Agent ID: ${sellerInfo.agentId}`);
    console.log(`   Owner: ${sellerInfo.owner}`);
    console.log(`   Token URI: ${sellerInfo.tokenURI}`);
    console.log(`   Name: ${sellerInfo.metadata.agentName}`);
    console.log(`   Type: ${sellerInfo.metadata.agentType}`);
    console.log();

    // ========================================
    // Summary
    // ========================================
    console.log("=" .repeat(60));
    console.log("🎉 REGISTRATION COMPLETE!");
    console.log("=" .repeat(60));
    console.log();
    console.log("📊 Summary:");
    console.log(`   ✅ Buyer Agent ID: ${buyerAgentId}`);
    console.log(`   ✅ Seller Agent ID: ${sellerAgentId}`);
    console.log(`   ✅ Both agents registered on-chain`);
    console.log(`   ✅ Agent IDs saved to .env`);
    console.log();
    console.log("🔗 View on HashScan:");
    console.log(`   Buyer: https://hashscan.io/testnet/contract/${erc8004Service.getContractAddress()}`);
    console.log(`   Seller: https://hashscan.io/testnet/contract/${erc8004Service.getContractAddress()}`);
    console.log();
    console.log("✨ Next Steps:");
    console.log("   1. Verify agents on HashScan");
    console.log("   2. Test agent discovery");
    console.log("   3. Proceed with AgentCard creation");
    console.log();

  } catch (error: any) {
    console.error("\n❌ Registration failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

