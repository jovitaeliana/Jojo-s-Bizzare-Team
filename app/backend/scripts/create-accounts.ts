import { Client, PrivateKey, AccountCreateTransaction, Hbar, AccountId } from "@hashgraph/sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Create new Hedera testnet accounts for buyer and seller
 * This script will:
 * 1. Create 2 new accounts on Hedera testnet
 * 2. Display account credentials
 * 3. Save credentials to a file
 * 4. Provide instructions for funding accounts
 */
async function main() {
  console.log("🔧 Creating Hedera testnet accounts...\n");

  // Validate platform account credentials
  const platformAccountId = process.env.PLATFORM_ACCOUNT_ID;
  const platformPrivateKey = process.env.PLATFORM_PRIVATE_KEY;

  if (!platformAccountId || !platformPrivateKey) {
    console.error("❌ Error: Platform account credentials not found in .env file");
    console.error("Please set PLATFORM_ACCOUNT_ID and PLATFORM_PRIVATE_KEY");
    process.exit(1);
  }

  // Initialize Hedera client
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(platformAccountId),
    PrivateKey.fromStringECDSA(platformPrivateKey)
  );

  console.log("✅ Connected to Hedera testnet");
  console.log("📝 Using platform account:", platformAccountId, "\n");

  // Check platform account balance
  const balance = await client.getAccountBalance(AccountId.fromString(platformAccountId));
  console.log("💰 Platform account balance:", balance.hbars.toString());

  if (balance.hbars.toBigNumber().isLessThan(20)) {
    console.error("\n❌ Error: Insufficient HBAR balance to create accounts");
    console.error("You need at least 20 HBAR to create 2 new accounts");
    console.error("Fund your account at: https://portal.hedera.com/faucet");
    process.exit(1);
  }

  const accounts = [];

  // Create 2 accounts (buyer and seller)
  for (let i = 0; i < 2; i++) {
    const accountType = i === 0 ? "Buyer" : "Seller";
    console.log(`\n🔨 Creating ${accountType} account...`);

    // Generate new key pair
    const newPrivateKey = PrivateKey.generateECDSA();
    const newPublicKey = newPrivateKey.publicKey;

    // Create account with initial balance of 10 HBAR
    const createAccountTx = new AccountCreateTransaction()
      .setKey(newPublicKey)
      .setInitialBalance(new Hbar(10))
      .setMaxAutomaticTokenAssociations(10);

    const createAccountTxResponse = await createAccountTx.execute(client);
    const receipt = await createAccountTxResponse.getReceipt(client);
    const newAccountId = receipt.accountId;

    if (!newAccountId) {
      console.error(`❌ Failed to create ${accountType} account`);
      continue;
    }

    // Get EVM address
    const evmAddress = `0x${newPublicKey.toEvmAddress()}`;

    const accountInfo = {
      type: accountType,
      accountId: newAccountId.toString(),
      evmAddress: evmAddress,
      privateKey: newPrivateKey.toStringRaw(),
      publicKey: newPublicKey.toStringRaw(),
    };

    accounts.push(accountInfo);

    console.log(`✅ ${accountType} account created successfully!`);
    console.log(`   Account ID: ${accountInfo.accountId}`);
    console.log(`   EVM Address: ${accountInfo.evmAddress}`);
    console.log(`   Private Key: ${accountInfo.privateKey}`);
  }

  // Save account information
  const accountsDir = path.join(__dirname, "..", "accounts");
  if (!fs.existsSync(accountsDir)) {
    fs.mkdirSync(accountsDir, { recursive: true });
  }

  const accountsFile = path.join(accountsDir, "testnet_accounts.json");
  fs.writeFileSync(
    accountsFile,
    JSON.stringify(
      {
        network: "testnet",
        created: new Date().toISOString(),
        accounts: accounts,
      },
      null,
      2
    )
  );

  console.log("\n💾 Account information saved to:", accountsFile);

  // Display .env configuration
  console.log("\n📝 Add these to your .env file:\n");
  console.log("# Buyer Account");
  console.log(`BUYER_ACCOUNT_ID=${accounts[0].accountId}`);
  console.log(`BUYER_PRIVATE_KEY=${accounts[0].privateKey}`);
  console.log(`BUYER_EVM_ADDRESS=${accounts[0].evmAddress}`);
  console.log("\n# Seller Account");
  console.log(`SELLER_ACCOUNT_ID=${accounts[1].accountId}`);
  console.log(`SELLER_PRIVATE_KEY=${accounts[1].privateKey}`);
  console.log(`SELLER_EVM_ADDRESS=${accounts[1].evmAddress}`);

  // Display next steps
  console.log("\n✨ Account creation complete! Next steps:");
  console.log("1. Copy the account credentials to your .env file");
  console.log("2. (Optional) Fund accounts with more HBAR at: https://portal.hedera.com/faucet");
  console.log("3. Proceed with contract deployment: npm run deploy:contracts\n");

  // Display account summary
  console.log("📊 Account Summary:");
  console.log("┌─────────────┬──────────────────┬──────────────────────────────────────────────┐");
  console.log("│ Type        │ Account ID       │ EVM Address                                  │");
  console.log("├─────────────┼──────────────────┼──────────────────────────────────────────────┤");
  accounts.forEach((acc) => {
    console.log(`│ ${acc.type.padEnd(11)} │ ${acc.accountId.padEnd(16)} │ ${acc.evmAddress.padEnd(44)} │`);
  });
  console.log("└─────────────┴──────────────────┴──────────────────────────────────────────────┘\n");

  client.close();
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Account creation failed:");
    console.error(error);
    process.exit(1);
  });

