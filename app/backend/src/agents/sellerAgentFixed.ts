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

import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { X402Service } from "../services/x402.js";
import { A2AMessage } from "../types/a2a.js";
import {
  Listing,
  BuyerOffer,
  createOfferEvaluationPrompt,
  createShipmentConfirmationPrompt,
} from "./prompts/sellerPrompts.js";

/**
 * Seller Agent State (LangGraph 0.2.x API)
 */
const SellerState = Annotation.Root({
  listing: Annotation<Listing | null>({
    default: () => null
  }),
  incomingOffers: Annotation<BuyerOffer[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => []
  }),
  currentOffer: Annotation<BuyerOffer | null>({
    default: () => null
  }),
  offerEvaluation: Annotation<{
    acceptable: boolean;
    action: "accept" | "counter" | "reject";
    counterOffer?: number;
    message: string;
    reasoning: string;
  } | null>({
    default: () => null
  }),
  paymentReceived: Annotation<boolean>({
    default: () => false
  }),
  shipmentConfirmed: Annotation<boolean>({
    default: () => false
  }),
  currentStep: Annotation<string>({
    default: () => 'init'
  }),
  error: Annotation<string | null>({
    default: () => null
  }),
  finalResult: Annotation<any | null>({
    default: () => null
  })
});

export type SellerStateType = typeof SellerState.State;

/**
 * Seller Agent Class
 */
export class SellerAgent {
  private llm: ChatGroq;
  private graph: ReturnType<typeof this.buildGraph>;
  private x402Service: X402Service;
  private agentId: string;

  constructor(agentId: string, apiKey: string) {
    this.agentId = agentId;

    // Initialize Groq LLM
    this.llm = new ChatGroq({
      apiKey: apiKey || process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    // Initialize services
    this.x402Service = new X402Service();

    // Build state graph
    this.graph = this.buildGraph();
  }

  /**
   * Build LangGraph state machine (0.2.x API)
   */
  private buildGraph() {
    const workflow = new StateGraph(SellerState);

    // Add nodes
    workflow.addNode("list", this.listNode.bind(this));
    workflow.addNode("wait", this.waitNode.bind(this));
    workflow.addNode("evaluate", this.evaluateNode.bind(this));
    workflow.addNode("accept", this.acceptNode.bind(this));
    workflow.addNode("ship", this.shipNode.bind(this));

    // Add edges
    workflow.addEdge("list", "wait");
    workflow.addConditionalEdges("wait", this.hasOffer.bind(this), {
      evaluate: "evaluate",
      wait: "wait",
    });
    workflow.addConditionalEdges("evaluate", this.shouldAccept.bind(this), {
      accept: "accept",
      wait: "wait", // Rejected, wait for next offer
    });
    workflow.addConditionalEdges("accept", this.hasPayment.bind(this), {
      ship: "ship",
      wait: "wait",
    });
    workflow.addEdge("ship", END);

    // Set entry point
    workflow.setEntryPoint("list");

    return workflow.compile();
  }

  // NOTE: Node methods need to be updated with SellerStateType
  // This is a template - full implementation should match original logic

  private async listNode(state: SellerStateType): Promise<Partial<SellerStateType>> {
    // Implementation from original
    return { currentStep: 'list' };
  }

  private async waitNode(state: SellerStateType): Promise<Partial<SellerStateType>> {
    // Implementation from original
    return { currentStep: 'wait' };
  }

  private async evaluateNode(state: SellerStateType): Promise<Partial<SellerStateType>> {
    // Implementation from original
    return { currentStep: 'evaluate' };
  }

  private async acceptNode(state: SellerStateType): Promise<Partial<SellerStateType>> {
    // Implementation from original
    return { currentStep: 'accept' };
  }

  private async shipNode(state: SellerStateType): Promise<Partial<SellerStateType>> {
    // Implementation from original
    return { currentStep: 'ship' };
  }

  private hasOffer(state: SellerStateType): string {
    return state.currentOffer ? 'evaluate' : 'wait';
  }

  private shouldAccept(state: SellerStateType): string {
    return state.offerEvaluation?.acceptable ? 'accept' : 'wait';
  }

  private hasPayment(state: SellerStateType): string {
    return state.paymentReceived ? 'ship' : 'wait';
  }

  /**
   * Invoke the seller agent
   */
  async invoke(input: Partial<SellerStateType>) {
    return await this.graph.invoke(input);
  }

  /**
   * Handle incoming A2A message (offer from buyer)
   */
  async handleOffer(message: A2AMessage): Promise<A2AMessage> {
    // Extract offer from message
    const offerData = message.metadata?.negotiation;

    if (!offerData) {
      throw new Error("No offer data in message");
    }

    const offer: BuyerOffer = {
      buyerId: offerData.buyerId,
      listingId: offerData.listingId,
      offerPrice: offerData.offer,
      timestamp: Date.now(),
    };

    // Process through state machine
    const result = await this.graph.invoke({
      incomingOffers: [offer],
      currentOffer: offer,
    });

    // Return response message
    const response: A2AMessage = {
      role: "agent",
      parts: [{
        kind: "text",
        text: result.offerEvaluation?.message || "Offer processed"
      }],
      metadata: {
        negotiation: {
          status: result.offerEvaluation?.action,
          counterOffer: result.offerEvaluation?.counterOffer,
          reasoning: result.offerEvaluation?.reasoning
        }
      }
    };

    return response;
  }
}
