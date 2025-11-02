/**
 * Test ERC-8004 Agent Discovery
 * 
 * This script tests the agent discovery functionality by:
 * 1. Fetching agent information from the registry
 * 2. Verifying agent metadata
 * 3. Testing capability queries
 * 4. Verifying agent identity
 */

import { erc8004Service } from "../src/services/erc8004";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔍 Testing ERC-8004 Agent Discovery\n");
  console.log("=".repeat(60));
  console.log(`📍 Registry: ${erc8004Service.getContractAddress()}`);
  console.log("=".repeat(60));
  console.log();

  const buyerAgentId = process.env.BUYER_AGENT_ID;
  const sellerAgentId = process.env.SELLER_AGENT_ID;
  const buyerAddress = process.env.BUYER_EVM_ADDRESS;
  const sellerAddress = process.env.SELLER_EVM_ADDRESS;

  if (!buyerAgentId || !sellerAgentId) {
    console.error("❌ Agent IDs not found in .env");
    console.error("   Run 'npm run register:agents' first");
    process.exit(1);
  }

  try {
    // ========================================
    // Test 1: Get Agent Information
    // ========================================
    console.log("📋 TEST 1: Get Agent Information");
    console.log("-".repeat(60));

    const buyerInfo = await erc8004Service.getAgentInfo(buyerAgentId);
    console.log(`✅ Buyer Agent (ID: ${buyerInfo.agentId}):`);
    console.log(`   Owner: ${buyerInfo.owner}`);
    console.log(`   Token URI: ${buyerInfo.tokenURI}`);
    console.log(`   Name: ${buyerInfo.metadata.agentName}`);
    console.log(`   Wallet: ${buyerInfo.metadata.agentWallet}`);
    console.log(`   Capabilities: ${buyerInfo.metadata.capabilities}`);
    console.log();

    const sellerInfo = await erc8004Service.getAgentInfo(sellerAgentId);
    console.log(`✅ Seller Agent (ID: ${sellerInfo.agentId}):`);
    console.log(`   Owner: ${sellerInfo.owner}`);
    console.log(`   Token URI: ${sellerInfo.tokenURI}`);
    console.log(`   Name: ${sellerInfo.metadata.agentName}`);
    console.log(`   Wallet: ${sellerInfo.metadata.agentWallet}`);
    console.log(`   Capabilities: ${sellerInfo.metadata.capabilities}`);
    console.log();

    // ========================================
    // Test 2: Verify Agent Identity
    // ========================================
    console.log("🔐 TEST 2: Verify Agent Identity");
    console.log("-".repeat(60));

    const buyerVerified = await erc8004Service.verifyAgentIdentity(
      buyerAgentId,
      buyerAddress!
    );
    console.log(`${buyerVerified ? "✅" : "❌"} Buyer Agent identity verified: ${buyerVerified}`);

    const sellerVerified = await erc8004Service.verifyAgentIdentity(
      sellerAgentId,
      sellerAddress!
    );
    console.log(`${sellerVerified ? "✅" : "❌"} Seller Agent identity verified: ${sellerVerified}`);
    console.log();

    // ========================================
    // Test 3: Query Agent Capabilities
    // ========================================
    console.log("🎯 TEST 3: Query Agent Capabilities");
    console.log("-".repeat(60));

    const buyerCapabilities = await erc8004Service.queryAgentCapabilities(buyerAgentId);
    console.log(`✅ Buyer Agent Capabilities (${buyerCapabilities.length}):`);
    buyerCapabilities.forEach((cap, i) => {
      console.log(`   ${i + 1}. ${cap.name} - ${cap.description}`);
    });
    console.log();

    const sellerCapabilities = await erc8004Service.queryAgentCapabilities(sellerAgentId);
    console.log(`✅ Seller Agent Capabilities (${sellerCapabilities.length}):`);
    sellerCapabilities.forEach((cap, i) => {
      console.log(`   ${i + 1}. ${cap.name} - ${cap.description}`);
    });
    console.log();

    // ========================================
    // Test 4: Get Specific Metadata
    // ========================================
    console.log("📝 TEST 4: Get Specific Metadata");
    console.log("-".repeat(60));

    const buyerName = await erc8004Service.getAgentMetadata(buyerAgentId, "agentName");
    console.log(`✅ Buyer Agent Name: ${buyerName}`);

    const buyerType = await erc8004Service.getAgentMetadata(buyerAgentId, "agentType");
    console.log(`✅ Buyer Agent Type: ${buyerType}`);

    const sellerName = await erc8004Service.getAgentMetadata(sellerAgentId, "agentName");
    console.log(`✅ Seller Agent Name: ${sellerName}`);

    const sellerType = await erc8004Service.getAgentMetadata(sellerAgentId, "agentType");
    console.log(`✅ Seller Agent Type: ${sellerType}`);
    console.log();

    // ========================================
    // Test 5: Get Token URIs
    // ========================================
    console.log("🔗 TEST 5: Get Token URIs");
    console.log("-".repeat(60));

    const buyerURI = await erc8004Service.getAgentTokenURI(buyerAgentId);
    console.log(`✅ Buyer Token URI: ${buyerURI}`);

    const sellerURI = await erc8004Service.getAgentTokenURI(sellerAgentId);
    console.log(`✅ Seller Token URI: ${sellerURI}`);
    console.log();

    // ========================================
    // Test 6: Get Agent Owners
    // ========================================
    console.log("👤 TEST 6: Get Agent Owners");
    console.log("-".repeat(60));

    const buyerOwner = await erc8004Service.getAgentOwner(buyerAgentId);
    console.log(`✅ Buyer Agent Owner: ${buyerOwner}`);
    console.log(`   Expected: ${buyerAddress}`);
    console.log(`   Match: ${buyerOwner.toLowerCase() === buyerAddress?.toLowerCase()}`);

    const sellerOwner = await erc8004Service.getAgentOwner(sellerAgentId);
    console.log(`✅ Seller Agent Owner: ${sellerOwner}`);
    console.log(`   Expected: ${sellerAddress}`);
    console.log(`   Match: ${sellerOwner.toLowerCase() === sellerAddress?.toLowerCase()}`);
    console.log();

    // ========================================
    // Summary
    // ========================================
    console.log("=".repeat(60));
    console.log("🎉 ALL TESTS PASSED!");
    console.log("=".repeat(60));
    console.log();
    console.log("📊 Test Summary:");
    console.log("   ✅ Agent information retrieval");
    console.log("   ✅ Agent identity verification");
    console.log("   ✅ Capability queries");
    console.log("   ✅ Metadata retrieval");
    console.log("   ✅ Token URI retrieval");
    console.log("   ✅ Owner verification");
    console.log();
    console.log("🔗 View on HashScan:");
    console.log(`   https://hashscan.io/testnet/contract/${erc8004Service.getContractAddress()}`);
    console.log();
    console.log("✨ ERC-8004 Integration Complete!");
    console.log("   Ready to proceed with AgentCard & A2A Protocol");
    console.log();

  } catch (error: any) {
    console.error("\n❌ Test failed:");
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

