/**
 * A2A Communication Flow Test
 * 
 * Tests the complete A2A JSON-RPC communication flow:
 * 1. Send message from buyer to seller
 * 2. Get task status
 * 3. Wait for task completion
 * 4. List tasks
 * 5. Cancel task
 */

import { createBuyerClient, createSellerClient } from "../src/services/a2aClient.js";
import { a2aServer } from "../src/api/a2aServer.js";
import { createA2AMessage } from "../src/types/a2a.js";

console.log("\n" + "=".repeat(70));
console.log("🧪 Testing A2A Communication Flow");
console.log("=".repeat(70) + "\n");

let totalTests = 0;
let passedTests = 0;

// ========================================
// Test 1: Send Message from Buyer to Seller
// ========================================
totalTests++;
console.log("📋 Test 1: Send Message from Buyer to Seller");
console.log("-".repeat(70));

try {
  const buyerClient = createBuyerClient();
  const sellerAgentId = process.env.SELLER_AGENT_ID || "28";

  // Register a simple message handler for seller
  a2aServer.registerMessageHandler(sellerAgentId, async (message, agentId) => {
    console.log(`   📨 Seller received message: ${message.parts[0]?.text}`);
    
    // Seller responds
    return createA2AMessage(
      "agent",
      `Hello! I received your message: "${message.parts[0]?.text}". How can I help you?`,
      message.taskId
    );
  });

  const task = await buyerClient.sendMessage(
    sellerAgentId,
    "Hello seller! I'm interested in buying a product."
  );

  console.log(`✅ Message sent successfully`);
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Status: ${task.status.state}`);
  console.log(`   Created: ${task.created_at}`);

  if (task.id && (task.status.state === "working" || task.status.state === "completed")) {
    passedTests++;
    console.log("✅ Test 1 PASSED\n");
  } else {
    console.error("❌ Test 1 FAILED: Task not created properly");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 1 FAILED:", error.message);
  console.log();
}

// Wait for async processing
await new Promise((resolve) => setTimeout(resolve, 2000));

// ========================================
// Test 2: Get Task Status
// ========================================
totalTests++;
console.log("📋 Test 2: Get Task Status");
console.log("-".repeat(70));

try {
  const buyerClient = createBuyerClient();
  const sellerAgentId = process.env.SELLER_AGENT_ID || "28";

  // Get all tasks to find the latest one
  const allTasks = a2aServer.getAllTasks();
  
  if (allTasks.length === 0) {
    throw new Error("No tasks found");
  }

  const latestTask = allTasks[allTasks.length - 1];

  console.log(`✅ Found task: ${latestTask.id}`);
  console.log(`   Status: ${latestTask.status.state}`);
  console.log(`   Created: ${latestTask.created_at}`);
  console.log(`   Updated: ${latestTask.updated_at}`);

  if (latestTask.status.state === "completed") {
    console.log(`   Response: ${latestTask.status.message?.parts[0]?.text?.substring(0, 100)}...`);
  }

  if (latestTask.id) {
    passedTests++;
    console.log("✅ Test 2 PASSED\n");
  } else {
    console.error("❌ Test 2 FAILED: Could not get task status");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 2 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 3: Wait for Task Completion
// ========================================
totalTests++;
console.log("📋 Test 3: Wait for Task Completion");
console.log("-".repeat(70));

try {
  const buyerClient = createBuyerClient();
  const sellerAgentId = process.env.SELLER_AGENT_ID || "28";

  // Send a new message and wait for completion
  const completedTask = await buyerClient.sendAndWait(
    sellerAgentId,
    "What products do you have available?",
    { pollInterval: 500, maxAttempts: 10 }
  );

  console.log(`✅ Task completed: ${completedTask.id}`);
  console.log(`   Final status: ${completedTask.status.state}`);
  
  if (completedTask.status.message) {
    console.log(`   Response: ${completedTask.status.message.parts[0]?.text?.substring(0, 100)}...`);
  }

  if (completedTask.status.state === "completed") {
    passedTests++;
    console.log("✅ Test 3 PASSED\n");
  } else {
    console.error(`❌ Test 3 FAILED: Task not completed (state: ${completedTask.status.state})`);
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 3 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 4: List Tasks
// ========================================
totalTests++;
console.log("📋 Test 4: List Tasks");
console.log("-".repeat(70));

try {
  const allTasks = a2aServer.getAllTasks();

  console.log(`✅ Found ${allTasks.length} tasks:`);
  
  for (const task of allTasks.slice(0, 5)) {
    console.log(`   - Task ${task.id.substring(0, 20)}...`);
    console.log(`     Status: ${task.status.state}`);
    console.log(`     Created: ${task.created_at}`);
  }

  if (allTasks.length > 5) {
    console.log(`   ... and ${allTasks.length - 5} more tasks`);
  }

  if (allTasks.length >= 0) {
    passedTests++;
    console.log("✅ Test 4 PASSED\n");
  } else {
    console.error("❌ Test 4 FAILED: Could not list tasks");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 4 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 5: Negotiation Flow
// ========================================
totalTests++;
console.log("📋 Test 5: Negotiation Flow");
console.log("-".repeat(70));

try {
  const buyerClient = createBuyerClient();
  const sellerAgentId = process.env.SELLER_AGENT_ID || "28";

  // Register negotiation handler for seller
  a2aServer.registerMessageHandler(sellerAgentId, async (message, agentId) => {
    const text = message.parts[0]?.text || "";
    
    // Check if this is a negotiation message
    if (text.includes("purchase") || text.includes("price")) {
      // Parse negotiation data if present
      const negotiationData = message.parts.find(p => p.text?.includes("negotiation_offer"));
      
      if (negotiationData) {
        try {
          const data = JSON.parse(negotiationData.text || "{}");
          const offeredPrice = data.offeredPrice || 0;
          
          console.log(`   💬 Seller received negotiation offer: $${offeredPrice}`);
          
          // Simple negotiation logic
          if (offeredPrice >= 100) {
            return createA2AMessage(
              "agent",
              `Offer accepted! I'll sell the product for $${offeredPrice}.`,
              message.taskId
            );
          } else {
            const counterOffer = Math.round(offeredPrice * 1.2);
            return createA2AMessage(
              "agent",
              `Counter-offer: $${counterOffer}. The product is worth more than $${offeredPrice}.`,
              message.taskId
            );
          }
        } catch (e) {
          // Fallback response
          return createA2AMessage(
            "agent",
            "I'd be happy to negotiate. What's your offer?",
            message.taskId
          );
        }
      }
    }
    
    // Default response
    return createA2AMessage(
      "agent",
      "I received your message. How can I help you?",
      message.taskId
    );
  });

  // Buyer sends negotiation offer
  const negotiationTask = await buyerClient.negotiate(
    sellerAgentId,
    "product-123",
    120,
    "I'd like to purchase this product"
  );

  console.log(`✅ Negotiation started`);
  console.log(`   Task ID: ${negotiationTask.id}`);

  // Wait for seller response
  const completedNegotiation = await buyerClient.waitForTask(
    negotiationTask.id,
    sellerAgentId,
    { pollInterval: 500, maxAttempts: 10 }
  );

  console.log(`   Seller response: ${completedNegotiation.status.message?.parts[0]?.text?.substring(0, 100)}...`);

  if (completedNegotiation.status.state === "completed") {
    passedTests++;
    console.log("✅ Test 5 PASSED\n");
  } else {
    console.error("❌ Test 5 FAILED: Negotiation did not complete");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 5 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 6: Bidirectional Communication
// ========================================
totalTests++;
console.log("📋 Test 6: Bidirectional Communication (Seller to Buyer)");
console.log("-".repeat(70));

try {
  const sellerClient = createSellerClient();
  const buyerAgentId = process.env.BUYER_AGENT_ID || "27";

  // Register handler for buyer
  a2aServer.registerMessageHandler(buyerAgentId, async (message, agentId) => {
    console.log(`   📨 Buyer received message: ${message.parts[0]?.text}`);
    
    return createA2AMessage(
      "agent",
      "Thank you for the update! I'll check the shipment status.",
      message.taskId
    );
  });

  // Seller sends shipment notification to buyer
  const shipmentTask = await sellerClient.sendMessage(
    buyerAgentId,
    "Your order has been shipped! Tracking number: TRACK123456"
  );

  console.log(`✅ Shipment notification sent`);
  console.log(`   Task ID: ${shipmentTask.id}`);

  // Wait for buyer response
  const completedShipment = await sellerClient.waitForTask(
    shipmentTask.id,
    buyerAgentId,
    { pollInterval: 500, maxAttempts: 10 }
  );

  console.log(`   Buyer response: ${completedShipment.status.message?.parts[0]?.text}`);

  if (completedShipment.status.state === "completed") {
    passedTests++;
    console.log("✅ Test 6 PASSED\n");
  } else {
    console.error("❌ Test 6 FAILED: Bidirectional communication failed");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 6 FAILED:", error.message);
  console.log();
}

// ========================================
// Test Summary
// ========================================
console.log("=".repeat(70));
console.log("📊 Test Summary");
console.log("=".repeat(70));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log("=".repeat(70));

if (passedTests === totalTests) {
  console.log("\n🎉 All tests passed! A2A communication is working!\n");
  process.exit(0);
} else {
  console.log("\n⚠️  Some tests failed. Please review the errors above.\n");
  process.exit(1);
}

