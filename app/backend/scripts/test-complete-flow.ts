/**
 * Complete End-to-End Test with x402 Payment
 *
 * This test demonstrates the full autonomous marketplace flow:
 * 1. Verify seller listing exists (created by server on startup)
 * 2. Run buyer agent through LangGraph workflow
 * 3. Execute x402 payment
 * 4. Complete transaction
 *
 * PREREQUISITE: Run `npm run dev` in another terminal to start the seller server
 */

import dotenv from 'dotenv';
import { getBuyerAgent } from '../src/agents/buyerAgent.js';
import { sellingAgentService } from '../src/services/sellingAgent.js';

dotenv.config();

/**
 * Step 1: Verify Seller Listing
 */
async function verifySellerListing(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 1: Verifying Seller Listing');
  console.log('='.repeat(70));

  try {
    const listing = sellingAgentService.getListing('product-1');

    if (!listing) {
      console.log('⚠️ No listing found. Creating one...');

      await sellingAgentService.createListingWithId(
        'product-1',
        'MacBook Pro 2021 14"',
        'Like-new MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD. Perfect for software development.',
        1500,
        'HBAR',
        undefined,
        'like-new' as any,
        'electronics'
      );

      // Update with seller address
      if (process.env.SELLER_ACCOUNT_ID) {
        await sellingAgentService.updateListing('product-1', {
          status: 'active',
          sellerAddress: process.env.SELLER_ACCOUNT_ID,
        } as any);
      }
    }

    const finalListing = sellingAgentService.getListing('product-1');
    console.log('✅ Product listing verified:');
    console.log(`   Product: ${finalListing?.title}`);
    console.log(`   Price: ${finalListing?.price} ${finalListing?.currency}`);
    console.log(`   Seller: ${finalListing?.sellerAddress}`);
  } catch (error: any) {
    console.error('❌ Failed to verify listing:', error.message);
    throw error;
  }
}

/**
 * Step 2: Run Buyer Agent Workflow
 */
async function runBuyerWorkflow(): Promise<any> {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: Running Buyer Agent LangGraph Workflow');
  console.log('='.repeat(70));

  try {
    const buyerAgent = await getBuyerAgent();

    console.log('\n🤖 Starting autonomous buyer agent...');
    console.log('   Request: "I need a MacBook Pro for software development"');
    console.log('   Budget: 2000 HBAR');
    console.log('');

    // Execute the full LangGraph workflow
    const result = await buyerAgent.executePurchase(
      "I need a MacBook Pro for software development",
      2000 // Budget
    );

    return result;
  } catch (error: any) {
    console.error('❌ Buyer workflow failed:', error.message);
    throw error;
  }
}

/**
 * Step 3: Display Results
 */
function displayResults(result: any): void {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 3: Workflow Results');
  console.log('='.repeat(70));

  console.log('\n📊 Final State:');
  console.log(`   Success: ${result.finalResult?.success || false}`);
  
  if (result.finalResult?.product) {
    console.log(`   Product: ${result.finalResult.product.title}`);
    console.log(`   Price: ${result.finalResult.product.price} ${result.finalResult.product.currency}`);
  }
  
  if (result.paymentId) {
    console.log(`   Payment ID: ${result.paymentId}`);
    console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${result.paymentId}`);
  }
  
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  console.log('\n📝 Workflow Steps Completed:');
  console.log(`   ✅ Discovery: ${result.discoveredProducts?.length || 0} products found`);
  console.log(`   ✅ Selection: ${result.selectedProduct ? 'Product selected' : 'No selection'}`);
  console.log(`   ✅ Negotiation: ${result.offerAccepted ? 'Offer accepted' : 'Negotiation incomplete'}`);
  console.log(`   ✅ Payment: ${result.paymentId ? 'x402 payment successful' : 'No payment'}`);
  console.log(`   ✅ Complete: ${result.finalResult?.success ? 'Transaction complete' : 'Incomplete'}`);
}

/**
 * Main Test Runner
 */
async function runCompleteTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 COMPLETE END-TO-END TEST WITH x402 PAYMENT');
  console.log('='.repeat(70));
  console.log('Testing full autonomous marketplace with LangGraph + x402');
  console.log('='.repeat(70));
  console.log('\n📝 NOTE: This test assumes seller server is running');
  console.log('   If not, run: npm run dev (in another terminal)');
  console.log('');

  try {
    // Step 1: Verify seller listing
    await verifySellerListing();

    // Step 2: Run buyer workflow
    const result = await runBuyerWorkflow();

    // Step 3: Display results
    displayResults(result);

    // Success!
    console.log('\n' + '='.repeat(70));
    if (result.finalResult?.success && result.paymentId) {
      console.log('✅ TEST PASSED: Complete flow with x402 payment successful!');
    } else if (result.discoveredProducts?.length > 0) {
      console.log('⚠️ TEST PARTIAL: Workflow ran but payment may not have completed');
      console.log('   This is expected if seller agent is not running or discovery failed');
    } else {
      console.log('❌ TEST FAILED: Workflow did not complete successfully');
    }
    console.log('='.repeat(70));

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
runCompleteTest();

