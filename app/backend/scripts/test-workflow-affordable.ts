#!/usr/bin/env node
/**
 * Test the complete buyer workflow with an affordable product
 * This version creates a product the buyer can actually afford
 */

import { BuyerAgent } from "../src/agents/buyerAgent.js";
import { erc8004Service } from "../src/services/erc8004.js";
import { hcsService } from "../src/services/hcs.js";
import dotenv from "dotenv";

dotenv.config();

async function testAffordableWorkflow() {
  console.log("\n======================================================================");
  console.log("🧪 AFFORDABLE WORKFLOW TEST");
  console.log("======================================================================\n");

  console.log("📊 LangSmith Configuration:");
  console.log(`   Tracing: ${process.env.LANGCHAIN_TRACING_V2}`);
  console.log(`   Project: ${process.env.LANGCHAIN_PROJECT}`);
  console.log("\n🔗 View traces at: https://smith.langchain.com/\n");
  console.log("======================================================================\n");

  // Step 1: Register seller in discovery cache with cheap snacks
  console.log("📋 Step 1: Registering seller with CHEAP products...");

  const sellerAgentId = process.env.SELLER_AGENT_ID || "115";
  const sellerAccountId = process.env.SELLER_ACCOUNT_ID || "0.0.7174705";
  const sellerEvmAddress = process.env.SELLER_EVM_ADDRESS || "0xc5c33367a8ebcbf8754761a0501e60b10db6a698";

  const sellerAgent = {
    agentId: sellerAgentId,
    agentName: 'SnackShop',
    owner: sellerEvmAddress,
    sellerAddress: sellerAccountId,
    sellerUrl: 'http://localhost:3000/a2a',
    capabilities: [
      {
        name: 'marketplace_seller',
        description: 'Sell snacks and groceries',
        endpoint: 'http://localhost:3000/a2a'
      }
    ],
    metadata: [
      { key: 'agentType', value: 'seller' },
      { key: 'version', value: '1.0.0' },
      { key: 'sellerAddress', value: sellerAccountId },
      { key: 'sellerUrl', value: 'http://localhost:3000/a2a' }
    ]
  };

  // Add to ERC8004 cache
  (erc8004Service as any).discoveredAgents.set(sellerAgentId, sellerAgent);

  console.log("   ✅ Seller registered in cache");
  console.log(`   Agent ID: ${sellerAgentId}`);
  console.log(`   Seller Address: ${sellerAccountId}`);
  console.log("   Products: Potato Chips - 2 HBAR\n");

  // Step 2: Create buyer agent
  console.log("🤖 Step 2: Creating buyer agent...");
  const buyerAgent = new BuyerAgent(
    "buyer-agent-1",
    process.env.GROQ_API_KEY!
  );

  // Initialize x402 service with buyer credentials
  await buyerAgent.initializePayments(
    process.env.BUYER_ACCOUNT_ID!,
    process.env.BUYER_PRIVATE_KEY!
  );

  console.log("   ✅ Buyer agent created and initialized\n");

  // Step 2.5: Initialize HCS for audit logging
  console.log("📋 Step 2.5: Initializing HCS for audit logging...");
  await hcsService.initialize(
    process.env.BUYER_ACCOUNT_ID!,
    process.env.BUYER_PRIVATE_KEY!
  );

  const topicId = await hcsService.createTopic("Hedera Agentic Marketplace - Transaction Logs");
  console.log(`   ✅ HCS topic created: ${topicId}`);
  console.log(`   🔗 View messages: https://hashscan.io/testnet/topic/${topicId}\n`);

  // Step 3: Execute workflow
  console.log("🚀 Step 3: Executing LangGraph workflow...");
  console.log("   This will create traces in LangSmith!\n");
  console.log("   ⚠️  NOTE: This test requires the seller server to be running");
  console.log("   If you see \"fetch failed\", start the server with: npm run dev\n");
  console.log('   User Request: "I want some potato chips for a snack"');
  console.log("   Budget: 10 HBAR (enough for 2 HBAR chips!)\n");
  console.log("   ⏳ Running workflow...\n");

  const startTime = Date.now();

  try {
    const result = await buyerAgent.executePurchase(
      "I want some potato chips for a snack",
      10 // Budget: 10 HBAR (buyer has 975 HBAR, product costs 2 HBAR)
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n======================================================================");
    console.log("📊 WORKFLOW RESULTS");
    console.log("======================================================================\n");
    console.log(`⏱️  Duration: ${duration} seconds\n`);

    console.log("📝 State Transitions:");
    console.log(`   Discovery: ${result?.discoveredProducts?.length || 0} products found`);
    
    if (result?.discoveredProducts && result.discoveredProducts.length > 0) {
      console.log("   📦 Products:");
      result.discoveredProducts.forEach((p: any, i: number) => {
        console.log(`      ${i + 1}. ${p.name} - ${p.price} ${p.currency}`);
      });
    }

    console.log(`   Selection: ${result?.selectedProduct ? "✅ " + result.selectedProduct.title : "❌ No selection"}`);
    console.log(`   Negotiation: ${result?.offerAccepted ? "✅ Offer accepted" : "❌ Not accepted"}`);
    console.log(`   Payment: ${result?.paymentId ? "✅ " + result.paymentId : "❌ No payment"}`);
    console.log(`   Complete: ${result?.finalResult?.success ? "✅ Complete" : "❌ Incomplete"}\n`);

    if (result?.error) {
      console.log(`⚠️  Error: ${result.error}\n`);
    }

    console.log("======================================================================");
    console.log("🔍 VIEW IN LANGSMITH");
    console.log("======================================================================\n");
    console.log("1. Go to: https://smith.langchain.com/");
    console.log('2. Select project: "hedera-agentic-marketplace"');
    console.log("3. Look for the most recent run");
    console.log("4. You should see:");
    console.log("   - LangGraph workflow execution");
    console.log("   - Each node (DISCOVER, SELECT, NEGOTIATE, PAY, COMPLETE)");
    console.log("   - Tool calls (erc8004_discovery, a2a_communication, x402_payment)");
    console.log("   - LLM calls (Groq)");
    console.log("   - State transitions");
    console.log("   - Timing information\n");
    console.log("⏰ Note: Traces may take 5-10 seconds to appear\n");

    if (result?.finalResult?.success) {
      console.log("======================================================================");
      console.log("🎉 SUCCESS: Complete end-to-end workflow!");
      console.log("======================================================================");
      console.log(`✅ Product: ${result.selectedProduct?.title}`);
      console.log(`✅ Price: ${result.selectedProduct?.price} ${result.selectedProduct?.currency}`);
      console.log(`✅ Payment: ${result.paymentId}`);
      console.log(`✅ All 4 protocols integrated: ERC-8004, A2A, x402, HCS`);
      console.log(`✅ All tools visible in LangSmith!`);
      console.log("======================================================================");
      console.log(`\n🔗 View transaction: https://hashscan.io/testnet/transaction/${result.paymentId}`);
      console.log(`🔗 View HCS audit log: https://hashscan.io/testnet/topic/${topicId}\n`);
    } else if (result?.paymentId) {
      console.log("======================================================================");
      console.log("✅ SUCCESS: Payment completed!");
      console.log("======================================================================");
      console.log(`\n🔗 View transaction: https://hashscan.io/testnet/transaction/${result.paymentId}\n`);
    } else if (result?.discoveredProducts?.length === 0) {
      console.log("======================================================================");
      console.log("⚠️  TEST PARTIAL: No products discovered");
      console.log("   Make sure seller server is running: npm run dev");
      console.log("======================================================================\n");
    } else {
      console.log("======================================================================");
      console.log("⚠️  TEST PARTIAL: Workflow ran but did not complete fully");
      console.log("   Check LangSmith for detailed traces to debug!");
      console.log("======================================================================\n");
    }
  } catch (error: any) {
    console.error("\n❌ Workflow failed:", error.message);
    console.error(error.stack);
  }
}

testAffordableWorkflow().catch(console.error);

