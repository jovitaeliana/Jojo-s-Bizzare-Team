/**
 * Seller Agent - LangGraph Implementation
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
declare const SellerState: import("@langchain/langgraph").AnnotationRoot<{
    listing: import("@langchain/langgraph").BinaryOperatorAggregate<Listing | null, Listing | null>;
    incomingOffers: import("@langchain/langgraph").BinaryOperatorAggregate<BuyerOffer[], BuyerOffer[]>;
    currentOffer: import("@langchain/langgraph").BinaryOperatorAggregate<BuyerOffer | null, BuyerOffer | null>;
    offerEvaluation: import("@langchain/langgraph").BinaryOperatorAggregate<any, any>;
    paymentReceived: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
    shipmentConfirmed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
    currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    error: import("@langchain/langgraph").BinaryOperatorAggregate<string | null, string | null>;
    finalResult: import("@langchain/langgraph").BinaryOperatorAggregate<any, any>;
}>;
export type SellerStateType = typeof SellerState.State;
export declare class SellerAgent {
    private llm;
    private graph;
    constructor(apiKey: string);
    private safeParseJSON;
    private buildGraph;
    private listNode;
    private waitNode;
    private evaluateNode;
    private acceptNode;
    private shipNode;
    private hasOffer;
    private shouldAccept;
    private hasPayment;
    handleBuyerMessage(message: A2AMessage, agentId: string): Promise<A2AMessage>;
    /**
     * Handle listing request from buyer
     */
    private handleListingRequest;
    /**
     * Handle purchase offer from buyer
     */
    private handlePurchaseOffer;
    executeSale(listing: Listing): Promise<any>;
}
export declare function getSellerAgent(): SellerAgent;
export {};
//# sourceMappingURL=sellerAgent.d.ts.map