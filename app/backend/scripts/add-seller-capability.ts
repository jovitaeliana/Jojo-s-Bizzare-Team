/**
 * Add marketplace_seller capability to seller agent
 *
 * This manually adds the seller agent to the ERC8004 discovery cache
 * with the "marketplace_seller" capability so buyers can discover it.
 */

import { erc8004Service } from '../src/services/erc8004.js';
import dotenv from 'dotenv';

dotenv.config();

async function addSellerCapability() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 ADDING SELLER TO DISCOVERY CACHE');
  console.log('='.repeat(70));
  console.log('');

  try {
    const sellerAgentId = process.env.SELLER_AGENT_ID;
    const sellerAccountId = process.env.SELLER_ACCOUNT_ID;
    const sellerEvmAddress = process.env.SELLER_EVM_ADDRESS;

    if (!sellerAgentId || !sellerAccountId || !sellerEvmAddress) {
      throw new Error('Missing SELLER_AGENT_ID, SELLER_ACCOUNT_ID, or SELLER_EVM_ADDRESS in .env');
    }

    console.log(`📋 Seller Agent ID: ${sellerAgentId}`);
    console.log(`📋 Seller Account: ${sellerAccountId}`);
    console.log(`📋 Seller EVM Address: ${sellerEvmAddress}`);
    console.log('');

    // Manually add seller to discovery cache
    console.log('📝 Adding seller to discovery cache...');

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
        },
        {
          name: 'sell',
          description: 'List and sell items on marketplace',
          endpoint: '/api/seller/sell'
        },
        {
          name: 'negotiate',
          description: 'Negotiate prices with buyers',
          endpoint: '/api/seller/negotiate'
        },
        {
          name: 'ship',
          description: 'Confirm shipment of items',
          endpoint: '/api/seller/ship'
        }
      ],
      metadata: [
        { key: 'agentType', value: 'seller' },
        { key: 'version', value: '1.0.0' },
        { key: 'sellerAddress', value: sellerAccountId },
        { key: 'sellerUrl', value: 'http://localhost:3000/a2a' }
      ]
    };

    // Add to cache using the internal method
    (erc8004Service as any).discoveredAgents.set(sellerAgentId, sellerAgent);

    console.log('   ✅ Seller added to cache');
    console.log('');

    // Test discovery
    console.log('🔍 Testing discovery...');
    const discoveredAgents = await erc8004Service.discoverAgents('marketplace_seller');
    console.log(`   ✅ Found ${discoveredAgents.length} seller agent(s)`);

    if (discoveredAgents.length > 0) {
      const seller = discoveredAgents[0];
      console.log('');
      console.log('   📋 Discovered Seller:');
      console.log(`      Agent ID: ${seller.agentId}`);
      console.log(`      Name: ${seller.agentName}`);
      console.log(`      Owner: ${seller.owner}`);
      console.log(`      Capabilities: ${seller.capabilities.map(c => c.name).join(', ')}`);
      console.log(`      Seller URL: ${seller.sellerUrl}`);
      console.log(`      Seller Address: ${seller.sellerAddress}`);
    }
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ SUCCESS: Seller agent is now discoverable!');
    console.log('='.repeat(70));
    console.log('');
    console.log('⚠️  NOTE: This is cached in memory only.');
    console.log('   The seller will be discoverable until the process restarts.');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Start seller server: npm run dev');
    console.log('   2. Run buyer agent: node --import tsx scripts/test-langgraph-with-tracing.ts');
    console.log('   3. Buyer should now discover the seller!');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Failed to add capability:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addSellerCapability()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

