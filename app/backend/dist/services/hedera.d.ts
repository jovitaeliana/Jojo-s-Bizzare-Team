export declare class HederaService {
    private client;
    private accountId;
    private privateKey;
    /**
     * Initialize Hedera client connection to testnet
     */
    initialize(accountIdStr: string, privateKeyStr: string): Promise<void>;
    /**
     * Transfer HBAR or tokens to another account
     */
    transferPayment(recipientId: string, amount: number, memo?: string): Promise<string>;
    /**
     * Get account balance
     */
    getAccountBalance(): Promise<number>;
    /**
     * Close the client connection
     */
    close(): void;
}
export declare const hederaService: HederaService;
//# sourceMappingURL=hedera.d.ts.map