import { Client, AccountId, PrivateKey, TransferTransaction, Hbar, HbarUnit, TokenId, AccountBalanceQuery } from '@hashgraph/sdk';
import axios from 'axios';
/**
 * x402 Payment Service
 * Handles secure on-chain payments for agent transactions
 */
export class X402Service {
    client = null;
    accountId = null;
    privateKey = null;
    // Hedera testnet USDC token ID
    USDC_TOKEN_ID = "0.0.429274";
    /**
     * Initialize x402 service with Hedera credentials
     */
    async initialize(accountIdStr, privateKeyStr) {
        try {
            this.accountId = AccountId.fromString(accountIdStr);
            this.privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
            // Create client for Hedera testnet
            this.client = Client.forTestnet();
            this.client.setOperator(this.accountId, this.privateKey);
            console.log('✅ x402 service initialized for account:', accountIdStr);
        }
        catch (error) {
            console.error('❌ Failed to initialize x402 service:', error.message);
            throw error;
        }
    }
    /**
     * Process payment to an AI agent (HBAR or USDC)
     */
    async processAgentPayment(recipientAddress, amount, currency, productId) {
        if (!this.client || !this.accountId) {
            throw new Error('x402 service not initialized');
        }
        try {
            console.log(`\n💰 [x402] Processing payment:`);
            console.log(`   To: ${recipientAddress}`);
            console.log(`   Amount: ${amount} ${currency}`);
            console.log(`   Product: ${productId}`);
            // Create payment memo with x402 protocol reference
            const memo = `x402:${productId}`;
            let transactionId;
            if (currency === 'HBAR') {
                // Native HBAR payment
                transactionId = await this.payWithHBAR(recipientAddress, amount, memo);
            }
            else if (currency === 'USDC' || currency === this.USDC_TOKEN_ID) {
                // USDC token payment
                transactionId = await this.payWithUSDC(recipientAddress, amount, memo);
            }
            else {
                throw new Error(`Unsupported currency: ${currency}`);
            }
            console.log(`   ✅ Payment successful: ${transactionId}`);
            return transactionId;
        }
        catch (error) {
            console.error(`   ❌ Payment failed:`, error.message);
            throw error;
        }
    }
    /**
     * Pay with native HBAR
     */
    async payWithHBAR(recipientId, amountHBAR, memo) {
        if (!this.client || !this.accountId) {
            throw new Error('Client not initialized');
        }
        console.log(`\n🔍 DEBUG payWithHBAR:`);
        console.log(`   recipientId: "${recipientId}" (type: ${typeof recipientId})`);
        console.log(`   amountHBAR: ${amountHBAR}`);
        console.log(`   memo: ${memo}`);
        console.log(`   sender (this.accountId): ${this.accountId.toString()}`);
        try {
            const recipientAccountId = AccountId.fromString(recipientId);
            console.log(`   ✅ Parsed recipient AccountId: ${recipientAccountId.toString()}`);
            const transaction = new TransferTransaction()
                .addHbarTransfer(this.accountId, Hbar.from(-amountHBAR, HbarUnit.Hbar))
                .addHbarTransfer(recipientAccountId, Hbar.from(amountHBAR, HbarUnit.Hbar))
                .setTransactionMemo(memo);
            console.log(`   ✅ Transaction constructed successfully`);
            // Execute transaction
            console.log(`   📤 Executing transaction...`);
            const txResponse = await transaction.execute(this.client);
            console.log(`   ✅ Transaction executed: ${txResponse.transactionId.toString()}`);
            // Wait for receipt
            console.log(`   ⏳ Waiting for receipt...`);
            const receipt = await txResponse.getReceipt(this.client);
            console.log(`   ✅ Receipt received: ${receipt.status.toString()}`);
            console.log(`   Receipt status: ${receipt.status.toString()}`);
            return txResponse.transactionId.toString();
        }
        catch (error) {
            console.error('   HBAR payment failed:', error.message);
            throw error;
        }
    }
    /**
     * Pay with USDC token
     */
    async payWithUSDC(recipientId, amountUSDC, memo) {
        if (!this.client || !this.accountId) {
            throw new Error('Client not initialized');
        }
        try {
            const tokenId = TokenId.fromString(this.USDC_TOKEN_ID);
            // USDC has 6 decimals, so convert to smallest unit
            const amountInSmallestUnit = Math.floor(amountUSDC * 1_000_000);
            const transaction = new TransferTransaction()
                .addTokenTransfer(tokenId, this.accountId, -amountInSmallestUnit)
                .addTokenTransfer(tokenId, AccountId.fromString(recipientId), amountInSmallestUnit)
                .setTransactionMemo(memo);
            // Execute transaction
            const txResponse = await transaction.execute(this.client);
            // Wait for receipt
            const receipt = await txResponse.getReceipt(this.client);
            console.log(`   Receipt status: ${receipt.status.toString()}`);
            return txResponse.transactionId.toString();
        }
        catch (error) {
            console.error('   USDC payment failed:', error.message);
            throw error;
        }
    }
    /**
     * Verify payment completion via Hedera Mirror Node
     */
    async verifyPayment(transactionId) {
        try {
            console.log(`\n🔍 [x402] Verifying payment: ${transactionId}`);
            // Convert transaction ID format from "0.0.X@Y.Z" to "0.0.X-Y-Z"
            // Mirror Node expects "shard.realm.num-sss-nnn" format
            const parts = transactionId.split('@');
            if (parts.length !== 2) {
                console.error('   ❌ Invalid transaction ID format');
                return false;
            }
            const accountId = parts[0]; // e.g., "0.0.7174694"
            const timestamp = parts[1].replace('.', '-'); // e.g., "1762001227.720122522" -> "1762001227-720122522"
            const mirrorNodeTxId = `${accountId}-${timestamp}`;
            // Query Hedera Mirror Node API
            const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${mirrorNodeTxId}`;
            const response = await axios.get(mirrorNodeUrl);
            if (response.data && response.data.transactions && response.data.transactions.length > 0) {
                const tx = response.data.transactions[0];
                const isSuccess = tx.result === 'SUCCESS';
                console.log(`   Status: ${tx.result}`);
                console.log(`   ${isSuccess ? '✅' : '❌'} Payment ${isSuccess ? 'verified' : 'failed'}`);
                return isSuccess;
            }
            console.log('   ❌ Transaction not found');
            return false;
        }
        catch (error) {
            console.error('   ❌ Payment verification failed:', error.message);
            return false;
        }
    }
    /**
     * Create x402 payment request (for 402 Payment Required response)
     */
    createPaymentRequest(productId, amount, currency, recipientAddress) {
        const nonce = `x402-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        return {
            network: 'hedera-testnet',
            to: recipientAddress,
            amount: currency === 'HBAR' ? amount.toString() : (amount * 1_000_000).toString(), // USDC has 6 decimals
            currency: currency === 'USDC' ? this.USDC_TOKEN_ID : currency,
            memo: `x402:${productId}`,
            nonce,
        };
    }
    /**
     * Create x402 payment proof (for X-PAYMENT header)
     */
    createPaymentProof(transactionId, paymentRequest) {
        if (!this.accountId) {
            throw new Error('x402 service not initialized');
        }
        return {
            network: paymentRequest.network,
            transactionId,
            from: this.accountId.toString(),
            to: paymentRequest.to,
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Verify payment proof against payment request
     */
    async verifyPaymentProof(proof, request) {
        try {
            console.log(`\n🔍 [x402] Verifying payment proof`);
            // 1. Verify transaction exists and succeeded
            const isValid = await this.verifyPayment(proof.transactionId);
            if (!isValid) {
                console.log('   ❌ Transaction verification failed');
                return false;
            }
            // 2. Verify payment details match request
            if (proof.to !== request.to) {
                console.log(`   ❌ Recipient mismatch: ${proof.to} !== ${request.to}`);
                return false;
            }
            if (proof.amount !== request.amount) {
                console.log(`   ❌ Amount mismatch: ${proof.amount} !== ${request.amount}`);
                return false;
            }
            if (proof.currency !== request.currency) {
                console.log(`   ❌ Currency mismatch: ${proof.currency} !== ${request.currency}`);
                return false;
            }
            console.log('   ✅ Payment proof verified');
            return true;
        }
        catch (error) {
            console.error('   ❌ Proof verification failed:', error.message);
            return false;
        }
    }
    /**
     * Handle conditional payment (escrow)
     *
     * Creates an escrow payment that will be held until conditions are met.
     * In production, this would interact with the deployed Escrow smart contract.
     */
    async createEscrowPayment(recipientAddress, amount, conditions) {
        try {
            console.log(`\n🔒 [x402] Creating escrow payment:`);
            console.log(`   Recipient: ${recipientAddress}`);
            console.log(`   Amount: ${amount} HBAR`);
            console.log(`   Conditions: ${conditions.join(', ')}`);
            // For now, simulate escrow creation
            // In production, this would call the EscrowFactory contract
            const escrowId = `escrow-${Date.now()}`;
            console.log(`   ✅ Escrow created: ${escrowId}`);
            return escrowId;
        }
        catch (error) {
            console.error('   ❌ Escrow creation failed:', error.message);
            throw error;
        }
    }
    /**
     * Release escrow funds to recipient
     */
    async releaseEscrow(escrowId) {
        try {
            console.log(`\n🔓 [x402] Releasing escrow: ${escrowId}`);
            // In production, call escrow.release() on the smart contract
            const transactionId = `release-${Date.now()}`;
            console.log('   ✅ Escrow released');
            return transactionId;
        }
        catch (error) {
            console.error('   ❌ Escrow release failed:', error.message);
            throw error;
        }
    }
    /**
     * Get account balance (HBAR and USDC)
     */
    async getAccountBalance() {
        if (!this.client || !this.accountId) {
            throw new Error('x402 service not initialized');
        }
        try {
            const balance = await new AccountBalanceQuery()
                .setAccountId(this.accountId)
                .execute(this.client);
            const hbar = balance.hbars.toTinybars().toNumber() / 100_000_000;
            // Get USDC balance
            const tokenId = TokenId.fromString(this.USDC_TOKEN_ID);
            const usdcBalance = balance.tokens?.get(tokenId);
            const usdc = usdcBalance ? usdcBalance.toNumber() / 1_000_000 : 0;
            return { hbar, usdc };
        }
        catch (error) {
            console.error('Failed to get account balance:', error.message);
            throw error;
        }
    }
    /**
     * Get payment history from Hedera Mirror Node
     */
    async getPaymentHistory(accountId, limit = 10) {
        try {
            const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`;
            const response = await axios.get(mirrorNodeUrl);
            if (response.data && response.data.transactions) {
                return response.data.transactions;
            }
            return [];
        }
        catch (error) {
            console.error('Failed to get payment history:', error.message);
            return [];
        }
    }
    /**
     * Close the client connection
     */
    close() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
    }
}
// Singleton instance
export const x402Service = new X402Service();
//# sourceMappingURL=x402.js.map