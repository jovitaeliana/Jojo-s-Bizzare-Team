/**
 * x402 Payment Protocol Test Suite
 * 
 * Tests real x402 payment implementation with:
 * - HBAR native payments
 * - USDC token payments
 * - Payment verification via Mirror Node
 * - Escrow creation and release
 */

import dotenv from "dotenv";
import { x402Service } from "../src/services/x402.js";

dotenv.config();

// Test configuration
const TESTS = {
  INITIALIZATION: true,
  HBAR_PAYMENT: true,
  USDC_PAYMENT: false, // Requires USDC association
  PAYMENT_VERIFICATION: true,
  ESCROW: true,
  BALANCE_CHECK: true,
};

/**
 * Test 1: Initialize x402 Service
 */
async function testInitialization(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 1: Initialize x402 Service");
  console.log("=".repeat(70));

  try {
    const accountId = process.env.BUYER_ACCOUNT_ID;
    const privateKey = process.env.BUYER_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      console.error("❌ Missing BUYER_ACCOUNT_ID or BUYER_PRIVATE_KEY in .env");
      return false;
    }

    console.log(`\n📋 Test Case: Initialize with account ${accountId}`);

    await x402Service.initialize(accountId, privateKey);

    console.log("✅ TEST 1 PASSED: x402 service initialized successfully");
    return true;
  } catch (error: any) {
    console.error("❌ TEST 1 FAILED:", error.message);
    return false;
  }
}

/**
 * Test 2: HBAR Payment
 */
async function testHBARPayment(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 2: HBAR Payment");
  console.log("=".repeat(70));

  try {
    const recipientId = process.env.SELLER_ACCOUNT_ID;

    if (!recipientId) {
      console.error("❌ Missing SELLER_ACCOUNT_ID in .env");
      return false;
    }

    console.log(`\n📋 Test Case: Pay 0.5 HBAR to ${recipientId}`);

    const transactionId = await x402Service.processAgentPayment(
      recipientId,
      0.5,
      "HBAR",
      "test-product-1"
    );

    console.log(`\n✅ Payment successful!`);
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   View on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);

    console.log("✅ TEST 2 PASSED: HBAR payment completed");
    return true;
  } catch (error: any) {
    console.error("❌ TEST 2 FAILED:", error.message);
    return false;
  }
}

/**
 * Test 3: USDC Payment
 */
async function testUSDCPayment(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 3: USDC Payment");
  console.log("=".repeat(70));

  try {
    const recipientId = process.env.SELLER_ACCOUNT_ID;

    if (!recipientId) {
      console.error("❌ Missing SELLER_ACCOUNT_ID in .env");
      return false;
    }

    console.log(`\n📋 Test Case: Pay 0.001 USDC to ${recipientId}`);
    console.log(`   Note: Both accounts must be associated with USDC token 0.0.429274`);

    const transactionId = await x402Service.processAgentPayment(
      recipientId,
      0.001,
      "USDC",
      "test-product-2"
    );

    console.log(`\n✅ Payment successful!`);
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   View on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);

    console.log("✅ TEST 3 PASSED: USDC payment completed");
    return true;
  } catch (error: any) {
    console.error("❌ TEST 3 FAILED:", error.message);
    console.error("   Make sure both accounts are associated with USDC token 0.0.429274");
    return false;
  }
}

/**
 * Test 4: Payment Verification
 */
async function testPaymentVerification(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 4: Payment Verification");
  console.log("=".repeat(70));

  try {
    const recipientId = process.env.SELLER_ACCOUNT_ID;

    if (!recipientId) {
      console.error("❌ Missing SELLER_ACCOUNT_ID in .env");
      return false;
    }

    console.log(`\n📋 Test Case: Pay and verify 0.1 HBAR payment`);

    // Make payment
    const transactionId = await x402Service.processAgentPayment(
      recipientId,
      0.1,
      "HBAR",
      "test-verification"
    );

    console.log(`\n⏳ Waiting 5 seconds for transaction to finalize...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify payment
    const isVerified = await x402Service.verifyPayment(transactionId);

    if (isVerified) {
      console.log("✅ TEST 4 PASSED: Payment verified successfully");
      return true;
    } else {
      console.log("❌ TEST 4 FAILED: Payment verification failed");
      return false;
    }
  } catch (error: any) {
    console.error("❌ TEST 4 FAILED:", error.message);
    return false;
  }
}

/**
 * Test 5: Escrow Creation
 */
async function testEscrow(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 5: Escrow Creation");
  console.log("=".repeat(70));

  try {
    const recipientId = process.env.SELLER_ACCOUNT_ID;

    if (!recipientId) {
      console.error("❌ Missing SELLER_ACCOUNT_ID in .env");
      return false;
    }

    console.log(`\n📋 Test Case: Create escrow for 1.0 HBAR`);

    const escrowId = await x402Service.createEscrowPayment(
      recipientId,
      1.0,
      ["shipment_confirmed", "delivery_verified"]
    );

    console.log(`\n✅ Escrow created: ${escrowId}`);

    // Test escrow release
    console.log(`\n📋 Test Case: Release escrow`);
    const releaseId = await x402Service.releaseEscrow(escrowId);

    console.log(`   ✅ Escrow released: ${releaseId}`);

    console.log("✅ TEST 5 PASSED: Escrow creation and release working");
    return true;
  } catch (error: any) {
    console.error("❌ TEST 5 FAILED:", error.message);
    return false;
  }
}

/**
 * Test 6: Balance Check
 */
async function testBalanceCheck(): Promise<boolean> {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 6: Balance Check");
  console.log("=".repeat(70));

  try {
    console.log(`\n📋 Test Case: Get account balance`);

    const balance = await x402Service.getAccountBalance();

    console.log(`\n💰 Account Balance:`);
    console.log(`   HBAR: ${balance.hbar.toFixed(4)}`);
    console.log(`   USDC: ${balance.usdc.toFixed(6)}`);

    console.log("✅ TEST 6 PASSED: Balance check working");
    return true;
  } catch (error: any) {
    console.error("❌ TEST 6 FAILED:", error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 x402 PAYMENT PROTOCOL TEST SUITE");
  console.log("=".repeat(70));
  console.log("Testing real x402 payments on Hedera testnet");
  console.log("=".repeat(70));

  const results: { name: string; passed: boolean }[] = [];

  // Run tests
  if (TESTS.INITIALIZATION) {
    results.push({
      name: "Initialization",
      passed: await testInitialization(),
    });
  }

  if (TESTS.HBAR_PAYMENT) {
    results.push({
      name: "HBAR Payment",
      passed: await testHBARPayment(),
    });
  }

  if (TESTS.USDC_PAYMENT) {
    results.push({
      name: "USDC Payment",
      passed: await testUSDCPayment(),
    });
  }

  if (TESTS.PAYMENT_VERIFICATION) {
    results.push({
      name: "Payment Verification",
      passed: await testPaymentVerification(),
    });
  }

  if (TESTS.ESCROW) {
    results.push({
      name: "Escrow",
      passed: await testEscrow(),
    });
  }

  if (TESTS.BALANCE_CHECK) {
    results.push({
      name: "Balance Check",
      passed: await testBalanceCheck(),
    });
  }

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
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("\n✅ x402 payment protocol is working correctly:");
    console.log("   - HBAR payments working");
    console.log("   - Payment verification via Mirror Node working");
    console.log("   - Escrow creation working");
    console.log("   - Balance checks working");
    console.log("\n🚀 Ready for integration with LangGraph agents!");
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

