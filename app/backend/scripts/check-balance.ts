import { AccountBalanceQuery, Client, AccountId } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = Client.forTestnet();
  
  const buyerId = process.env.BUYER_ACCOUNT_ID!;
  const sellerId = process.env.SELLER_ACCOUNT_ID!;
  
  const buyerBalance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(buyerId))
    .execute(client);
    
  const sellerBalance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(sellerId))
    .execute(client);
  
  console.log('\nAccount Balances:');
  console.log('================');
  console.log('Buyer  (' + buyerId + '): ' + buyerBalance.hbars.toString());
  console.log('Seller (' + sellerId + '): ' + sellerBalance.hbars.toString());
  
  client.close();
}

main().catch(console.error);
