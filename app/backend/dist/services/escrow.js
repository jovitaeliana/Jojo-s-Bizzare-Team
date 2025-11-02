/**
 * Escrow Service
 * Manages escrow contracts for secure marketplace transactions
 * Integrates with Hedera smart contracts (Escrow.sol and EscrowFactory.sol)
 */
import { Client, ContractExecuteTransaction, ContractCallQuery, Hbar, AccountId, PrivateKey, ContractFunctionParameters, ContractId, } from '@hashgraph/sdk';
import dotenv from 'dotenv';
dotenv.config();
export var EscrowState;
(function (EscrowState) {
    EscrowState[EscrowState["Created"] = 0] = "Created";
    EscrowState[EscrowState["Funded"] = 1] = "Funded";
    EscrowState[EscrowState["Shipped"] = 2] = "Shipped";
    EscrowState[EscrowState["Completed"] = 3] = "Completed";
    EscrowState[EscrowState["Refunded"] = 4] = "Refunded";
})(EscrowState || (EscrowState = {}));
/**
 * EscrowService
 * Provides methods to interact with Escrow smart contracts on Hedera
 */
export class EscrowService {
    client;
    factoryAddress;
    operatorAccountId;
    operatorPrivateKey;
    constructor() {
        // Initialize Hedera client for testnet
        this.client = Client.forTestnet();
        // Set operator (platform account)
        this.operatorAccountId = process.env.PLATFORM_ACCOUNT_ID || process.env.BUYER_ACCOUNT_ID || '';
        this.operatorPrivateKey = process.env.PLATFORM_PRIVATE_KEY || process.env.BUYER_PRIVATE_KEY || '';
        if (!this.operatorAccountId || !this.operatorPrivateKey) {
            throw new Error('PLATFORM_ACCOUNT_ID and PLATFORM_PRIVATE_KEY must be set in environment');
        }
        // Remove 0x prefix if present
        let privateKey = this.operatorPrivateKey;
        if (privateKey.startsWith('0x')) {
            privateKey = privateKey.substring(2);
        }
        this.client.setOperator(AccountId.fromString(this.operatorAccountId), PrivateKey.fromStringECDSA(privateKey));
        // Get factory address from environment
        this.factoryAddress = process.env.ESCROW_FACTORY_ADDRESS || '';
        if (!this.factoryAddress) {
            console.warn('⚠️ ESCROW_FACTORY_ADDRESS not set - escrow features will be limited');
        }
        // Convert to EVM address if it's in account ID format
        if (this.factoryAddress && this.factoryAddress.startsWith('0.0.')) {
            const factoryAccountId = AccountId.fromString(this.factoryAddress);
            const evmAddress = factoryAccountId.toSolidityAddress();
            console.log(`   Converting factory address: ${this.factoryAddress} → ${evmAddress}`);
            // Keep the account ID format for Hedera SDK
        }
        console.log('✅ EscrowService initialized');
        console.log(`   Factory: ${this.factoryAddress || 'NOT SET'}`);
        console.log(`   Operator: ${this.operatorAccountId}`);
    }
    /**
     * Create new escrow instance via factory
     * @param buyerAddress Hedera account ID of buyer (e.g., "0.0.12345")
     * @param sellerAddress Hedera account ID of seller (e.g., "0.0.67890")
     * @returns Escrow contract address
     */
    async createEscrow(buyerAddress, sellerAddress) {
        console.log(`\n📝 Creating escrow for buyer ${buyerAddress} and seller ${sellerAddress}`);
        if (!this.factoryAddress) {
            throw new Error('ESCROW_FACTORY_ADDRESS not configured');
        }
        try {
            console.log(`\n📝 Creating escrow for buyer ${buyerAddress} and seller ${sellerAddress}`);
            // Convert account IDs to Solidity addresses
            const buyerAccount = AccountId.fromString(buyerAddress);
            const sellerAccount = AccountId.fromString(sellerAddress);
            console.log(`   Buyer Account: ${buyerAccount.toString()}`);
            console.log(`   Seller Account: ${sellerAccount.toString()}`);
            // Call EscrowFactory.createEscrow(buyer, seller)
            // Use account IDs directly - Hedera will convert them
            const params = new ContractFunctionParameters()
                .addAddress(buyerAccount.toSolidityAddress())
                .addAddress(sellerAccount.toSolidityAddress());
            const tx = new ContractExecuteTransaction()
                .setContractId(this.factoryAddress)
                .setGas(1000000) // Increased gas for contract creation
                .setFunction('createEscrow', params);
            const txResponse = await tx.execute(this.client);
            const receipt = await txResponse.getReceipt(this.client);
            const record = await txResponse.getRecord(this.client);
            console.log(`   Transaction successful: ${txResponse.transactionId.toString()}`);
            // Check if any child contracts were created
            if (record.children && record.children.length > 0) {
                // The first child record should be the escrow contract creation
                const childRecord = record.children[0];
                const childReceipt = await childRecord.getReceipt(this.client);
                if (childReceipt.contractId) {
                    const escrowContractId = childReceipt.contractId.toString();
                    console.log(`✅ Escrow created successfully!`);
                    console.log(`   Escrow Contract ID: ${escrowContractId}`);
                    console.log(`   Transaction: ${txResponse.transactionId.toString()}`);
                    console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/contract/${escrowContractId}`);
                    return escrowContractId;
                }
            }
            // Try to get from contract result
            const contractResult = record.contractFunctionResult;
            if (contractResult) {
                // Get the return value (address of created escrow)
                const returnValue = contractResult.getAddress(0);
                if (returnValue) {
                    console.log(`   Returned EVM address: ${returnValue}`);
                    // The returned value is the EVM address of the created escrow contract
                    // We need to use this EVM address directly for subsequent calls
                    const escrowEvmAddress = returnValue.startsWith('0x') ? returnValue : `0x${returnValue}`;
                    console.log(`✅ Escrow created successfully!`);
                    console.log(`   Escrow EVM Address: ${escrowEvmAddress}`);
                    console.log(`   Transaction: ${txResponse.transactionId.toString()}`);
                    console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`);
                    return escrowEvmAddress;
                }
            }
            // Fallback: use timestamp-based address
            const escrowAddress = `escrow-${Date.now()}`;
            console.log(`⚠️ Could not parse escrow address, using fallback: ${escrowAddress}`);
            console.log(`   Transaction: ${txResponse.transactionId.toString()}`);
            return escrowAddress;
        }
        catch (error) {
            console.error(`❌ Failed to create escrow:`, error.message);
            throw error;
        }
    }
    /**
     * Fund escrow with HBAR
     * @param escrowAddress Escrow contract address
     * @param amountHbar Amount in HBAR
     * @param buyerAccountId Buyer's Hedera account ID
     * @param buyerPrivateKey Buyer's private key
     * @returns Transaction ID
     */
    async fundEscrow(escrowAddress, amountHbar, buyerAccountId, buyerPrivateKey) {
        console.log(`\n💰 Funding escrow ${escrowAddress} with ${amountHbar} HBAR`);
        try {
            // Create client for buyer
            const buyerClient = Client.forTestnet();
            let buyerKey = buyerPrivateKey;
            if (buyerKey.startsWith('0x')) {
                buyerKey = buyerKey.substring(2);
            }
            buyerClient.setOperator(AccountId.fromString(buyerAccountId), PrivateKey.fromStringECDSA(buyerKey));
            // Call Escrow.fund() with HBAR payment
            const tx = new ContractExecuteTransaction()
                .setContractId(this.toContractId(escrowAddress))
                .setGas(150000)
                .setPayableAmount(Hbar.from(amountHbar))
                .setFunction('fund');
            const receipt = await tx.execute(buyerClient);
            const transactionId = receipt.transactionId.toString();
            console.log(`✅ Escrow funded: ${transactionId}`);
            console.log(`   Amount: ${amountHbar} HBAR`);
            console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);
            return transactionId;
        }
        catch (error) {
            console.error(`❌ Failed to fund escrow:`, error.message);
            throw error;
        }
    }
    /**
     * Seller confirms shipment
     * @param escrowAddress Escrow contract address
     * @param sellerAccountId Seller's Hedera account ID
     * @param sellerPrivateKey Seller's private key
     * @returns Transaction ID
     */
    async confirmShipment(escrowAddress, sellerAccountId, sellerPrivateKey) {
        console.log(`\n📦 Confirming shipment for escrow ${escrowAddress}`);
        try {
            // Create client for seller
            const sellerClient = Client.forTestnet();
            let sellerKey = sellerPrivateKey;
            if (sellerKey.startsWith('0x')) {
                sellerKey = sellerKey.substring(2);
            }
            sellerClient.setOperator(AccountId.fromString(sellerAccountId), PrivateKey.fromStringECDSA(sellerKey));
            // Call Escrow.confirmShipment()
            const tx = new ContractExecuteTransaction()
                .setContractId(this.toContractId(escrowAddress))
                .setGas(100000)
                .setFunction('confirmShipment');
            const receipt = await tx.execute(sellerClient);
            const transactionId = receipt.transactionId.toString();
            console.log(`✅ Shipment confirmed: ${transactionId}`);
            console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);
            return transactionId;
        }
        catch (error) {
            console.error(`❌ Failed to confirm shipment:`, error.message);
            throw error;
        }
    }
    /**
     * Buyer confirms delivery (releases funds to seller)
     * @param escrowAddress Escrow contract address
     * @param buyerAccountId Buyer's Hedera account ID
     * @param buyerPrivateKey Buyer's private key
     * @returns Transaction ID
     */
    async confirmDelivery(escrowAddress, buyerAccountId, buyerPrivateKey) {
        console.log(`\n✅ Confirming delivery for escrow ${escrowAddress}`);
        try {
            // Create client for buyer
            const buyerClient = Client.forTestnet();
            let buyerKey = buyerPrivateKey;
            if (buyerKey.startsWith('0x')) {
                buyerKey = buyerKey.substring(2);
            }
            buyerClient.setOperator(AccountId.fromString(buyerAccountId), PrivateKey.fromStringECDSA(buyerKey));
            // Call Escrow.confirmDelivery()
            const tx = new ContractExecuteTransaction()
                .setContractId(this.toContractId(escrowAddress))
                .setGas(100000)
                .setFunction('confirmDelivery');
            const receipt = await tx.execute(buyerClient);
            const transactionId = receipt.transactionId.toString();
            console.log(`✅ Delivery confirmed, funds released: ${transactionId}`);
            console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);
            return transactionId;
        }
        catch (error) {
            console.error(`❌ Failed to confirm delivery:`, error.message);
            throw error;
        }
    }
    /**
     * Get escrow state
     * @param escrowAddress Escrow contract address
     * @returns Escrow details
     */
    async getEscrowState(escrowAddress) {
        console.log(`\n🔍 Querying escrow state for ${escrowAddress}`);
        try {
            // Call Escrow.state() view function
            const query = new ContractCallQuery()
                .setContractId(this.toContractId(escrowAddress))
                .setGas(50000)
                .setFunction('state');
            const result = await query.execute(this.client);
            // Parse result - this is simplified
            // In production, you'd decode the result properly using ABI
            const state = result.getUint8(0);
            console.log(`   State: ${EscrowState[state]}`);
            return {
                buyer: '0.0.0',
                seller: '0.0.0',
                state: state,
                amount: '0',
                escrowAddress,
            };
        }
        catch (error) {
            console.error(`❌ Failed to query escrow state:`, error.message);
            throw error;
        }
    }
    /**
     * Request refund (if conditions allow)
     * @param escrowAddress Escrow contract address
     * @param buyerAccountId Buyer's Hedera account ID
     * @param buyerPrivateKey Buyer's private key
     * @returns Transaction ID
     */
    async refund(escrowAddress, buyerAccountId, buyerPrivateKey) {
        console.log(`\n🔄 Requesting refund for escrow ${escrowAddress}`);
        try {
            // Create client for buyer
            const buyerClient = Client.forTestnet();
            let buyerKey = buyerPrivateKey;
            if (buyerKey.startsWith('0x')) {
                buyerKey = buyerKey.substring(2);
            }
            buyerClient.setOperator(AccountId.fromString(buyerAccountId), PrivateKey.fromStringECDSA(buyerKey));
            // Call Escrow.refund()
            const tx = new ContractExecuteTransaction()
                .setContractId(this.toContractId(escrowAddress))
                .setGas(100000)
                .setFunction('refund');
            const receipt = await tx.execute(buyerClient);
            const transactionId = receipt.transactionId.toString();
            console.log(`✅ Refund processed: ${transactionId}`);
            console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);
            return transactionId;
        }
        catch (error) {
            console.error(`❌ Failed to process refund:`, error.message);
            throw error;
        }
    }
    /**
     * Convert Hedera account ID to Solidity address format
     * @param accountId Hedera account ID (e.g., "0.0.12345")
     * @returns Solidity address (20 bytes = 40 hex characters with 0x prefix)
     */
    accountIdToSolidityAddress(accountId) {
        // Use Hedera SDK's built-in conversion
        const account = AccountId.fromString(accountId);
        const solidityAddr = account.toSolidityAddress();
        // Ensure 0x prefix for Hedera SDK
        if (!solidityAddr.startsWith('0x')) {
            return `0x${solidityAddr}`;
        }
        return solidityAddr;
    }
    /**
     * Convert escrow address to ContractId
     * Handles both EVM address format (0x...) and Hedera account ID format (0.0.xxxxx)
     * @param escrowAddress Escrow contract address
     * @returns ContractId or string that can be used with setContractId()
     */
    toContractId(escrowAddress) {
        if (escrowAddress.startsWith('0x')) {
            // EVM address format - convert to ContractId
            return ContractId.fromEvmAddress(0, 0, escrowAddress);
        }
        else {
            // Hedera account ID format
            return escrowAddress;
        }
    }
}
// Export singleton instance
let escrowServiceInstance = null;
export function getEscrowService() {
    if (!escrowServiceInstance) {
        escrowServiceInstance = new EscrowService();
    }
    return escrowServiceInstance;
}
//# sourceMappingURL=escrow.js.map