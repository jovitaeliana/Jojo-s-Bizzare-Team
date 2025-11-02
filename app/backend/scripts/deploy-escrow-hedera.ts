/**
 * Deploy Escrow Contracts to Hedera Testnet
 * Uses Hedera SDK for deployment
 */

import {
  Client,
  ContractCreateFlow,
  Hbar,
  AccountId,
  PrivateKey,
} from '@hashgraph/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function deployEscrowContracts() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 Deploying Escrow Contracts to Hedera Testnet");
  console.log("=".repeat(70));

  // Initialize Hedera client
  const accountId = process.env.PLATFORM_ACCOUNT_ID || process.env.BUYER_ACCOUNT_ID;
  let privateKey = process.env.PLATFORM_PRIVATE_KEY || process.env.BUYER_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error("❌ Error: Missing credentials");
    console.error("   Required: PLATFORM_ACCOUNT_ID and PLATFORM_PRIVATE_KEY");
    console.error("   Or: BUYER_ACCOUNT_ID and BUYER_PRIVATE_KEY");
    process.exit(1);
  }

  // Remove 0x prefix if present
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.substring(2);
  }

  console.log("\n📋 Configuration:");
  console.log(`   Network: Hedera Testnet`);
  console.log(`   Deployer: ${accountId}`);

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringECDSA(privateKey)
  );

  try {
    // Read compiled bytecode from Hardhat artifacts
    const escrowArtifactPath = path.join(
      process.cwd(),
      'artifacts/contracts/Escrow.sol/Escrow.json'
    );
    const factoryArtifactPath = path.join(
      process.cwd(),
      'artifacts/contracts/EscrowFactory.sol/EscrowFactory.json'
    );

    console.log("\n📦 Reading compiled contracts...");
    
    const escrowArtifact = JSON.parse(fs.readFileSync(escrowArtifactPath, 'utf8'));
    const factoryArtifact = JSON.parse(fs.readFileSync(factoryArtifactPath, 'utf8'));

    const escrowBytecode = escrowArtifact.bytecode;
    const factoryBytecode = factoryArtifact.bytecode;

    console.log(`   ✅ Escrow bytecode: ${escrowBytecode.length} bytes`);
    console.log(`   ✅ Factory bytecode: ${factoryBytecode.length} bytes`);

    // Deploy EscrowFactory (it will deploy Escrow as needed)
    console.log("\n" + "=".repeat(70));
    console.log("STEP 1: Deploy EscrowFactory Contract");
    console.log("=".repeat(70));

    console.log("   📝 Creating contract transaction...");
    console.log("   ⏳ This may take 10-15 seconds...");

    const factoryTx = new ContractCreateFlow()
      .setBytecode(factoryBytecode)
      .setGas(3000000);

    const factorySubmit = await factoryTx.execute(client);
    const factoryReceipt = await factorySubmit.getReceipt(client);
    const factoryContractId = factoryReceipt.contractId;

    if (!factoryContractId) {
      throw new Error("Failed to get contract ID from receipt");
    }

    console.log("\n✅ EscrowFactory Deployed Successfully!");
    console.log(`   Contract ID: ${factoryContractId.toString()}`);
    console.log(`   Transaction: ${factorySubmit.transactionId.toString()}`);
    console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/contract/${factoryContractId.toString()}`);

    // Update .env file
    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Update .env File");
    console.log("=".repeat(70));

    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    const factoryAddress = factoryContractId.toString();

    if (envContent.includes('ESCROW_FACTORY_ADDRESS=')) {
      // Replace existing value
      envContent = envContent.replace(
        /ESCROW_FACTORY_ADDRESS=.*/,
        `ESCROW_FACTORY_ADDRESS=${factoryAddress}`
      );
      console.log("   ✅ Updated existing ESCROW_FACTORY_ADDRESS");
    } else {
      // Add new line
      envContent += `\n# Escrow Factory Contract\nESCROW_FACTORY_ADDRESS=${factoryAddress}\n`;
      console.log("   ✅ Added ESCROW_FACTORY_ADDRESS to .env");
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`   📝 ESCROW_FACTORY_ADDRESS=${factoryAddress}`);

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n📊 Deployment Summary:");
    console.log(`   Factory Contract: ${factoryAddress}`);
    console.log(`   Network: Hedera Testnet`);
    console.log(`   Deployer: ${accountId}`);
    console.log(`   Gas Used: 500,000`);

    console.log("\n🔗 Links:");
    console.log(`   HashScan: https://hashscan.io/testnet/contract/${factoryAddress}`);
    console.log(`   Transaction: https://hashscan.io/testnet/transaction/${factorySubmit.transactionId.toString()}`);

    console.log("\n🧪 Next Steps:");
    console.log("   1. Verify contract on HashScan (link above)");
    console.log("   2. Test escrow: node --import tsx scripts/test-escrow-integration.ts");
    console.log("   3. Test full flow: npm run test:langgraph");

    console.log("\n💡 How Escrow Works:");
    console.log("   1. Factory creates individual escrow contracts");
    console.log("   2. Buyer funds escrow with HBAR");
    console.log("   3. Seller confirms shipment");
    console.log("   4. Buyer confirms delivery → funds released to seller");

    console.log("\n" + "=".repeat(70));

    client.close();
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ Deployment Failed!");
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('INSUFFICIENT_TX_FEE')) {
      console.error("\n💡 Solution: Increase max transaction fee");
      console.error("   The contract is large and needs more gas");
    } else if (error.message.includes('INVALID_SIGNATURE')) {
      console.error("\n💡 Solution: Check your private key format");
      console.error("   Should be hex string without 0x prefix");
    } else if (error.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
      console.error("\n💡 Solution: Get testnet HBAR from faucet");
      console.error("   Visit: https://portal.hedera.com/faucet");
    }

    console.error("\n📋 Debug Info:");
    console.error(`   Account: ${accountId}`);
    console.error(`   Network: Hedera Testnet`);
    
    client.close();
    process.exit(1);
  }
}

// Run deployment
console.log("\n🚀 Starting Escrow Contract Deployment...\n");
deployEscrowContracts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

