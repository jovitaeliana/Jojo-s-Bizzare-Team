/**
 * Hedera Consensus Service (HCS) Logging
 * 
 * Provides comprehensive audit trails for all agent interactions
 * by logging events to Hedera Consensus Service topics.
 * 
 * All messages are immutable, timestamped, and publicly verifiable on HashScan.
 */

import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  AccountId,
  PrivateKey,
  TopicId,
  TopicInfoQuery,
} from '@hashgraph/sdk';

/**
 * Event types for HCS logging
 */
export enum HCSEventType {
  AGENT_REGISTERED = 'AGENT_REGISTERED',
  DISCOVERY_STARTED = 'DISCOVERY_STARTED',
  AGENTS_DISCOVERED = 'AGENTS_DISCOVERED',
  PRODUCT_SELECTED = 'PRODUCT_SELECTED',
  NEGOTIATION_STARTED = 'NEGOTIATION_STARTED',
  NEGOTIATION_ROUND = 'NEGOTIATION_ROUND',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ESCROW_CREATED = 'ESCROW_CREATED',
  ESCROW_FUNDED = 'ESCROW_FUNDED',
  SHIPMENT_CONFIRMED = 'SHIPMENT_CONFIRMED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  A2A_MESSAGE_SENT = 'A2A_MESSAGE_SENT',
  A2A_MESSAGE_RECEIVED = 'A2A_MESSAGE_RECEIVED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
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
export class HCSService {
  private client: Client | null = null;
  private accountId: AccountId | null = null;
  private privateKey: PrivateKey | null = null;
  private topicId: TopicId | null = null;
  private initialized: boolean = false;

  /**
   * Initialize HCS service with Hedera credentials
   */
  async initialize(accountIdStr: string, privateKeyStr: string): Promise<void> {
    try {
      this.accountId = AccountId.fromString(accountIdStr);
      this.privateKey = PrivateKey.fromStringECDSA(privateKeyStr);

      // Create client for Hedera testnet
      this.client = Client.forTestnet();
      this.client.setOperator(this.accountId, this.privateKey);

      console.log('✅ HCS service initialized for account:', accountIdStr);
      this.initialized = true;
    } catch (error: any) {
      console.error('❌ Failed to initialize HCS service:', error.message);
      throw error;
    }
  }

  /**
   * Create a new HCS topic for logging
   * @param memo Optional memo for the topic
   * @returns Topic ID
   */
  async createTopic(memo?: string): Promise<string> {
    if (!this.client || !this.accountId) {
      throw new Error('HCS service not initialized');
    }

    try {
      console.log('\n📝 Creating HCS topic for agent interaction logging...');

      const transaction = new TopicCreateTransaction()
        .setAdminKey(this.privateKey!)
        .setSubmitKey(this.privateKey!);

      if (memo) {
        transaction.setTopicMemo(memo);
      }

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      this.topicId = receipt.topicId!;
      const topicIdStr = this.topicId.toString();

      console.log(`✅ HCS topic created: ${topicIdStr}`);
      console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/topic/${topicIdStr}`);

      return topicIdStr;
    } catch (error: any) {
      console.error('❌ Failed to create HCS topic:', error.message);
      throw error;
    }
  }

  /**
   * Set existing topic ID (if topic already exists)
   */
  setTopicId(topicIdStr: string): void {
    this.topicId = TopicId.fromString(topicIdStr);
    console.log(`✅ HCS topic set to: ${topicIdStr}`);
  }

  /**
   * Log an agent interaction event to HCS
   */
  async logEvent(
    eventType: HCSEventType,
    agentId: string,
    data: any,
    transactionId?: string
  ): Promise<string> {
    if (!this.client || !this.topicId) {
      throw new Error('HCS service not initialized or topic not created');
    }

    try {
      const event: HCSEvent = {
        eventType,
        timestamp: new Date().toISOString(),
        agentId,
        transactionId,
        data,
      };

      const message = JSON.stringify(event);

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      const sequenceNumber = receipt.topicSequenceNumber?.toString() || 'unknown';

      console.log(`   📋 HCS logged: ${eventType} (seq: ${sequenceNumber})`);

      return sequenceNumber;
    } catch (error: any) {
      console.error(`   ❌ Failed to log HCS event ${eventType}:`, error.message);
      // Don't throw - logging failures shouldn't break the workflow
      return 'failed';
    }
  }

  /**
   * Log agent discovery event
   */
  async logDiscovery(agentId: string, capability: string, discoveredAgents: any[]): Promise<string> {
    return this.logEvent(
      HCSEventType.AGENTS_DISCOVERED,
      agentId,
      {
        capability,
        count: discoveredAgents.length,
        agents: discoveredAgents.map(a => ({
          agentId: a.agentId,
          name: a.name,
          endpoint: a.endpoint,
        })),
      }
    );
  }

  /**
   * Log product selection event
   */
  async logProductSelection(agentId: string, product: any): Promise<string> {
    return this.logEvent(
      HCSEventType.PRODUCT_SELECTED,
      agentId,
      {
        productId: product.id,
        productName: product.name,
        price: product.price,
        currency: product.currency,
        seller: product.seller,
      }
    );
  }

  /**
   * Log negotiation event
   */
  async logNegotiation(
    agentId: string,
    round: number,
    offer: any,
    counterOffer?: any,
    accepted?: boolean
  ): Promise<string> {
    const eventType = accepted
      ? HCSEventType.OFFER_ACCEPTED
      : counterOffer
      ? HCSEventType.NEGOTIATION_ROUND
      : HCSEventType.NEGOTIATION_STARTED;

    return this.logEvent(eventType, agentId, {
      round,
      offer,
      counterOffer,
      accepted,
    });
  }

  /**
   * Log payment event
   */
  async logPayment(
    agentId: string,
    paymentId: string,
    amount: number,
    currency: string,
    seller: string,
    success: boolean
  ): Promise<string> {
    const eventType = success ? HCSEventType.PAYMENT_COMPLETED : HCSEventType.PAYMENT_FAILED;

    return this.logEvent(
      eventType,
      agentId,
      {
        paymentId,
        amount,
        currency,
        seller,
        hashscanUrl: `https://hashscan.io/testnet/transaction/${paymentId}`,
      },
      paymentId
    );
  }

  /**
   * Log A2A message
   */
  async logA2AMessage(
    agentId: string,
    direction: 'sent' | 'received',
    message: any
  ): Promise<string> {
    const eventType = direction === 'sent'
      ? HCSEventType.A2A_MESSAGE_SENT
      : HCSEventType.A2A_MESSAGE_RECEIVED;

    return this.logEvent(eventType, agentId, {
      method: message.method,
      to: message.to,
      from: message.from,
      params: message.params,
    });
  }

  /**
   * Log transaction completion
   */
  async logTransactionComplete(
    agentId: string,
    transactionId: string,
    details: any
  ): Promise<string> {
    return this.logEvent(
      HCSEventType.TRANSACTION_COMPLETED,
      agentId,
      details,
      transactionId
    );
  }

  /**
   * Log error
   */
  async logError(agentId: string, error: string, context?: any): Promise<string> {
    return this.logEvent(HCSEventType.ERROR_OCCURRED, agentId, {
      error,
      context,
    });
  }

  /**
   * Get topic info
   */
  async getTopicInfo(): Promise<any> {
    if (!this.client || !this.topicId) {
      throw new Error('HCS service not initialized or topic not created');
    }

    try {
      const query = new TopicInfoQuery().setTopicId(this.topicId);
      const info = await query.execute(this.client);

      return {
        topicId: this.topicId.toString(),
        memo: info.topicMemo,
        sequenceNumber: info.sequenceNumber.toString(),
        adminKey: info.adminKey?.toString(),
        submitKey: info.submitKey?.toString(),
      };
    } catch (error: any) {
      console.error('Failed to get topic info:', error.message);
      throw error;
    }
  }

  /**
   * Get topic ID
   */
  getTopicId(): string | null {
    return this.topicId?.toString() || null;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.topicId !== null;
  }
}

// Singleton instance
export const hcsService = new HCSService();

