/**
 * Simple x402 Payment Test
 * Tests basic x402 payment functionality
 */

import { X402Service } from '../src/services/x402.js';
import dotenv from 'dotenv';

dotenv.config();

async function testX402Payment() {
  console.log('\n======================================================================');
  console.log('🧪 SIMPLE x402 PAYMENT TEST');
  console.log('======================================================================\n');

  try {
    // Initialize x402 service
    const x402 = new X402Service();
    
    const buyerAccountId = process.env.BUYER_ACCOUNT_ID;
    const buyerPrivateKey = process.env.BUYER_PRIVATE_KEY;
    const sellerAccountId = process.env.SELLER_ACCOUNT_ID;

    if (!buyerAccountId || !buyerPrivateKey || !sellerAccountId) {
      throw new Error('Missing environment variables');
    }

    console.log('📋 Test Configuration:');
    console.log(`   Buyer: ${buyerAccountId}`);
    console.log(`   Seller: ${sellerAccountId}`);
    console.log(`   Amount: 1 HBAR\n`);

    // Initialize service
    console.log('🔧 Initializing x402 service...');
    await x402.initialize(buyerAccountId, buyerPrivateKey);
    console.log('   ✅ Service initialized\n');

    // Make payment
    console.log('💰 Processing payment...');
    const paymentId = await x402.processAgentPayment(
      sellerAccountId,
      1,
      'HBAR',
      'test-product-1'
    );

    console.log(`   ✅ Payment successful!`);
    console.log(`   Transaction ID: ${paymentId}`);
    console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${paymentId}\n`);

    console.log('======================================================================');
    console.log('✅ TEST PASSED: x402 payment works!');
    console.log('======================================================================\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testX402Payment();

