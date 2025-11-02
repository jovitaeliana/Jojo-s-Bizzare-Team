/**
 * Buyer Agent - LangGraph Implementation
 *
 * Autonomous buyer agent that:
 * 1. Discovers products using ERC-8004 and discovery service
 * 2. Selects best product using LLM
 * 3. Negotiates with seller via A2A protocol
 * 4. Executes payment via x402 (Hedera payment protocol)
 * 5. Confirms delivery and completes transaction
 */
import { Product } from "./prompts/buyerPrompts.js";
/**
 * Buyer Agent State (LangGraph 0.2.x API)
 * Note: All fields with defaults need explicit reducers
 */
declare const BuyerState: import("@langchain/langgraph").AnnotationRoot<{
    userRequest: import("@langchain/langgraph").LastValue<string>;
    userBudget: import("@langchain/langgraph").LastValue<number | undefined>;
    discoveredProducts: import("@langchain/langgraph").BinaryOperatorAggregate<Product[], Product[]>;
    selectedProduct: import("@langchain/langgraph").BinaryOperatorAggregate<Product | null, Product | null>;
    negotiationHistory: import("@langchain/langgraph").BinaryOperatorAggregate<any[], any[]>;
    excludedProductIds: import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
    offerAccepted: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
    paymentId: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, string | null>;
    escrowId: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, string | null>;
    currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    error: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, string | null>;
    finalResult: import("@langchain/langgraph").BinaryOperatorAggregate<any, any>;
}>;
export type BuyerStateType = typeof BuyerState.State;
/**
 * Buyer Agent Class
 */
export declare class BuyerAgent {
    private llm;
    private graph;
    private a2aClient;
    private discoveryService;
    private x402Service;
    private escrowService;
    private agentId;
    private x402Initialized;
    private x402Tool;
    private discoveryTool;
    private a2aTool;
    constructor(agentId: string, apiKey: string);
    /**
     * Initialize payment service with buyer credentials
     */
    initializePayments(accountId: string, privateKey: string): Promise<void>;
    /**
     * Create x402 payment tool for LangSmith tracing
     */
    private createX402PaymentTool;
    /**
     * Create discovery tool for LangSmith tracing
     */
    private createDiscoveryTool;
    /**
     * Create A2A communication tool for LangSmith tracing
     */
    private createA2ATool;
    private safeParseJSON;
    /**
     * Build LangGraph state machine (0.2.x API)
     */
    private buildGraph;
    /**
     * Node: Discover products
     * Now uses LangChain tools for better LangSmith tracing
     */
    private discoverNode;
    /**
     * Node: Select best product using LLM
     */
    private selectNode;
    /**
     * Node: Negotiate with seller via A2A
     */
    private negotiateNode;
    /**
     * Node: Execute payment via x402 (hackathon requirement)
     * Now uses LangChain tool for better LangSmith tracing
     */
    private payNode;
    /**
     * Node: Complete purchase
     */
    private completeNode;
    /**
     * Conditional edge: Should negotiate?
     */
    private shouldNegotiate;
    /**
     * Conditional edge: Should pay?
     */
    private shouldPay;
    /**
     * Execute buyer agent workflow
     */
    executePurchase(userRequest: string, userBudget?: number): Promise<any>;
}
export declare function getBuyerAgent(): Promise<BuyerAgent>;
export {};
//# sourceMappingURL=buyerAgent.d.ts.map