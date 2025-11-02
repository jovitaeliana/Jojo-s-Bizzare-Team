/**
 * Escrow Service
 * Manages escrow contracts for secure marketplace transactions
 * Integrates with Hedera smart contracts (Escrow.sol and EscrowFactory.sol)
 */
export declare enum EscrowState {
    Created = 0,
    Funded = 1,
    Shipped = 2,
    Completed = 3,
    Refunded = 4
}
export interface EscrowDetails {
    buyer: string;
    seller: string;
    state: EscrowState;
    amount: string;
    escrowAddress: string;
}
/**
 * EscrowService
 * Provides methods to interact with Escrow smart contracts on Hedera
 */
export declare class EscrowService {
    private client;
    private factoryAddress;
    private operatorAccountId;
    private operatorPrivateKey;
    constructor();
    /**
     * Create new escrow instance via factory
     * @param buyerAddress Hedera account ID of buyer (e.g., "0.0.12345")
     * @param sellerAddress Hedera account ID of seller (e.g., "0.0.67890")
     * @returns Escrow contract address
     */
    createEscrow(buyerAddress: string, sellerAddress: string): Promise<string>;
    /**
     * Fund escrow with HBAR
     * @param escrowAddress Escrow contract address
     * @param amountHbar Amount in HBAR
     * @param buyerAccountId Buyer's Hedera account ID
     * @param buyerPrivateKey Buyer's private key
     * @returns Transaction ID
     */
    fundEscrow(escrowAddress: string, amountHbar: number, buyerAccountId: string, buyerPrivateKey: string): Promise<string>;
    /**
     * Seller confirms shipment
     * @param escrowAddress Escrow contract address
     * @param sellerAccountId Seller's Hedera account ID
     * @param sellerPrivateKey Seller's private key
     * @returns Transaction ID
     */
    confirmShipment(escrowAddress: string, sellerAccountId: string, sellerPrivateKey: string): Promise<string>;
    /**
     * Buyer confirms delivery (releases funds to seller)
     * @param escrowAddress Escrow contract address
     * @param buyerAccountId Buyer's Hedera account ID
     * @param buyerPrivateKey Buyer's private key
     * @returns Transaction ID
     */
    confirmDelivery(escrowAddress: string, buyerAccountId: string, buyerPrivateKey: string): Promise<string>;
    /**
     * Get escrow state
     * @param escrowAddress Escrow contract address
     * @returns Escrow details
     */
    getEscrowState(escrowAddress: string): Promise<EscrowDetails>;
    /**
     * Request refund (if conditions allow)
     * @param escrowAddress Escrow contract address
     * @param buyerAccountId Buyer's Hedera account ID
     * @param buyerPrivateKey Buyer's private key
     * @returns Transaction ID
     */
    refund(escrowAddress: string, buyerAccountId: string, buyerPrivateKey: string): Promise<string>;
    /**
     * Convert Hedera account ID to Solidity address format
     * @param accountId Hedera account ID (e.g., "0.0.12345")
     * @returns Solidity address (20 bytes = 40 hex characters with 0x prefix)
     */
    private accountIdToSolidityAddress;
    /**
     * Convert escrow address to ContractId
     * Handles both EVM address format (0x...) and Hedera account ID format (0.0.xxxxx)
     * @param escrowAddress Escrow contract address
     * @returns ContractId or string that can be used with setContractId()
     */
    private toContractId;
}
export declare function getEscrowService(): EscrowService;
//# sourceMappingURL=escrow.d.ts.map