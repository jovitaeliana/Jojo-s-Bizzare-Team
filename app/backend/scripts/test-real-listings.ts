/**
 * Test Real Listing Discovery
 * Verifies that buyer agent can query real listings from seller agents via A2A
 */

import { BuyerAgent } from '../src/agents/buyerAgent.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRealListingDiscovery() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST: Real Listing Discovery via A2A");
  console.log("=".repeat(70));

  try {
    // Create buyer agent
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not found in environment variables");
    }

    const buyerAgent = new BuyerAgent("27", apiKey);

    console.log("\n📋 Test Case: Discover products from seller agents");
    console.log("   Expected: Query seller agents via A2A and receive real listings");
    console.log("   No hardcoded data should be used\n");

    // Run buyer agent workflow
    const result = await buyerAgent.executePurchase(
      "I need a laptop for software development",
      2000
    );

    console.log("\n" + "=".repeat(70));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(70));

    if (result.selectedProduct) {
      console.log("✅ TEST PASSED: Real listing discovery works!");
      console.log("\n📦 Selected Product:");
      console.log(`   Title: ${result.selectedProduct.title}`);
      console.log(`   Price: ${result.selectedProduct.price} ${result.selectedProduct.currency}`);
      console.log(`   Seller Agent: ${result.selectedProduct.sellerAgentId}`);
      console.log(`   Seller Address: ${result.selectedProduct.sellerAddress}`);
    } else {
      console.log("❌ TEST FAILED: No product selected");
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }

    console.log("\n" + "=".repeat(70));

  } catch (error: any) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testRealListingDiscovery()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

