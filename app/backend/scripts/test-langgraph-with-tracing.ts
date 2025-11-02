/**
 * LangGraph Test with LangSmith Tracing
 * 
 * This runs the ACTUAL LangGraph workflow (not simulated)
 * so you can see the traces in LangSmith.
 * 
 * Make sure you have:
 * 1. LANGCHAIN_TRACING_V2=true in .env
 * 2. LANGCHAIN_API_KEY set in .env
 * 3. LANGCHAIN_PROJECT set in .env
 */

import dotenv from 'dotenv';
import { getBuyerAgent } from '../src/agents/buyerAgent.js';
import { sellingAgentService } from '../src/services/sellingAgent.js';

dotenv.config();

async function testLangGraphWithTracing() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 LANGGRAPH TEST WITH LANGSMITH TRACING');
  console.log('='.repeat(70));
  console.log('');
  console.log('📊 LangSmith Configuration:');
  console.log(`   Tracing: ${process.env.LANGCHAIN_TRACING_V2}`);
  console.log(`   Project: ${process.env.LANGCHAIN_PROJECT}`);
  console.log(`   Endpoint: ${process.env.LANGCHAIN_ENDPOINT}`);
  console.log('');
  console.log('🔗 View traces at: https://smith.langchain.com/');
  console.log('');
  console.log('='.repeat(70));

  try {
    // Step 1: Ensure we have a product listing
    console.log('\n📋 Step 1: Setting up product listing...');
    
    const existingListing = sellingAgentService.getListing('product-1');
    if (!existingListing) {
      await sellingAgentService.createListingWithId(
        'product-1',
        'MacBook Pro 2021 14"',
        'Like-new MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD. Perfect for software development.',
        10, // Small amount for demo
        'HBAR',
        undefined,
        'like-new' as any,
        'electronics'
      );
      
      if (process.env.SELLER_ACCOUNT_ID) {
        await sellingAgentService.updateListing('product-1', {
          status: 'active',
          sellerAddress: process.env.SELLER_ACCOUNT_ID,
        } as any);
      }
    }
    
    console.log('   ✅ Product listing ready');
    console.log(`   Product: MacBook Pro 2021 14"`);
    console.log(`   Price: 10 HBAR`);

    // Step 2: Create buyer agent
    console.log('\n🤖 Step 2: Creating buyer agent...');
    const buyerAgent = await getBuyerAgent();
    console.log('   ✅ Buyer agent created');

    // Step 3: Execute the REAL LangGraph workflow
    console.log('\n🚀 Step 3: Executing LangGraph workflow...');
    console.log('   This will create traces in LangSmith!');
    console.log('');
    console.log('   User Request: "I need a MacBook Pro for software development"');
    console.log('   Budget: 20 HBAR');
    console.log('');
    console.log('   ⏳ Running workflow (this may take 10-30 seconds)...');
    console.log('');

    const startTime = Date.now();
    
    // This is the REAL LangGraph execution
    const result = await buyerAgent.executePurchase(
      "I need a MacBook Pro for software development",
      20 // Budget
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Step 4: Display results
    console.log('\n' + '='.repeat(70));
    console.log('📊 WORKFLOW RESULTS');
    console.log('='.repeat(70));
    console.log('');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('');
    console.log('📝 State Transitions:');
    console.log(`   Discovery: ${result.discoveredProducts?.length || 0} products found`);
    console.log(`   Selection: ${result.selectedProduct ? '✅ ' + result.selectedProduct.title : '❌ No selection'}`);
    console.log(`   Negotiation: ${result.offerAccepted ? '✅ Offer accepted' : '❌ Not accepted'}`);
    console.log(`   Payment: ${result.paymentId ? '✅ ' + result.paymentId : '❌ No payment'}`);
    console.log(`   Complete: ${result.finalResult?.success ? '✅ Success' : '❌ Incomplete'}`);
    console.log('');

    if (result.error) {
      console.log(`⚠️  Error: ${result.error}`);
      console.log('');
    }

    if (result.paymentId) {
      console.log('💰 Payment Details:');
      console.log(`   Transaction ID: ${result.paymentId}`);
      console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${result.paymentId}`);
      console.log('');
    }

    // Step 5: LangSmith instructions
    console.log('='.repeat(70));
    console.log('🔍 VIEW IN LANGSMITH');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Go to: https://smith.langchain.com/');
    console.log(`2. Select project: "${process.env.LANGCHAIN_PROJECT}"`);
    console.log('3. Look for the most recent run');
    console.log('4. You should see:');
    console.log('   - LangGraph workflow execution');
    console.log('   - Each node (DISCOVER, SELECT, NEGOTIATE, PAY, COMPLETE)');
    console.log('   - LLM calls (Groq)');
    console.log('   - State transitions');
    console.log('   - Timing information');
    console.log('');
    console.log('💡 Tip: The run name will include "BuyerAgent" or "executePurchase"');
    console.log('');

    // Success!
    console.log('='.repeat(70));
    if (result.finalResult?.success && result.paymentId) {
      console.log('✅ TEST PASSED: LangGraph workflow completed with x402 payment!');
      console.log('   Check LangSmith for detailed traces!');
    } else if (result.discoveredProducts?.length === 0) {
      console.log('⚠️  TEST PARTIAL: No products discovered');
      console.log('   This is expected if seller agent is not registered in ERC-8004');
      console.log('   But you should still see LangGraph traces in LangSmith!');
    } else {
      console.log('⚠️  TEST PARTIAL: Workflow ran but did not complete fully');
      console.log('   Check LangSmith for detailed traces to debug!');
    }
    console.log('='.repeat(70));

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    console.log('\n💡 Even if the test failed, check LangSmith for traces!');
    process.exit(1);
  }
}

// Run the test
testLangGraphWithTracing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

