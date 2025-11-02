/**
 * Hedera Consensus Service (HCS) Logging
 *
 * Provides comprehensive audit trails for all agent interactions
 * by logging events to Hedera Consensus Service topics.
 *
 * All messages are immutable, timestamped, and publicly verifiable on HashScan.
 */
/**
 * Event types for HCS logging
 */
export declare enum HCSEventType {
    AGENT_REGISTERED = "AGENT_REGISTERED",
    DISCOVERY_STARTED = "DISCOVERY_STARTED",
    AGENTS_DISCOVERED = "AGENTS_DISCOVERED",
    PRODUCT_SELECTED = "PRODUCT_SELECTED",
    NEGOTIATION_STARTED = "NEGOTIATION_STARTED",
    NEGOTIATION_ROUND = "NEGOTIATION_ROUND",
    OFFER_ACCEPTED = "OFFER_ACCEPTED",
    OFFER_REJECTED = "OFFER_REJECTED",
    PAYMENT_INITIATED = "PAYMENT_INITIATED",
    PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    ESCROW_CREATED = "ESCROW_CREATED",
    ESCROW_FUNDED = "ESCROW_FUNDED",
    SHIPMENT_CONFIRMED = "SHIPMENT_CONFIRMED",
    DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
    TRANSACTION_COMPLETED = "TRANSACTION_COMPLETED",
    TRANSACTION_FAILED = "TRANSACTION_FAILED",
    A2A_MESSAGE_SENT = "A2A_MESSAGE_SENT",
    A2A_MESSAGE_RECEIVED = "A2A_MESSAGE_RECEIVED",
    ERROR_OCCURRED = "ERROR_OCCURRED"
}
/**
 * HCS Event structure
 */
export interface HCSEvent {
    eventType: HCSEventType;
    timestamp: string;
    agentId: string;
    transactionId?: string;
    data: any;
}
/**
 * HCS Service for logging agent interactions
 */
export declare class HCSService {
    private client;
    private accountId;
    private privateKey;
    private topicId;
    private initialized;
    /**
     * Initialize HCS service with Hedera credentials
     */
    initialize(accountIdStr: string, privateKeyStr: string): Promise<void>;
    /**
     * Create a new HCS topic for logging
     * @param memo Optional memo for the topic
     * @returns Topic ID
     */
    createTopic(memo?: string): Promise<string>;
    /**
     * Set existing topic ID (if topic already exists)
     */
    setTopicId(topicIdStr: string): void;
    /**
     * Log an agent interaction event to HCS
     */
    logEvent(eventType: HCSEventType, agentId: string, data: any, transactionId?: string): Promise<string>;
    /**
     * Log agent discovery event
     */
    logDiscovery(agentId: string, capability: string, discoveredAgents: any[]): Promise<string>;
    /**
     * Log product selection event
     */
    logProductSelection(agentId: string, product: any): Promise<string>;
    /**
     * Log negotiation event
     */
    logNegotiation(agentId: string, round: number, offer: any, counterOffer?: any, accepted?: boolean): Promise<string>;
    /**
     * Log payment event
     */
    logPayment(agentId: string, paymentId: string, amount: number, currency: string, seller: string, success: boolean): Promise<string>;
    /**
     * Log A2A message
     */
    logA2AMessage(agentId: string, direction: 'sent' | 'received', message: any): Promise<string>;
    /**
     * Log transaction completion
     */
    logTransactionComplete(agentId: string, transactionId: string, details: any): Promise<string>;
    /**
     * Log error
     */
    logError(agentId: string, error: string, context?: any): Promise<string>;
    /**
     * Get topic info
     */
    getTopicInfo(): Promise<any>;
    /**
     * Get topic ID
     */
    getTopicId(): string | null;
    /**
     * Check if initialized
     */
    isInitialized(): boolean;
}
export declare const hcsService: HCSService;
//# sourceMappingURL=hcs.d.ts.map