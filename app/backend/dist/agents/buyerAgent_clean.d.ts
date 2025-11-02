/**
 * Buyer Agent - Clean LangGraph 0.2.x Implementation
 *
 * Simplified autonomous buyer agent for MVP demo:
 * 1. Discovers sellers using discovery service
 * 2. Selects best product using LLM
 * 3. Negotiates price via A2A protocol
 * 4. Executes payment via x402
 * 5. Confirms delivery
 */
/**
 * Product interface
 */
export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    condition?: string;
    category?: string;
    sellerAgentId?: string;
    sellerAddress?: string;
}
/**
 * Buyer Agent State (LangGraph 0.2.x Annotation API)
 */
declare const BuyerState: import("@langchain/langgraph").AnnotationRoot<{
    userRequest: import("@langchain/langgraph").LastValue<string>;
    budget: import("@langchain/langgraph").LastValue<number | undefined>;
    discoveredProducts: import("@langchain/langgraph").BinaryOperatorAggregate<Product[], ValueType>;
    selectedProduct: import("@langchain/langgraph").BinaryOperatorAggregate<Product | null, ValueType>;
    currentOffer: import("@langchain/langgraph").LastValue<number | undefined>;
    negotiationHistory: import("@langchain/langgraph").BinaryOperatorAggregate<string[], ValueType>;
    agreedPrice: import("@langchain/langgraph").LastValue<number | undefined>;
    paymentId: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, ValueType>;
    currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<string, ValueType>;
    error: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, ValueType>;
    completed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, ValueType>;
}>;
export type BuyerStateType = typeof BuyerState.State;
/**
 * Buyer Agent Class
 */
export declare class BuyerAgent {
    private graph;
    private llm;
    private a2aClient;
    private discoveryService;
    private x402Service;
    private agentId;
    constructor(agentId: string, config?: {
        groqApiKey?: string;
        a2aBaseUrl?: string;
        a2aApiKey?: string;
    });
    /**
     * Build LangGraph state machine (0.2.x API)
     */
    private buildGraph;
    /**
     * Node: Discover products from marketplace
     */
    private discover;
    /**
     * Node: Select best product using LLM
     */
    private select;
    /**
     * Node: Negotiate price with seller
     */
    private negotiate;
    /**
     * Node: Execute payment via x402
     */
    private pay;
    /**
     * Node: Complete transaction
     */
    private complete;
    /**
     * Conditional: Should we negotiate?
     */
    private shouldNegotiate;
    /**
     * Conditional: Should we pay?
     */
    private shouldPay;
    /**
     * Invoke the buyer agent
     */
    invoke(userRequest: string, budget?: number): Promise<import("@langchain/langgraph").StateType<{
        userRequest: import("@langchain/langgraph").LastValue<string>;
        budget: import("@langchain/langgraph").LastValue<number | undefined>;
        discoveredProducts: import("@langchain/langgraph").BinaryOperatorAggregate<Product[], ValueType>;
        selectedProduct: import("@langchain/langgraph").BinaryOperatorAggregate<Product | null, ValueType>;
        currentOffer: import("@langchain/langgraph").LastValue<number | undefined>;
        negotiationHistory: import("@langchain/langgraph").BinaryOperatorAggregate<string[], ValueType>;
        agreedPrice: import("@langchain/langgraph").LastValue<number | undefined>;
        paymentId: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, ValueType>;
        currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<string, ValueType>;
        error: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, ValueType>;
        completed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, ValueType>;
    }>>;
}
/**
 * Helper: Create buyer agent instance
 */
export declare function createBuyerAgent(agentId?: string): BuyerAgent;
export {};
//# sourceMappingURL=buyerAgent_clean.d.ts.map