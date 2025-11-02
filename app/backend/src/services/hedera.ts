import { Client, AccountId, PrivateKey, TransferTransaction, Hbar } from '@hashgraph/sdk';

export class HederaService {
  private client: Client | null = null;
  private accountId: AccountId | null = null;
  private privateKey: PrivateKey | null = null;

  /**
   * Initialize Hedera client connection to testnet
   */
  async initialize(accountIdStr: string, privateKeyStr: string): Promise<void> {
    try {
      this.accountId = AccountId.fromString(accountIdStr);
      this.privateKey = PrivateKey.fromString(privateKeyStr);

      // Create client for Hedera testnet
      this.client = Client.forTestnet();
      this.client.setOperator(this.accountId, this.privateKey);

      console.log('Hedera client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      throw error;
    }
  }

  /**
   * Transfer HBAR or tokens to another account
   */
  async transferPayment(
    recipientId: string,
    amount: number,
    memo?: string
  ): Promise<string> {
    if (!this.client || !this.accountId) {
      throw new Error('Hedera client not initialized');
    }

    try {
      const transaction = new TransferTransaction()
        .addHbarTransfer(this.accountId, Hbar.fromTinybars(-amount))
        .addHbarTransfer(AccountId.fromString(recipientId), Hbar.fromTinybars(amount));

      if (memo) {
        transaction.setTransactionMemo(memo);
      }

      // Submit the transaction
      const txResponse = await transaction.execute(this.client);

      // Get the receipt
      const receipt = await txResponse.getReceipt(this.client);

      console.log('Transaction successful:', receipt.status.toString());

      return txResponse.transactionId.toString();
    } catch (error) {
      console.error('Payment transfer failed:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<number> {
    if (!this.client || !this.accountId) {
      throw new Error('Hedera client not initialized');
    }

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(this.accountId)
        .execute(this.client);

      return balance.hbars.toTinybars().toNumber();
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  /**
   * Close the client connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}

// Singleton instance
export const hederaService = new HederaService();

// Import AccountBalanceQuery
import { AccountBalanceQuery } from '@hashgraph/sdk';
