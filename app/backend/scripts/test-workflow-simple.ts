/**
 * Simple Workflow Test
 * 
 * This test demonstrates the complete workflow with:
 * - ERC-8004 seller discovery
 * - LangGraph state machine
 * - x402 payment (with affordable price)
 * - LangSmith tracing
 */

import dotenv from 'dotenv';
import { getBuyerAgent } from '../src/agents/buyerAgent.js';
import { erc8004Service } from '../src/services/erc8004.js';

dotenv.config();

async function testSimpleWorkflow() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 SIMPLE WORKFLOW TEST');
  console.log('='.repeat(70));
  console.log('');
  console.log('📊 LangSmith Configuration:');
  console.log(`   Tracing: ${process.env.LANGCHAIN_TRACING_V2}`);
  console.log(`   Project: ${process.env.LANGCHAIN_PROJECT}`);
  console.log('');
  console.log('🔗 View traces at: https://smith.langchain.com/');
  console.log('');
  console.log('='.repeat(70));

  try {
    // Step 1: Register seller in discovery cache
    console.log('\n📋 Step 1: Registering seller in discovery cache...');
    
    const sellerAgentId = process.env.SELLER_AGENT_ID;
    const sellerAccountId = process.env.SELLER_ACCOUNT_ID;
    const sellerEvmAddress = process.env.SELLER_EVM_ADDRESS;

    if (!sellerAgentId || !sellerAccountId || !sellerEvmAddress) {
      throw new Error('Missing SELLER_AGENT_ID, SELLER_ACCOUNT_ID, or SELLER_EVM_ADDRESS in .env');
    }

    const sellerAgent = {
      agentId: sellerAgentId,
      agentName: 'MarketplaceSeller',
      owner: sellerEvmAddress,
      sellerAddress: sellerAccountId,
      sellerUrl: 'http://localhost:3000/a2a',
      capabilities: [
        {
          name: 'marketplace_seller',
          description: 'Sell products on the marketplace',
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
    
    console.log('   ✅ Seller registered in cache');
    console.log(`   Agent ID: ${sellerAgentId}`);
    console.log(`   Seller Address: ${sellerAccountId}`);
    console.log('');

    // Step 2: Create buyer agent
    console.log('🤖 Step 2: Creating buyer agent...');
    const buyerAgent = await getBuyerAgent();
    console.log('   ✅ Buyer agent created');
    console.log('');

    // Step 3: Execute workflow
    console.log('🚀 Step 3: Executing LangGraph workflow...');
    console.log('   This will create traces in LangSmith!');
    console.log('');
    console.log('   ⚠️  NOTE: This test requires the seller server to be running');
    console.log('   If you see "fetch failed", start the server with: npm run dev');
    console.log('');
    console.log('   User Request: "I need a MacBook Pro for software development"');
    console.log('   Budget: 20 HBAR');
    console.log('');
    console.log('   ⏳ Running workflow...');
    console.log('');

    const startTime = Date.now();
    
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
    
    if (result.discoveredProducts && result.discoveredProducts.length > 0) {
      console.log('   📦 Products:');
      result.discoveredProducts.forEach((p: any, i: number) => {
        console.log(`      ${i + 1}. ${p.title} - ${p.price} ${p.currency}`);
      });
    }
    
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
    console.log('⏰ Note: Traces may take 5-10 seconds to appear');
    console.log('');

    // Success!
    console.log('='.repeat(70));
    if (result.finalResult?.success && result.paymentId) {
      console.log('✅ TEST PASSED: Complete workflow with x402 payment!');
      console.log('   Check LangSmith for detailed traces!');
    } else if (result.discoveredProducts?.length === 0) {
      console.log('⚠️  TEST PARTIAL: No products discovered');
      console.log('   Make sure seller server is running: npm run dev');
      console.log('   Then update the product price to 5 HBAR in the seller UI');
    } else if (result.error?.includes('INSUFFICIENT_PAYER_BALANCE')) {
      console.log('⚠️  TEST PARTIAL: Insufficient balance');
      console.log('   The product price is too high for the buyer account');
      console.log('   Either:');
      console.log('   1. Fund buyer account at: https://portal.hedera.com/faucet');
      console.log(`      Account: ${process.env.BUYER_ACCOUNT_ID}`);
      console.log('   2. Lower product price in seller server to 5 HBAR');
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
testSimpleWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

