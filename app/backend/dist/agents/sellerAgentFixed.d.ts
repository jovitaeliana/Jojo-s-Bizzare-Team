/**
 * Seller Agent - LangGraph Implementation (0.2.x API)
 *
 * Autonomous seller agent that:
 * 1. Creates and publishes product listings
 * 2. Listens for buyer offers via A2A protocol
 * 3. Evaluates offers using LLM
 * 4. Accepts/rejects/counters offers
 * 5. Confirms shipment after payment
 */
import { A2AMessage } from "../types/a2a.js";
import { Listing, BuyerOffer } from "./prompts/sellerPrompts.js";
/**
 * Seller Agent State (LangGraph 0.2.x API)
 */
declare const SellerState: import("@langchain/langgraph").AnnotationRoot<{
    listing: import("@langchain/langgraph").BinaryOperatorAggregate<Listing | null, ValueType>;
    incomingOffers: import("@langchain/langgraph").BinaryOperatorAggregate<BuyerOffer[], BuyerOffer[]>;
    currentOffer: import("@langchain/langgraph").BinaryOperatorAggregate<BuyerOffer | null, ValueType>;
    offerEvaluation: import("@langchain/langgraph").BinaryOperatorAggregate<{
        acceptable: boolean;
        action: "accept" | "counter" | "reject";
        counterOffer?: number;
        message: string;
        reasoning: string;
    } | null, ValueType>;
    paymentReceived: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, ValueType>;
    shipmentConfirmed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, ValueType>;
    currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<string, ValueType>;
    error: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, ValueType>;
    finalResult: import("@langchain/langgraph").BinaryOperatorAggregate<any, ValueType>;
}>;
export type SellerStateType = typeof SellerState.State;
/**
 * Seller Agent Class
 */
export declare class SellerAgent {
    private llm;
    private graph;
    private x402Service;
    private agentId;
    constructor(agentId: string, apiKey: string);
    /**
     * Build LangGraph state machine (0.2.x API)
     */
    private buildGraph;
    private listNode;
    private waitNode;
    private evaluateNode;
    private acceptNode;
    private shipNode;
    private hasOffer;
    private shouldAccept;
    private hasPayment;
    /**
     * Invoke the seller agent
     */
    invoke(input: Partial<SellerStateType>): Promise<import("@langchain/langgraph").StateType<{
        listing: import("@langchain/langgraph").BinaryOperatorAggregate<Listing | null, ValueType>;
        incomingOffers: import("@langchain/langgraph").BinaryOperatorAggregate<BuyerOffer[], BuyerOffer[]>;
        currentOffer: import("@langchain/langgraph").BinaryOperatorAggregate<BuyerOffer | null, ValueType>;
        offerEvaluation: import("@langchain/langgraph").BinaryOperatorAggregate<{
            acceptable: boolean;
            action: "accept" | "counter" | "reject";
            counterOffer?: number;
            message: string;
            reasoning: string;
        } | null, ValueType>;
        paymentReceived: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, ValueType>;
        shipmentConfirmed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, ValueType>;
        currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<string, ValueType>;
        error: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, ValueType>;
        finalResult: import("@langchain/langgraph").BinaryOperatorAggregate<any, ValueType>;
    }>>;
    /**
     * Handle incoming A2A message (offer from buyer)
     */
    handleOffer(message: A2AMessage): Promise<A2AMessage>;
}
export {};
//# sourceMappingURL=sellerAgentFixed.d.ts.map