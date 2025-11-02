/**
 * x402 Payment Protocol Implementation for Hedera
 *
 * Implements the x402 payment protocol (HTTP 402 Payment Required)
 * with native Hedera support for HBAR and USDC payments.
 *
 * Based on: https://github.com/hedera-dev/x402-hedera
 */
/**
 * x402 Payment Request (from 402 response header)
 */
export interface X402PaymentRequest {
    network: string;
    to: string;
    amount: string;
    currency: string;
    memo?: string;
    nonce?: string;
}
/**
 * x402 Payment Proof (sent in X-PAYMENT header)
 */
export interface X402PaymentProof {
    network: string;
    transactionId: string;
    from: string;
    to: string;
    amount: string;
    currency: string;
    timestamp: string;
}
/**
 * x402 Payment Service
 * Handles secure on-chain payments for agent transactions
 */
export declare class X402Service {
    private client;
    private accountId;
    private privateKey;
    private readonly USDC_TOKEN_ID;
    /**
     * Initialize x402 service with Hedera credentials
     */
    initialize(accountIdStr: string, privateKeyStr: string): Promise<void>;
    /**
     * Process payment to an AI agent (HBAR or USDC)
     */
    processAgentPayment(recipientAddress: string, amount: number, currency: string, productId: string): Promise<string>;
    /**
     * Pay with native HBAR
     */
    private payWithHBAR;
    /**
     * Pay with USDC token
     */
    private payWithUSDC;
    /**
     * Verify payment completion via Hedera Mirror Node
     */
    verifyPayment(transactionId: string): Promise<boolean>;
    /**
     * Create x402 payment request (for 402 Payment Required response)
     */
    createPaymentRequest(productId: string, amount: number, currency: string, recipientAddress: string): X402PaymentRequest;
    /**
     * Create x402 payment proof (for X-PAYMENT header)
     */
    createPaymentProof(transactionId: string, paymentRequest: X402PaymentRequest): X402PaymentProof;
    /**
     * Verify payment proof against payment request
     */
    verifyPaymentProof(proof: X402PaymentProof, request: X402PaymentRequest): Promise<boolean>;
    /**
     * Handle conditional payment (escrow)
     *
     * Creates an escrow payment that will be held until conditions are met.
     * In production, this would interact with the deployed Escrow smart contract.
     */
    createEscrowPayment(recipientAddress: string, amount: number, conditions: string[]): Promise<string>;
    /**
     * Release escrow funds to recipient
     */
    releaseEscrow(escrowId: string): Promise<string>;
    /**
     * Get account balance (HBAR and USDC)
     */
    getAccountBalance(): Promise<{
        hbar: number;
        usdc: number;
    }>;
    /**
     * Get payment history from Hedera Mirror Node
     */
    getPaymentHistory(accountId: string, limit?: number): Promise<any[]>;
    /**
     * Close the client connection
     */
    close(): void;
}
export declare const x402Service: X402Service;
//# sourceMappingURL=x402.d.ts.map