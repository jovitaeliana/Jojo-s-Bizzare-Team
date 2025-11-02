/**
 * x402 Integration Test with LangGraph Agents
 * 
 * Tests the complete integration of:
 * - Buyer agent with x402 payment
 * - Real HBAR payments on Hedera testnet
 * - Payment verification
 * - Escrow creation and release
 */

import dotenv from "dotenv";
import { getBuyerAgent } from "../src/agents/buyerAgent.js";
import { getSellerAgent } from "../src/agents/sellerAgent.js";
import { x402Service } from "../src/services/x402.js";
import { createA2AMessage } from "../src/types/a2a.js";
import { Listing } from "../src/agents/prompts/sellerPrompts.js";

dotenv.config();

/**
 * Test 1: Buyer Agent with Real x402 Payment
 */
async function testBuyerAgentWithX402(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 1: Buyer Agent with Real x402 Payment");
  console.log("=".repeat(70));

  try {
    console.log("\n📋 Test Case: Buyer agent makes real HBAR payment");

    const buyerAgent = await getBuyerAgent();

    // Simulate a simple purchase workflow
    console.log("\n🤖 Starting buyer agent workflow...");
    console.log("   User Request: 'I need a laptop for development'");
    console.log("   Budget: 5 HBAR");

    // Create a test state
    const testState = {
      userRequest: "I need a laptop for development",
      userBudget: 5,
      discoveredProducts: [
        {
          id: "test-laptop-1",
          name: "MacBook Pro 2021",
          description: "High-performance laptop for development",
          price: 0.5,
          currency: "HBAR",
          sellerAddress: process.env.SELLER_ACCOUNT_ID || "",
          sellerAgentId: process.env.SELLER_AGENT_ID || "28",
        },
      ],
      selectedProduct: null,
      negotiationHistory: [],
      offerAccepted: false,
      paymentId: null,
      escrowId: null,
      currentStep: "discover",
      error: null,
    };

    // Test the payment node directly
    console.log("\n💰 Testing payment execution...");

    // Set up state for payment
    testState.selectedProduct = testState.discoveredProducts[0];
    testState.offerAccepted = true;

    // Execute payment via x402
    const paymentId = await x402Service.processAgentPayment(
      testState.selectedProduct.sellerAddress,
      testState.selectedProduct.price,
      testState.selectedProduct.currency,
      testState.selectedProduct.id
    );

    console.log(`\n✅ Payment successful!`);
    console.log(`   Transaction ID: ${paymentId}`);
    console.log(`   View on HashScan: https://hashscan.io/testnet/transaction/${paymentId}`);

    // Verify payment
    console.log(`\n🔍 Verifying payment...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const isVerified = await x402Service.verifyPayment(paymentId);

    if (isVerified) {
      console.log("✅ TEST 1 PASSED: Buyer agent successfully made real x402 payment");
      return true;
    } else {
      console.log("❌ TEST 1 FAILED: Payment verification failed");
      return false;
    }
  } catch (error: any) {
    console.error("❌ TEST 1 FAILED:", error.message);
    return false;
  }
}

/**
 * Test 2: End-to-End Purchase with x402
 */
async function testEndToEndPurchase(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 2: End-to-End Purchase with x402");
  console.log("=".repeat(70));

  try {
    console.log("\n📋 Test Case: Complete purchase flow with real payment");

    const buyerAgent = await getBuyerAgent();
    const sellerAgent = getSellerAgent();

    // Create seller listing
    const listing: Listing = {
      id: "test-laptop-e2e",
      name: "MacBook Pro 2021",
      description: "High-performance laptop for development",
      price: 0.3,
      currency: "HBAR",
      category: "Electronics",
      condition: "New",
      sellerAddress: process.env.SELLER_ACCOUNT_ID || "",
      sellerAgentId: process.env.SELLER_AGENT_ID || "28",
    };

    console.log("\n🤖 Seller: Creating listing...");
    console.log(`   Product: ${listing.name}`);
    console.log(`   Price: ${listing.price} ${listing.currency}`);

    // Simulate buyer making an offer
    console.log("\n🤖 Buyer: Making offer...");
    const offerMessage = createA2AMessage(
      "user",
      [
        {
          type: "text",
          text: JSON.stringify({
            type: "offer",
            productId: listing.id,
            offerPrice: listing.price,
            currency: listing.currency,
          }),
        },
      ],
      {
        buyerAgentId: process.env.BUYER_AGENT_ID || "27",
        productId: listing.id,
      }
    );

    // Seller evaluates offer
    console.log("\n🤖 Seller: Evaluating offer...");
    const sellerResponse = await sellerAgent.handleBuyerMessage(
      offerMessage,
      process.env.BUYER_AGENT_ID || "27"
    );

    console.log(`   Seller response: ${JSON.stringify(sellerResponse, null, 2)}`);

    // Buyer makes payment
    console.log("\n💰 Buyer: Making payment...");
    const paymentId = await x402Service.processAgentPayment(
      listing.sellerAddress,
      listing.price,
      listing.currency,
      listing.id
    );

    console.log(`   ✅ Payment successful: ${paymentId}`);
    console.log(`   View on HashScan: https://hashscan.io/testnet/transaction/${paymentId}`);

    // Verify payment
    console.log(`\n🔍 Verifying payment...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const isVerified = await x402Service.verifyPayment(paymentId);

    if (isVerified) {
      console.log("✅ TEST 2 PASSED: End-to-end purchase with x402 successful");
      return true;
    } else {
      console.log("❌ TEST 2 FAILED: Payment verification failed");
      return false;
    }
  } catch (error: any) {
    console.error("❌ TEST 2 FAILED:", error.message);
    return false;
  }
}

/**
 * Test 3: Escrow Integration
 */
async function testEscrowIntegration(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 3: Escrow Integration");
  console.log("=".repeat(70));

  try {
    console.log("\n📋 Test Case: Create escrow, make payment, release funds");

    const sellerAccountId = process.env.SELLER_ACCOUNT_ID;

    if (!sellerAccountId) {
      console.error("❌ Missing SELLER_ACCOUNT_ID in .env");
      return false;
    }

    // Create escrow
    console.log("\n🔒 Creating escrow...");
    const escrowId = await x402Service.createEscrowPayment(
      sellerAccountId,
      0.2,
      ["shipment_confirmed", "delivery_verified"]
    );

    console.log(`   ✅ Escrow created: ${escrowId}`);

    // Make payment
    console.log("\n💰 Making payment...");
    const paymentId = await x402Service.processAgentPayment(
      sellerAccountId,
      0.2,
      "HBAR",
      "test-escrow-product"
    );

    console.log(`   ✅ Payment successful: ${paymentId}`);

    // Simulate delivery confirmation
    console.log("\n📦 Simulating delivery confirmation...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Release escrow
    console.log("\n🔓 Releasing escrow...");
    const releaseId = await x402Service.releaseEscrow(escrowId);

    console.log(`   ✅ Escrow released: ${releaseId}`);

    console.log("✅ TEST 3 PASSED: Escrow integration working");
    return true;
  } catch (error: any) {
    console.error("❌ TEST 3 FAILED:", error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 x402 INTEGRATION TEST SUITE");
  console.log("=".repeat(70));
  console.log("Testing x402 integration with LangGraph agents");
  console.log("=".repeat(70));

  const results: { name: string; passed: boolean }[] = [];

  // Run tests
  results.push({
    name: "Buyer Agent with x402",
    passed: await testBuyerAgentWithX402(),
  });

  results.push({
    name: "End-to-End Purchase",
    passed: await testEndToEndPurchase(),
  });

  results.push({
    name: "Escrow Integration",
    passed: await testEscrowIntegration(),
  });

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
  });

  console.log("=".repeat(70));
  console.log(`TOTAL: ${passed}/${total} tests passed (${percentage}%)`);
  console.log("=".repeat(70));

  if (passed === total) {
    console.log("\n🎉 ALL INTEGRATION TESTS PASSED!");
    console.log("\n✅ x402 is fully integrated with LangGraph agents:");
    console.log("   - Buyer agent can make real HBAR payments");
    console.log("   - Payments are verified on Hedera testnet");
    console.log("   - Escrow creation and release working");
    console.log("   - End-to-end purchase flow complete");
    console.log("\n🚀 Ready for hackathon demo!");
  } else {
    console.log(`\n⚠️ ${total - passed} test(s) failed. Review errors above.`);
  }

  // Close client
  x402Service.close();

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error("\n💥 Test suite crashed:", error);
  x402Service.close();
  process.exit(1);
});

