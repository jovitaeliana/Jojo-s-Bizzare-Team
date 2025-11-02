/**
 * Test AgentCard & Discovery Integration
 * 
 * Tests the complete flow:
 * 1. Fetch AgentCards from HTTP endpoints
 * 2. Discover agents via ERC-8004
 * 3. Match on-chain data with off-chain AgentCards
 * 4. Query by capabilities and skills
 */

import { discoveryService } from "../src/services/discovery.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAgentCardDiscovery() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 Testing AgentCard & Discovery Integration");
  console.log("=".repeat(70) + "\n");

  let passedTests = 0;
  let totalTests = 0;

  // ========================================
  // Test 1: Load Local AgentCards
  // ========================================
  totalTests++;
  console.log("📋 Test 1: Load Local AgentCards");
  console.log("-".repeat(70));

  try {
    const buyerCardPath = path.join(__dirname, "../public/agents/buyer/card.json");
    const sellerCardPath = path.join(__dirname, "../public/agents/seller/card.json");

    const buyerCard = JSON.parse(fs.readFileSync(buyerCardPath, "utf-8"));
    const sellerCard = JSON.parse(fs.readFileSync(sellerCardPath, "utf-8"));

    console.log(`✅ Loaded buyer card: ${buyerCard.name}`);
    console.log(`   - Skills: ${buyerCard.skills.length}`);
    console.log(`   - Protocol: ${buyerCard.protocolVersion}`);
    
    console.log(`✅ Loaded seller card: ${sellerCard.name}`);
    console.log(`   - Skills: ${sellerCard.skills.length}`);
    console.log(`   - Protocol: ${sellerCard.protocolVersion}`);

    // Register local cards
    const buyerAgentId = process.env.BUYER_AGENT_ID || "18";
    const sellerAgentId = process.env.SELLER_AGENT_ID || "19";

    discoveryService.registerLocalAgentCard(buyerAgentId, buyerCard);
    discoveryService.registerLocalAgentCard(sellerAgentId, sellerCard);

    passedTests++;
    console.log("✅ Test 1 PASSED\n");
  } catch (error: any) {
    console.error("❌ Test 1 FAILED:", error.message);
    console.log();
  }

  // ========================================
  // Test 2: Get Our Registered Agents
  // ========================================
  totalTests++;
  console.log("📋 Test 2: Get Our Registered Agents");
  console.log("-".repeat(70));

  try {
    const ourAgents = await discoveryService.getOurAgents();

    if (ourAgents.buyer) {
      console.log(`✅ Buyer Agent (ID: ${ourAgents.buyer.agentId})`);
      console.log(`   - Owner: ${ourAgents.buyer.owner}`);
      console.log(`   - Capabilities: ${ourAgents.buyer.capabilities.length}`);
      console.log(`   - AgentCard: ${ourAgents.buyer.agentCard?.name || "Not loaded"}`);
      console.log(`   - Card URL: ${ourAgents.buyer.cardUrl || "N/A"}`);
    }

    if (ourAgents.seller) {
      console.log(`✅ Seller Agent (ID: ${ourAgents.seller.agentId})`);
      console.log(`   - Owner: ${ourAgents.seller.owner}`);
      console.log(`   - Capabilities: ${ourAgents.seller.capabilities.length}`);
      console.log(`   - AgentCard: ${ourAgents.seller.agentCard?.name || "Not loaded"}`);
      console.log(`   - Card URL: ${ourAgents.seller.cardUrl || "N/A"}`);
    }

    if (ourAgents.buyer && ourAgents.seller) {
      passedTests++;
      console.log("✅ Test 2 PASSED\n");
    } else {
      console.error("❌ Test 2 FAILED: Missing buyer or seller agent");
      console.log();
    }
  } catch (error: any) {
    console.error("❌ Test 2 FAILED:", error.message);
    console.log();
  }

  // ========================================
  // Test 3: Fetch AgentCard by ID
  // ========================================
  totalTests++;
  console.log("📋 Test 3: Fetch AgentCard by ID");
  console.log("-".repeat(70));

  try {
    const buyerAgentId = process.env.BUYER_AGENT_ID || "27";
    const buyerCard = await discoveryService.getAgentCard(buyerAgentId);

    if (buyerCard) {
      console.log(`✅ Fetched AgentCard for agent ${buyerAgentId}`);
      console.log(`   - Name: ${buyerCard.name}`);
      console.log(`   - Protocol: ${buyerCard.protocolVersion}`);
      console.log(`   - Skills: ${buyerCard.skills.length}`);
      console.log(`   - URL: ${buyerCard.url}`);

      passedTests++;
      console.log("✅ Test 3 PASSED\n");
    } else {
      console.error("❌ Test 3 FAILED: Failed to fetch AgentCard");
      console.log();
    }
  } catch (error: any) {
    console.error("❌ Test 3 FAILED:", error.message);
    console.log();
  }

  // ========================================
  // Test 4: Verify AgentCard Skills
  // ========================================
  totalTests++;
  console.log("📋 Test 4: Verify AgentCard Skills");
  console.log("-".repeat(70));

  try {
    const buyerAgentId = process.env.BUYER_AGENT_ID || "27";
    const buyerCard = await discoveryService.getAgentCard(buyerAgentId);

    if (buyerCard && buyerCard.skills.length > 0) {
      console.log(`✅ Buyer agent has ${buyerCard.skills.length} skills:`);

      for (const skill of buyerCard.skills) {
        console.log(`   - ${skill.id}: ${skill.name}`);
      }

      // Check for specific skills
      const hasNegotiate = buyerCard.skills.some(s => s.id === "negotiate-price");
      const hasPurchase = buyerCard.skills.some(s => s.id === "create-purchase");

      if (hasNegotiate && hasPurchase) {
        passedTests++;
        console.log("✅ Test 4 PASSED\n");
      } else {
        console.error("❌ Test 4 FAILED: Missing expected skills");
        console.log();
      }
    } else {
      console.error("❌ Test 4 FAILED: No skills found");
      console.log();
    }
  } catch (error: any) {
    console.error("❌ Test 4 FAILED:", error.message);
    console.log();
  }

  // ========================================
  // Test 5: Verify Seller AgentCard
  // ========================================
  totalTests++;
  console.log("📋 Test 5: Verify Seller AgentCard");
  console.log("-".repeat(70));

  try {
    const sellerAgentId = process.env.SELLER_AGENT_ID || "28";
    const sellerCard = await discoveryService.getAgentCard(sellerAgentId);

    if (sellerCard && sellerCard.skills.length > 0) {
      console.log(`✅ Seller agent has ${sellerCard.skills.length} skills:`);

      for (const skill of sellerCard.skills) {
        console.log(`   - ${skill.id}: ${skill.name}`);
      }

      // Check for specific skills
      const hasNegotiate = sellerCard.skills.some(s => s.id === "negotiate-price");
      const hasPayment = sellerCard.skills.some(s => s.id === "accept-payment");

      if (hasNegotiate && hasPayment) {
        passedTests++;
        console.log("✅ Test 5 PASSED\n");
      } else {
        console.error("❌ Test 5 FAILED: Missing expected skills");
        console.log();
      }
    } else {
      console.error("❌ Test 5 FAILED: No skills found");
      console.log();
    }
  } catch (error: any) {
    console.error("❌ Test 5 FAILED:", error.message);
    console.log();
  }

  // ========================================
  // Test 6: Verify Agent Identity
  // ========================================
  totalTests++;
  console.log("📋 Test 6: Verify Agent Identity");
  console.log("-".repeat(70));

  try {
    const buyerAgentId = process.env.BUYER_AGENT_ID || "27";
    const buyerAddress = process.env.BUYER_EVM_ADDRESS || process.env.BUYER_ADDRESS || "";

    if (!buyerAddress) {
      console.log("⚠️  BUYER_EVM_ADDRESS not set in .env, skipping verification");
      console.log("✅ Test 6 SKIPPED\n");
      passedTests++; // Don't fail the test if env var is missing
    } else {
      const isValid = await discoveryService.verifyAgent(buyerAgentId, buyerAddress);

      console.log(`✅ Buyer agent ${buyerAgentId} identity verification: ${isValid ? "VALID" : "INVALID"}`);
      console.log(`   Expected owner: ${buyerAddress}`);
      console.log(`   Actual owner: (fetched from blockchain)`);

      if (isValid) {
        passedTests++;
        console.log("✅ Test 6 PASSED\n");
      } else {
        console.error("❌ Test 6 FAILED: Agent identity verification failed");
        console.log();
      }
    }
  } catch (error: any) {
    console.error("❌ Test 6 FAILED:", error.message);
    console.log();
  }

  // ========================================
  // Summary
  // ========================================
  console.log("=".repeat(70));
  console.log("📊 Test Summary");
  console.log("=".repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log("=".repeat(70) + "\n");

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! AgentCard & Discovery integration is working!\n");
  } else {
    console.log("⚠️  Some tests failed. Please review the errors above.\n");
    process.exit(1);
  }
}

// Run tests
testAgentCardDiscovery().catch(error => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});

